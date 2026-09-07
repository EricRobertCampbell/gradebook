import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapDatabase } from "./client";
import { createSchoolYear, listSchoolYears } from "./school-years";
import {
  assertImportableGradebook,
  exportDatabaseToFile,
  importDatabaseFromFile,
} from "./transfer";

const createdDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("database transfer", () => {
  it("exports a consistent SQLite copy that can be opened independently", async () => {
    const directory = await createDirectory();
    const livePath = path.join(directory, "live.sqlite");
    const exportPath = path.join(directory, "backup.sqlite");
    const live = await bootstrapDatabase({
      databasePath: livePath,
      migrationsFolder: migrationsFolder(),
    });

    try {
      await createSchoolYear(live.db, "2024-2025");
      await exportDatabaseToFile(live.sqlite, exportPath);
      await createSchoolYear(live.db, "2025-2026");

      const exported = await bootstrapDatabase({
        databasePath: exportPath,
        migrationsFolder: migrationsFolder(),
      });

      try {
        await expect(listSchoolYears(exported.db)).resolves.toEqual([
          expect.objectContaining({ name: "2024-2025" }),
        ]);
        await expect(listSchoolYears(live.db)).resolves.toEqual([
          expect.objectContaining({ name: "2024-2025" }),
          expect.objectContaining({ name: "2025-2026" }),
        ]);
      } finally {
        exported.sqlite.close();
      }
    } finally {
      live.sqlite.close();
    }
  });

  it("replaces the live database from an exported file", async () => {
    const directory = await createDirectory();
    const livePath = path.join(directory, "live.sqlite");
    const sourcePath = path.join(directory, "source.sqlite");
    const live = await bootstrapDatabase({
      databasePath: livePath,
      migrationsFolder: migrationsFolder(),
    });
    const source = await bootstrapDatabase({
      databasePath: sourcePath,
      migrationsFolder: migrationsFolder(),
    });

    try {
      await createSchoolYear(live.db, "Original");
      await createSchoolYear(source.db, "Imported");
      source.sqlite.close();

      let adopted = live;
      await importDatabaseFromFile({
        sourcePath,
        livePath,
        migrationsFolder: migrationsFolder(),
        current: live,
        adopt: (database) => {
          adopted = database;
        },
      });

      await expect(listSchoolYears(adopted.db)).resolves.toEqual([
        expect.objectContaining({ name: "Imported" }),
      ]);
      adopted.sqlite.close();
    } catch (error) {
      live.sqlite.close();
      throw error;
    }
  });

  it("rejects files that are not Gradebook SQLite databases", async () => {
    const directory = await createDirectory();
    const textPath = path.join(directory, "notes.txt");
    await fs.writeFile(textPath, "not a database");

    expect(() => assertImportableGradebook(textPath)).toThrow("That file is not a SQLite database.");

    const otherPath = path.join(directory, "other.sqlite");
    await fs.writeFile(otherPath, Buffer.from("SQLite format 3\0not-a-database"));
    expect(() => assertImportableGradebook(otherPath)).toThrow();
  });

  it("restores the previous database when import bootstrap fails", async () => {
    const directory = await createDirectory();
    const livePath = path.join(directory, "live.sqlite");
    const sourcePath = path.join(directory, "source.sqlite");
    const live = await bootstrapDatabase({
      databasePath: livePath,
      migrationsFolder: migrationsFolder(),
    });
    const source = await bootstrapDatabase({
      databasePath: sourcePath,
      migrationsFolder: migrationsFolder(),
    });

    await createSchoolYear(live.db, "Keep me");
    await createSchoolYear(source.db, "Incoming");
    source.sqlite.close();

    let adopted = live;
    let bootstrapCalls = 0;
    await expect(
      importDatabaseFromFile({
        sourcePath,
        livePath,
        migrationsFolder: migrationsFolder(),
        current: live,
        adopt: (database) => {
          adopted = database;
        },
        bootstrap: async (options) => {
          bootstrapCalls += 1;

          if (bootstrapCalls === 1) {
            throw new Error("bootstrap failed on purpose");
          }

          return bootstrapDatabase(options);
        },
      }),
    ).rejects.toThrow("The previous database was restored.");

    await expect(listSchoolYears(adopted.db)).resolves.toEqual([
      expect.objectContaining({ name: "Keep me" }),
    ]);
    adopted.sqlite.close();
  });
});

async function createDirectory(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-transfer-"));
  createdDirectories.push(directory);
  return directory;
}

function migrationsFolder(): string {
  return path.resolve(process.cwd(), "drizzle");
}
