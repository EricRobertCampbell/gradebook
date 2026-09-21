import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapDatabase } from "./client";

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
});

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
