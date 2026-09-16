import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapDatabase } from "./client";
import { createClass } from "./classes";
import {
  copyCategory,
  copySubcategory,
  copyWork,
  createCategory,
  createSubcategory,
  createWork,
  deleteCategory,
  deleteSubcategory,
  deleteWork,
  getGradingStructure,
  updateCategory,
  updateSubcategory,
  updateWork,
} from "./grading-structure";
import { createSchoolYear } from "./school-years";

const createdDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("grading structure", () => {
  it("creates nested categories, sub-categories, and work", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      await createSchoolYear(db, "2024-2025");
      await createClass(db, {
        schoolYearName: "2024-2025",
        displayName: "Science",
        internalName: "sci-9",
        subject: "Science",
        section: "9A",
        notes: "Course description",
      });

      const category = await createCategory(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        name: "  Unit 1  ",
        notes: "  Matter  ",
        weight: 1,
      });
      expect(category).toEqual(
        expect.objectContaining({ name: "Unit 1", notes: "Matter", weight: 1 }),
      );

      const subcategory = await createSubcategory(db, {
        categoryId: category.id,
        name: "Homework",
        weight: 2,
      });
      const work = await createWork(db, {
        subcategoryId: subcategory.id,
        name: "Worksheet 1",
        notes: "Atoms",
        maximumScore: 10,
        weight: 1,
      });

      await expect(
        getGradingStructure(db, { schoolYearName: "2024-2025", internalName: "sci-9" }),
      ).resolves.toEqual({
        categories: [
          {
            ...category,
            works: [],
            subcategories: [{ ...subcategory, works: [work] }],
          },
        ],
      });

      const renamed = await updateCategory(db, {
        id: category.id,
        name: "Unit 1A",
        notes: "Particles",
        weight: 3,
      });
      expect(renamed.name).toBe("Unit 1A");

      await updateSubcategory(db, {
        id: subcategory.id,
        name: "Quizzes",
        weight: 1,
      });
      await updateWork(db, {
        id: work.id,
        name: "Quiz 1",
        notes: "",
        maximumScore: 20,
        weight: 2,
      });

      await deleteWork(db, { id: work.id });
      await deleteSubcategory(db, { id: subcategory.id });
      await deleteCategory(db, { id: category.id });
      await expect(
        getGradingStructure(db, { schoolYearName: "2024-2025", internalName: "sci-9" }),
      ).resolves.toEqual({ categories: [] });
    } finally {
      sqlite.close();
    }
  });

  it("copies categories, sub-categories, and work with unique names", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      await createSchoolYear(db, "2024-2025");
      await createClass(db, {
        schoolYearName: "2024-2025",
        displayName: "Science",
        internalName: "sci-9",
        subject: "Science",
        section: "9A",
        notes: "Course description",
      });
      const category = await createCategory(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        name: "Unit 1",
        notes: "Matter",
        weight: 1,
      });
      const subcategory = await createSubcategory(db, {
        categoryId: category.id,
        name: "Homework",
        weight: 2,
      });
      const work = await createWork(db, {
        subcategoryId: subcategory.id,
        name: "Worksheet 1",
        notes: "Atoms",
        maximumScore: 10,
        weight: 1,
      });

      const copiedCategory = await copyCategory(db, { id: category.id });
      expect(copiedCategory.name).toBe("Copy of Unit 1");
      const secondCategoryCopy = await copyCategory(db, { id: category.id });
      expect(secondCategoryCopy.name).toBe("Copy of Unit 1 (1)");

      const copiedSubcategory = await copySubcategory(db, { id: subcategory.id });
      expect(copiedSubcategory.name).toBe("Copy of Homework");
      expect(copiedSubcategory.categoryId).toBe(category.id);

      const copiedWork = await copyWork(db, { id: work.id });
      expect(copiedWork.name).toBe("Copy of Worksheet 1");
      expect(copiedWork.subcategoryId).toBe(subcategory.id);

      const structure = await getGradingStructure(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const originalCategory = structure.categories.find((item) => item.id === category.id);
      const duplicatedCategory = structure.categories.find((item) => item.id === copiedCategory.id);

      expect(originalCategory?.subcategories).toHaveLength(2);
      expect(duplicatedCategory?.works).toEqual([]);
      expect(duplicatedCategory?.subcategories).toEqual([
        expect.objectContaining({
          name: "Homework",
          works: [expect.objectContaining({ name: "Worksheet 1", maximumScore: 10 })],
        }),
      ]);
    } finally {
      sqlite.close();
    }
  });

  it("creates, loads, and copies work that belongs to a category", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const { category, subcategory } = await seedScienceStructure(db);
      const categoryWork = await createWork(db, {
        categoryId: category.id,
        name: "Unit test",
        notes: "Directly on the unit",
        maximumScore: 20,
        weight: 1,
      });

      expect(categoryWork.categoryId).toBe(category.id);
      expect(categoryWork.subcategoryId).toBeNull();

      const structure = await getGradingStructure(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const loaded = structure.categories[0];

      expect(loaded?.works).toEqual([categoryWork]);
      expect(loaded?.subcategories).toEqual([
        expect.objectContaining({ id: subcategory.id, works: [] }),
      ]);

      const copiedWork = await copyWork(db, { id: categoryWork.id });
      expect(copiedWork.name).toBe("Copy of Unit test");
      expect(copiedWork.categoryId).toBe(category.id);
      expect(copiedWork.subcategoryId).toBeNull();

      const copiedCategory = await copyCategory(db, { id: category.id });
      const afterCopy = await getGradingStructure(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const duplicated = afterCopy.categories.find((item) => item.id === copiedCategory.id);

      expect(duplicated?.works).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Unit test",
            categoryId: copiedCategory.id,
            subcategoryId: null,
          }),
          expect.objectContaining({
            name: "Copy of Unit test",
            categoryId: copiedCategory.id,
            subcategoryId: null,
          }),
        ]),
      );
      expect(duplicated?.works).toHaveLength(2);
    } finally {
      sqlite.close();
    }
  });

  it("rejects work that belongs to both a category and a sub-category, or to neither", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const { category, subcategory } = await seedScienceStructure(db);

      await expect(
        createWork(db, {
          name: "Orphan",
          notes: "",
          maximumScore: 10,
          weight: 1,
        }),
      ).rejects.toThrow("Work must belong to a category or a sub-category, but not both.");

      await expect(
        createWork(db, {
          categoryId: category.id,
          subcategoryId: subcategory.id,
          name: "Both",
          notes: "",
          maximumScore: 10,
          weight: 1,
        }),
      ).rejects.toThrow("Work must belong to a category or a sub-category, but not both.");
    } finally {
      sqlite.close();
    }
  });
});

async function seedScienceStructure(db: Awaited<ReturnType<typeof openTestDatabase>>["db"]) {
  await createSchoolYear(db, "2024-2025");
  await createClass(db, {
    schoolYearName: "2024-2025",
    displayName: "Science",
    internalName: "sci-9",
    subject: "Science",
    section: "9A",
    notes: "Course description",
  });
  const category = await createCategory(db, {
    schoolYearName: "2024-2025",
    internalName: "sci-9",
    name: "Unit 1",
    notes: "Matter",
    weight: 1,
  });
  const subcategory = await createSubcategory(db, {
    categoryId: category.id,
    name: "Homework",
    weight: 2,
  });

  return { category, subcategory };
}

async function openTestDatabase() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
  createdDirectories.push(directory);

  return bootstrapDatabase({
    databasePath: path.join(directory, "gradebook-test.sqlite"),
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
}
