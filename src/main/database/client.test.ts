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
});

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
