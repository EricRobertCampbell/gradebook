import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { ensureDatabaseStatusMetadata, type GradebookDatabase } from "./status";
import { ensureStructureSortOrder } from "./structure-sort-order";

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
  sqlite.pragma("busy_timeout = 5000");

  if (options.databasePath !== ":memory:") {
    sqlite.pragma("journal_mode = WAL");
  }

  const db = drizzle(sqlite);

  // Drizzle runs every pending migration inside one transaction. SQLite ignores
  // PRAGMA foreign_keys until that transaction commits, so a migration that
  // rebuilds a table would cascade-delete the rows that reference it.
  sqlite.pragma("foreign_keys = OFF");
  try {
    migrate(db, { migrationsFolder: options.migrationsFolder });
  } finally {
    sqlite.pragma("foreign_keys = ON");
  }

  assertForeignKeysHold(sqlite);
  ensureWorkDateColumn(sqlite);
  ensureStructureSortOrder(sqlite);

  return { db, sqlite };
}

export async function bootstrapDatabase(
  options: InitialiseDatabaseOptions,
): Promise<InitialisedDatabase> {
  const initialised = initialiseDatabase(options);
  await ensureDatabaseStatusMetadata(initialised.db);
  return initialised;
}

function assertForeignKeysHold(sqlite: Database.Database): void {
  const rows: unknown = sqlite.pragma("foreign_key_check");

  if (!Array.isArray(rows)) {
    throw new Error("The database foreign keys could not be checked.");
  }

  if (rows.length > 0) {
    throw new Error("The database migration left foreign key references that do not match.");
  }
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
