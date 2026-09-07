import type { InitialisedDatabase } from "./client";
import type { GradebookDatabase } from "./status";

export type DatabaseRuntime = {
  database: InitialisedDatabase;
  databasePath: string;
  migrationsFolder: string;
};

let runtime: DatabaseRuntime | undefined;

export function setDatabaseRuntime(next: DatabaseRuntime): void {
  runtime = next;
}

export function getDatabaseRuntime(): DatabaseRuntime {
  if (!runtime) {
    throw new Error("The database is not available.");
  }

  return runtime;
}

export function getRuntimeDatabase(): GradebookDatabase {
  return getDatabaseRuntime().database.db;
}

export function getRuntimeSqlite(): InitialisedDatabase["sqlite"] {
  return getDatabaseRuntime().database.sqlite;
}

export function replaceRuntimeDatabase(database: InitialisedDatabase): void {
  const current = getDatabaseRuntime();
  runtime = {
    database,
    databasePath: current.databasePath,
    migrationsFolder: current.migrationsFolder,
  };
}
