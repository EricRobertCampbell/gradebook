import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapDatabase, initialiseDatabase } from "./client";

const createdDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("bootstrapDatabase", () => {
  it("adds works.date when a later migration skipped the work date migration", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
    createdDirectories.push(directory);
    const databasePath = path.join(directory, "gradebook-test.sqlite");
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");
    const first = await bootstrapDatabase({ databasePath, migrationsFolder });

    first.sqlite.exec("ALTER TABLE works DROP COLUMN date");
    first.sqlite
      .prepare("UPDATE __drizzle_migrations SET created_at = ?")
      .run(Number.MAX_SAFE_INTEGER);
    first.sqlite.close();

    const reopened = await bootstrapDatabase({ databasePath, migrationsFolder });

    try {
      expect(columnNames(reopened.sqlite, "works")).toContain("date");
    } finally {
      reopened.sqlite.close();
    }
  });

  it("reapplies the goal marks migration when the table already exists", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
    createdDirectories.push(directory);
    const databasePath = path.join(directory, "gradebook-test.sqlite");
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");
    const first = await bootstrapDatabase({ databasePath, migrationsFolder });

    // An older branch can create goal_marks under a different journal tag. After
    // rebase, 0010_goal_marks still needs to record itself without failing.
    const latest = first.sqlite
      .prepare(
        "SELECT created_at AS createdAt FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1",
      )
      .get();

    if (!isMigrationTimestamp(latest)) {
      throw new Error("Expected an applied migration timestamp.");
    }

    first.sqlite
      .prepare("DELETE FROM __drizzle_migrations WHERE created_at = ?")
      .run(latest.createdAt);
    first.sqlite.close();

    const reopened = await bootstrapDatabase({ databasePath, migrationsFolder });

    try {
      expect(tableNames(reopened.sqlite)).toContain("goal_marks");
    } finally {
      reopened.sqlite.close();
    }
  });

  it("keeps saved marks when a migration rebuilds the works table", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
    createdDirectories.push(directory);
    const databasePath = path.join(directory, "gradebook-test.sqlite");
    const partialFolder = path.join(directory, "migrations");
    const fullFolder = path.resolve(process.cwd(), "drizzle");
    await fs.cp(fullFolder, partialFolder, { recursive: true });
    const journalPath = path.join(partialFolder, "meta", "_journal.json");
    const journal: unknown = JSON.parse(await fs.readFile(journalPath, "utf8"));

    if (!isMigrationJournal(journal)) {
      throw new Error("Expected a Drizzle migration journal.");
    }

    journal.entries = journal.entries.filter((entry) => entry.idx <= 6);
    await fs.writeFile(journalPath, JSON.stringify(journal));

    const first = new Database(databasePath);
    first.pragma("foreign_keys = ON");
    migrate(drizzle(first), { migrationsFolder: partialFolder });
    first.exec(`
      INSERT INTO school_years (name) VALUES ('2026-2027');
      INSERT INTO classes (display_name, internal_name, subject, section, notes, school_year_id)
        VALUES ('Math 30-1', 'math-30-1', 'Mathematics', '', 'Course description', 1);
      INSERT INTO students (first_name, last_name, preferred_name, notes, email)
        VALUES ('Ada', 'Lovelace', '', '', '');
      INSERT INTO class_students (class_id, student_id) VALUES (1, 1);
      INSERT INTO categories (class_id, name, notes, weight) VALUES (1, 'Functions', '', 1);
      INSERT INTO subcategories (category_id, name, weight) VALUES (1, 'Homework', 1);
      INSERT INTO works (subcategory_id, name, notes, maximum_score, weight)
        VALUES (1, 'L1 HW', '', 10, 1);
      INSERT INTO assessments (work_id, student_id, score, date, weight, notes, status)
        VALUES (1, 1, 8, '2026-09-16', 1, '', 'counted');
    `);
    first.close();

    const upgraded = initialiseDatabase({ databasePath, migrationsFolder: fullFolder });

    try {
      const mark: unknown = upgraded.sqlite
        .prepare(
          "SELECT work_id AS workId, student_id AS studentId, score, status FROM assessments",
        )
        .get();
      expect(mark).toEqual({ workId: 1, studentId: 1, score: 8, status: "counted" });
      expect(upgraded.sqlite.prepare("SELECT * FROM pragma_foreign_key_check").all()).toEqual([]);
    } finally {
      upgraded.sqlite.close();
    }
  });
});

function isMigrationJournal(value: unknown): value is { entries: Array<{ idx: number }> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "entries" in value &&
    Array.isArray(value.entries) &&
    value.entries.every(isJournalEntry)
  );
}

function isJournalEntry(value: unknown): value is { idx: number } {
  return (
    typeof value === "object" && value !== null && "idx" in value && typeof value.idx === "number"
  );
}

function isMigrationTimestamp(value: unknown): value is { createdAt: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "createdAt" in value &&
    typeof value.createdAt === "number"
  );
}

function tableNames(sqlite: {
  prepare: (source: string) => { all: () => Array<unknown> };
}): Array<string> {
  const rows = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();

  return rows.flatMap((row) => {
    if (typeof row === "object" && row !== null && "name" in row && typeof row.name === "string") {
      return [row.name];
    }

    return [];
  });
}

function columnNames(
  sqlite: { pragma: (source: string) => unknown },
  table: string,
): Array<string> {
  const rows: unknown = sqlite.pragma(`table_info(${table})`);

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.flatMap((row) => {
    if (typeof row === "object" && row !== null && "name" in row && typeof row.name === "string") {
      return [row.name];
    }

    return [];
  });
}
