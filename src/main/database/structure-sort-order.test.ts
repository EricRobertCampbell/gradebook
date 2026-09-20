import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { initialiseDatabase } from "./client";
import { createClass } from "./classes";
import { categories, subcategories, works } from "./schema";
import { createSchoolYear } from "./school-years";

const createdDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("ensureStructureSortOrder", () => {
  it("adds sort order when a later migration record caused Drizzle to skip it", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
    createdDirectories.push(directory);
    const databasePath = path.join(directory, "gradebook-test.sqlite");
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");
    const first = initialiseDatabase({ databasePath, migrationsFolder });

    try {
      await createSchoolYear(first.db, "2024-2025");
      const schoolClass = await createClass(first.db, {
        schoolYearName: "2024-2025",
        displayName: "Science",
        internalName: "sci-9",
        subject: "Science",
        section: "9A",
        notes: "Course description",
      });
      await first.db.insert(categories).values([
        { classId: schoolClass.id, name: "Beta", notes: "", weight: 1, sortOrder: 0 },
        { classId: schoolClass.id, name: "Alpha", notes: "", weight: 1, sortOrder: 1 },
      ]);
      const categoryRows = await first.db
        .select()
        .from(categories)
        .where(eq(categories.classId, schoolClass.id))
        .orderBy(asc(categories.id));
      const beta = categoryRows[0];
      const alpha = categoryRows[1];

      if (!beta || !alpha) {
        throw new Error("Expected two categories.");
      }

      await first.db.insert(subcategories).values([
        { categoryId: alpha.id, name: "Quizzes", weight: 1, sortOrder: 0 },
        { categoryId: alpha.id, name: "Daily", weight: 1, sortOrder: 1 },
      ]);
      await first.db.insert(works).values({
        categoryId: beta.id,
        subcategoryId: null,
        name: "Essay",
        notes: "Course description",
        maximumScore: 10,
        weight: 1,
        sortOrder: 4,
      });
    } finally {
      first.sqlite.close();
    }

    const dropped = initialiseDatabase({ databasePath, migrationsFolder });
    dropped.sqlite.exec("PRAGMA foreign_keys = OFF");
    dropped.sqlite.exec("ALTER TABLE categories DROP COLUMN sort_order");
    dropped.sqlite.exec("ALTER TABLE subcategories DROP COLUMN sort_order");
    dropped.sqlite.exec("ALTER TABLE works DROP COLUMN sort_order");
    dropped.sqlite
      .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
      .run("stale-later-migration", 1789953102899);
    dropped.sqlite.exec("PRAGMA foreign_keys = ON");
    dropped.sqlite.close();

    const repaired = initialiseDatabase({ databasePath, migrationsFolder });

    try {
      const repairedCategories = await repaired.db
        .select({ name: categories.name, sortOrder: categories.sortOrder })
        .from(categories)
        .orderBy(asc(categories.sortOrder));
      const repairedSubcategories = await repaired.db
        .select({ name: subcategories.name, sortOrder: subcategories.sortOrder })
        .from(subcategories)
        .orderBy(asc(subcategories.sortOrder));
      const repairedWorks = await repaired.db
        .select({ name: works.name, sortOrder: works.sortOrder })
        .from(works);

      expect(repairedCategories).toEqual([
        { name: "Alpha", sortOrder: 0 },
        { name: "Beta", sortOrder: 1 },
      ]);
      expect(repairedSubcategories).toEqual([
        { name: "Daily", sortOrder: 0 },
        { name: "Quizzes", sortOrder: 1 },
      ]);
      expect(repairedWorks).toEqual([{ name: "Essay", sortOrder: 0 }]);
    } finally {
      repaired.sqlite.close();
    }
  });

  it("leaves an existing sort order unchanged", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
    createdDirectories.push(directory);
    const databasePath = path.join(directory, "gradebook-test.sqlite");
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");
    const first = initialiseDatabase({ databasePath, migrationsFolder });

    try {
      await createSchoolYear(first.db, "2024-2025");
      const schoolClass = await createClass(first.db, {
        schoolYearName: "2024-2025",
        displayName: "Science",
        internalName: "sci-9",
        subject: "Science",
        section: "9A",
        notes: "Course description",
      });
      await first.db.insert(categories).values({
        classId: schoolClass.id,
        name: "Beta",
        notes: "Course description",
        weight: 1,
        sortOrder: 7,
      });
    } finally {
      first.sqlite.close();
    }

    const reopened = initialiseDatabase({ databasePath, migrationsFolder });

    try {
      await expect(
        reopened.db.select({ sortOrder: categories.sortOrder }).from(categories),
      ).resolves.toEqual([{ sortOrder: 7 }]);
    } finally {
      reopened.sqlite.close();
    }
  });
});
