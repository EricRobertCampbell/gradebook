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

  return { db, sqlite };
}

export async function bootstrapDatabase(
  options: InitialiseDatabaseOptions,
): Promise<InitialisedDatabase> {
  const initialised = initialiseDatabase(options);
  await ensureDatabaseStatusMetadata(initialised.db);
  return initialised;
}
