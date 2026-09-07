import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapDatabase } from "./client";
import { createClass, deleteClass, getClass, listClasses, updateClass } from "./classes";
import { createSchoolYear, deleteSchoolYear } from "./school-years";

const createdDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("classes", () => {
  it("creates, lists alphabetically, updates, and deletes classes within a school year", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const year = await createSchoolYear(db, "2024-2025");
      await expect(listClasses(db, "2024-2025")).resolves.toEqual([]);

      const science = await createClass(db, {
        schoolYearName: "2024-2025",
        displayName: "  Science  ",
        internalName: "  sci-9  ",
        subject: "  Biology  ",
        section: "  9A  ",
        notes: "  Lab group  ",
      });
      expect(science).toEqual({
        id: science.id,
        displayName: "Science",
        internalName: "sci-9",
        subject: "Biology",
        section: "9A",
        notes: "Lab group",
        schoolYearId: year.id,
      });

      await createClass(db, {
        schoolYearName: "2024-2025",
        displayName: "English",
        internalName: "eng-9",
        subject: "English",
        section: "9B",
        notes: "Language set",
      });

      await expect(listClasses(db, "2024-2025")).resolves.toEqual([
        expect.objectContaining({ displayName: "English", internalName: "eng-9" }),
        expect.objectContaining({ displayName: "Science", internalName: "sci-9" }),
      ]);

      await expect(
        getClass(db, { schoolYearName: "2024-2025", internalName: "sci-9" }),
      ).resolves.toEqual(science);

      const renamed = await updateClass(db, {
        schoolYearName: "2024-2025",
        currentInternalName: "sci-9",
        displayName: "Science 9",
        internalName: "sci-9a",
        subject: "Chemistry",
        section: "9C",
        notes: "Moved set",
      });
      expect(renamed).toEqual({
        id: science.id,
        displayName: "Science 9",
        internalName: "sci-9a",
        subject: "Chemistry",
        section: "9C",
        notes: "Moved set",
        schoolYearId: year.id,
      });

      await expect(
        deleteClass(db, { schoolYearName: "2024-2025", internalName: "sci-9a" }),
      ).resolves.toEqual({ deleted: true });
      await expect(listClasses(db, "2024-2025")).resolves.toEqual([
        expect.objectContaining({ internalName: "eng-9" }),
      ]);
    } finally {
      sqlite.close();
    }
  });

  it("enforces unique internal names per school year and required fields", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      await createSchoolYear(db, "2024-2025");
      await createSchoolYear(db, "2025-2026");

      await createClass(db, classInput("2024-2025", "Science", "sci-9"));
      await expect(createClass(db, classInput("2024-2025", "Science again", "sci-9"))).rejects.toThrow(
        'A class with internal name "sci-9" already exists in this school year.',
      );

      await expect(
        createClass(db, classInput("2025-2026", "Science", "sci-9")),
      ).resolves.toEqual(expect.objectContaining({ internalName: "sci-9" }));

      await expect(
        createClass(db, {
          ...classInput("2024-2025", "   ", "math-9"),
        }),
      ).rejects.toThrow("A class display name is required.");
      await expect(
        createClass(db, {
          ...classInput("2024-2025", "Maths", "math/9"),
        }),
      ).rejects.toThrow("An internal class name cannot contain / or #.");
      await expect(
        createClass(db, {
          ...classInput("2024-2025", "Maths", "math-9"),
          subject: "   ",
          section: "",
          notes: "  Calculus  ",
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          displayName: "Maths",
          subject: "",
          section: "",
          notes: "Calculus",
        }),
      );
      await expect(
        createClass(db, {
          ...classInput("2024-2025", "Art", "art-9"),
          notes: "   ",
        }),
      ).rejects.toThrow("A description is required.");
    } finally {
      sqlite.close();
    }
  });

  it("removes classes when their school year is deleted", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      await createSchoolYear(db, "2024-2025");
      await createClass(db, classInput("2024-2025", "Science", "sci-9"));

      await deleteSchoolYear(db, "2024-2025");
      await expect(listClasses(db, "2024-2025")).rejects.toThrow(
        'School year "2024-2025" was not found.',
      );
    } finally {
      sqlite.close();
    }
  });
});

async function openTestDatabase() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
  createdDirectories.push(directory);

  return bootstrapDatabase({
    databasePath: path.join(directory, "gradebook-test.sqlite"),
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
}

function classInput(schoolYearName: string, displayName: string, internalName: string) {
  return {
    schoolYearName,
    displayName,
    internalName,
    subject: "Science",
    section: "9A",
    notes: "Course description",
  };
}
