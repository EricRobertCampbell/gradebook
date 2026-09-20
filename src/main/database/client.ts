import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { ensureDatabaseStatusMetadata, type GradebookDatabase } from "./status";

export type InitialiseDatabaseOptions = {
  databasePath: string;
  migrationsFolder: string;
};

export type InitialisedDatabase = {
  db: GradebookDatabase;
  sqlite: Database.Database;
};

export function initialiseDatabase(options: InitialiseDatabaseOptions): InitialisedDatabase {
  if (options.databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(options.databasePath), { recursive: true });
  }

  const sqlite = new Database(options.databasePath);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  if (options.databasePath !== ":memory:") {
    sqlite.pragma("journal_mode = WAL");
  }

  const db = drizzle(sqlite);

  migrate(db, { migrationsFolder: options.migrationsFolder });
  ensureWorkDateColumn(sqlite);

  return { db, sqlite };
}

export async function bootstrapDatabase(
  options: InitialiseDatabaseOptions,
): Promise<InitialisedDatabase> {
  const initialised = initialiseDatabase(options);
  await ensureDatabaseStatusMetadata(initialised.db);
  return initialised;
}

function ensureWorkDateColumn(sqlite: Database.Database): void {
  const columns = tableColumnNames(sqlite, "works");

  if (columns.length === 0 || columns.includes("date")) {
    return;
  }

  // Drizzle skips a migration whose journal timestamp is older than the newest
  // applied migration. Another branch can record a later migration first, which
  // leaves this column missing even though 0008_work_date is in the journal.
  sqlite.exec("ALTER TABLE `works` ADD `date` text");
}

function tableColumnNames(sqlite: Database.Database, table: string): Array<string> {
  const rows: unknown = sqlite.pragma(`table_info(${table})`);

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.flatMap((row) => (isNamedColumn(row) ? [row.name] : []));
}

function isNamedColumn(value: unknown): value is { name: string } {
  return (
    typeof value === "object" && value !== null && "name" in value && typeof value.name === "string"
  );
}
