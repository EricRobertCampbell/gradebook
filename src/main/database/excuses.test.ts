import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createClass } from "./classes";
import { bootstrapDatabase } from "./client";
import { setAllExcuses, setExcuse } from "./excuses";
import { addStudentToClass } from "./enrolments";
import { getClassGradebook } from "./gradebook";
import { createCategory, createSubcategory } from "./grading-structure";
import { createSchoolYear } from "./school-years";
import { createStudent } from "./students";

const createdDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("excuses", () => {
  it("sets and clears one student's category excuse", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedClass(db);
      await expect(
        setExcuse(db, {
          categoryId: setup.category.id,
          studentId: setup.ada.id,
          excused: true,
        }),
      ).resolves.toEqual({ excused: true });
      await expect(
        setExcuse(db, {
          categoryId: setup.category.id,
          studentId: setup.ada.id,
          excused: true,
        }),
      ).resolves.toEqual({ excused: true });

      const excused = await gradebookRow(db, setup.ada.id);
      expect(excused?.categories[0]?.excused).toBe(true);

      await expect(
        setExcuse(db, {
          categoryId: setup.category.id,
          studentId: setup.ada.id,
          excused: false,
        }),
      ).resolves.toEqual({ excused: false });

      const cleared = await gradebookRow(db, setup.ada.id);
      expect(cleared?.categories[0]?.excused).toBe(false);
    } finally {
      sqlite.close();
    }
  });

  it("rejects a student who is not enrolled in the class", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedClass(db);
      const outsider = await createStudent(db, studentInput("Out", "Sider"));

      await expect(
        setExcuse(db, {
          subcategoryId: setup.subcategory.id,
          studentId: outsider.id,
          excused: true,
        }),
      ).rejects.toThrow("That student is not in this class.");
    } finally {
      sqlite.close();
    }
  });

  it("excuses only the students enrolled at that moment", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedClass(db);
      const excused = await setAllExcuses(db, {
        categoryId: setup.category.id,
        excused: true,
      });

      expect(excused.excusedStudentIds).toHaveLength(2);
      expect(excused.excusedStudentIds).toEqual(
        expect.arrayContaining([setup.ada.id, setup.blair.id]),
      );

      const casey = await createStudent(db, studentInput("Casey", "Ng"));
      await addStudentToClass(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        studentId: casey.id,
      });

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const caseyRow = gradebook.students.find((row) => row.student.id === casey.id);

      expect(caseyRow?.categories[0]?.excused).toBe(false);
      expect(
        gradebook.students.find((row) => row.student.id === setup.ada.id)?.categories[0]?.excused,
      ).toBe(true);
    } finally {
      sqlite.close();
    }
  });

  it("leaves a parent category excuse when a sub-category is cleared for everyone", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedClass(db);
      await setExcuse(db, {
        categoryId: setup.category.id,
        studentId: setup.ada.id,
        excused: true,
      });
      await setExcuse(db, {
        subcategoryId: setup.subcategory.id,
        studentId: setup.ada.id,
        excused: true,
      });
      await setAllExcuses(db, {
        subcategoryId: setup.subcategory.id,
        excused: false,
      });

      const row = await gradebookRow(db, setup.ada.id);

      expect(row?.categories[0]?.excused).toBe(true);
      expect(row?.categories[0]?.subcategories[0]?.excused).toBe(false);
    } finally {
      sqlite.close();
    }
  });
});

async function gradebookRow(
  db: Awaited<ReturnType<typeof openTestDatabase>>["db"],
  studentId: number,
) {
  const gradebook = await getClassGradebook(db, {
    schoolYearName: "2024-2025",
    internalName: "sci-9",
  });

  return gradebook.students.find((row) => row.student.id === studentId);
}

async function seedClass(db: Awaited<ReturnType<typeof openTestDatabase>>["db"]) {
  await createSchoolYear(db, "2024-2025");
  await createClass(db, {
    schoolYearName: "2024-2025",
    displayName: "Science",
    internalName: "sci-9",
    subject: "Science",
    section: "9A",
    notes: "Course description",
  });
  const ada = await createStudent(db, studentInput("Ada", "Lovelace"));
  const blair = await createStudent(db, studentInput("Blair", "Example"));
  await addStudentToClass(db, {
    schoolYearName: "2024-2025",
    internalName: "sci-9",
    studentId: ada.id,
  });
  await addStudentToClass(db, {
    schoolYearName: "2024-2025",
    internalName: "sci-9",
    studentId: blair.id,
  });
  const category = await createCategory(db, {
    schoolYearName: "2024-2025",
    internalName: "sci-9",
    name: "Unit 1",
    notes: "",
    weight: 1,
  });
  const subcategory = await createSubcategory(db, {
    categoryId: category.id,
    name: "Homework",
    weight: 1,
  });

  return { ada, blair, category, subcategory };
}

function studentInput(firstName: string, lastName: string) {
  return {
    firstName,
    lastName,
    preferredName: "",
    notes: "",
    email: "",
  };
}

async function openTestDatabase() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
  createdDirectories.push(directory);

  return bootstrapDatabase({
    databasePath: path.join(directory, "gradebook-test.sqlite"),
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
}
