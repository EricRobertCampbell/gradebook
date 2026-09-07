import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapDatabase } from "./client";
import { createSchoolYear, deleteSchoolYear, listSchoolYears } from "./school-years";

const createdDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

async function openTestDatabase() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
  createdDirectories.push(directory);

  return bootstrapDatabase({
    databasePath: path.join(directory, "gradebook-test.sqlite"),
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
}

describe("school years", () => {
  it("creates, lists, and deletes school years in a temporary database", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      await expect(listSchoolYears(db)).resolves.toEqual([]);

      const created = await createSchoolYear(db, "  2024-2025  ");
      expect(created.name).toBe("2024-2025");
      expect(created.id).toBeGreaterThan(0);

      await createSchoolYear(db, "2025-2026");

      await expect(listSchoolYears(db)).resolves.toEqual([
        { id: created.id, name: "2024-2025" },
        expect.objectContaining({ name: "2025-2026" }),
      ]);

      await expect(deleteSchoolYear(db, "2024-2025")).resolves.toEqual({ deleted: true });
      await expect(listSchoolYears(db)).resolves.toEqual([
        expect.objectContaining({ name: "2025-2026" }),
      ]);
    } finally {
      sqlite.close();
    }
  });

  it("rejects empty, reserved, and duplicate names", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      await expect(createSchoolYear(db, "   ")).rejects.toThrow("A school year name is required.");
      await expect(createSchoolYear(db, "settings")).rejects.toThrow("That name is reserved.");
      await expect(createSchoolYear(db, "students")).rejects.toThrow("That name is reserved.");
      await expect(createSchoolYear(db, "database")).rejects.toThrow("That name is reserved.");
      await expect(createSchoolYear(db, "Year/2024")).rejects.toThrow(
        "A school year name cannot contain / or #.",
      );

      await createSchoolYear(db, "2024-2025");
      await expect(createSchoolYear(db, "2024-2025")).rejects.toThrow(
        'A school year named "2024-2025" already exists.',
      );
      await expect(deleteSchoolYear(db, "missing")).rejects.toThrow(
        'School year "missing" was not found.',
      );
    } finally {
      sqlite.close();
    }
  });
});
