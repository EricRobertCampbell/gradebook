import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DATABASE_STATUS_SUCCESS_MESSAGE } from "../../shared/constants";
import { bootstrapDatabase } from "./client";
import { getDatabaseStatus, mapDatabaseStatus } from "./status";

const createdDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("mapDatabaseStatus", () => {
  it("maps a metadata row to a connected status", () => {
    expect(mapDatabaseStatus({ value: DATABASE_STATUS_SUCCESS_MESSAGE })).toEqual({
      connected: true,
      message: DATABASE_STATUS_SUCCESS_MESSAGE,
    });
  });

  it("maps a missing row to a disconnected status", () => {
    const status = mapDatabaseStatus(undefined);

    expect(status.connected).toBe(false);
    expect(status.message).toContain("no status metadata");
  });
});

describe("getDatabaseStatus", () => {
  it("returns the seeded status from a temporary SQLite database", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
    createdDirectories.push(directory);

    const { db, sqlite } = await bootstrapDatabase({
      databasePath: path.join(directory, "gradebook-test.sqlite"),
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      await expect(getDatabaseStatus(db)).resolves.toEqual({
        connected: true,
        message: DATABASE_STATUS_SUCCESS_MESSAGE,
      });
    } finally {
      sqlite.close();
    }
  });

  it("never uses the development or production database files", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      const status = await getDatabaseStatus(db);
      expect(status.message).toBe(DATABASE_STATUS_SUCCESS_MESSAGE);
    } finally {
      sqlite.close();
    }
  });
});
