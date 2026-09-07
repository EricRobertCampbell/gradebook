import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { DATABASE_STATUS_KEY, DATABASE_STATUS_SUCCESS_MESSAGE } from "../../shared/constants";
import type { DatabaseStatus } from "../../shared/ipc";
import { appMetadata } from "./schema";

export type GradebookDatabase = BetterSQLite3Database;

export type DatabaseStatusRow = {
  value: string;
};

export function mapDatabaseStatus(row: DatabaseStatusRow | undefined): DatabaseStatus {
  if (!row) {
    return {
      connected: false,
      message: "The database is reachable, but no status metadata was found.",
    };
  }

  return {
    connected: true,
    message: row.value,
  };
}

export async function ensureDatabaseStatusMetadata(db: GradebookDatabase): Promise<void> {
  const existing = await db
    .select({ key: appMetadata.key })
    .from(appMetadata)
    .where(eq(appMetadata.key, DATABASE_STATUS_KEY))
    .limit(1);

  if (existing[0]) {
    return;
  }

  await db.insert(appMetadata).values({
    key: DATABASE_STATUS_KEY,
    value: DATABASE_STATUS_SUCCESS_MESSAGE,
  });
}

export async function getDatabaseStatus(db: GradebookDatabase): Promise<DatabaseStatus> {
  const rows = await db
    .select({ value: appMetadata.value })
    .from(appMetadata)
    .where(eq(appMetadata.key, DATABASE_STATUS_KEY))
    .limit(1);

  return mapDatabaseStatus(rows[0]);
}
