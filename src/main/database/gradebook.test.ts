import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAdjustment, deleteAssessment, upsertAssessment } from "./assessments";
import { bootstrapDatabase } from "./client";
import { createClass } from "./classes";
import { addStudentToClass } from "./enrolments";
import { getClassGradebook } from "./gradebook";
import { createCategory, createSubcategory, createWork } from "./grading-structure";
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

describe("class gradebook", () => {
  it("computes assessment, subcategory, category, and course percents", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      const assessment = await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 8,
        date: "2026-09-01",
      });
      await createAdjustment(db, {
        assessmentId: assessment.id,
        percentChange: 5,
        rawChange: 1,
        description: "Bonus",
        notes: "",
      });

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const row = gradebook.students[0];
      const workGrade = row?.categories[0]?.subcategories[0]?.works[0];

      expect(workGrade?.percent).toBeCloseTo(0.95);
      expect(row?.categories[0]?.subcategories[0]?.percent).toBeCloseTo(0.95);
      expect(row?.categories[0]?.percent).toBeCloseTo(0.95);
      expect(row?.coursePercent).toBeCloseTo(0.95);
    } finally {
      sqlite.close();
    }
  });

  it("excludes exempt assessments from averages", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      const extraWork = await createWork(db, {
        subcategoryId: setup.subcategory.id,
        name: "Worksheet 2",
        notes: "",
        maximumScore: 10,
        weight: 1,
      });
      await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 10,
      });
      await upsertAssessment(db, {
        workId: extraWork.id,
        studentId: setup.student.id,
        score: 0,
        status: "exempt",
      });

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const subcategory = gradebook.students[0]?.categories[0]?.subcategories[0];

      expect(subcategory?.works).toHaveLength(2);
      expect(subcategory?.percent).toBe(1);
    } finally {
      sqlite.close();
    }
  });

  it("counts not-handed-in assessments as zero", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      const extraWork = await createWork(db, {
        subcategoryId: setup.subcategory.id,
        name: "Worksheet 2",
        notes: "",
        maximumScore: 10,
        weight: 1,
      });
      await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 10,
      });
      await upsertAssessment(db, {
        workId: extraWork.id,
        studentId: setup.student.id,
        score: 8,
        status: "nhi",
      });

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const subcategory = gradebook.students[0]?.categories[0]?.subcategories[0];
      const nhiWork = subcategory?.works.find((workGrade) => workGrade.workId === extraWork.id);

      expect(nhiWork?.assessment?.status).toBe("nhi");
      expect(nhiWork?.percent).toBe(0);
      expect(subcategory?.percent).toBe(0.5);
    } finally {
      sqlite.close();
    }
  });

  it("averages category-level work with sub-categories", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      const categoryWork = await createWork(db, {
        categoryId: setup.category.id,
        name: "Unit exam",
        notes: "",
        maximumScore: 10,
        weight: 1,
      });
      await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 10,
      });
      await upsertAssessment(db, {
        workId: categoryWork.id,
        studentId: setup.student.id,
        score: 8,
        status: "nhi",
      });

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const categoryGrade = gradebook.students[0]?.categories[0];
      const nhiWork = categoryGrade?.works.find((workGrade) => workGrade.workId === categoryWork.id);

      expect(categoryGrade?.subcategories[0]?.percent).toBe(1);
      expect(nhiWork?.percent).toBe(0);
      expect(categoryGrade?.percent).toBe(0.5);
    } finally {
      sqlite.close();
    }
  });

  it("clears a mark when the assessment is deleted", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 8,
      });
      await deleteAssessment(db, { workId: setup.work.id, studentId: setup.student.id });

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });

      expect(gradebook.students[0]?.categories[0]?.subcategories[0]?.works[0]?.assessment).toBeNull();
      expect(gradebook.students[0]?.coursePercent).toBeNull();
    } finally {
      sqlite.close();
    }
  });
});

async function seedScienceClass(db: Awaited<ReturnType<typeof openTestDatabase>>["db"]) {
  await createSchoolYear(db, "2024-2025");
  await createClass(db, {
    schoolYearName: "2024-2025",
    displayName: "Science",
    internalName: "sci-9",
    subject: "Science",
    section: "9A",
    notes: "Course description",
  });
  const student = await createStudent(db, {
    firstName: "Ada",
    lastName: "Lovelace",
    preferredName: "",
    notes: "",
    email: "",
  });
  await addStudentToClass(db, {
    schoolYearName: "2024-2025",
    internalName: "sci-9",
    studentId: student.id,
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
  const work = await createWork(db, {
    subcategoryId: subcategory.id,
    name: "Worksheet 1",
    notes: "",
    maximumScore: 10,
    weight: 1,
  });

  return { student, category, subcategory, work };
}

async function openTestDatabase() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
  createdDirectories.push(directory);

  return bootstrapDatabase({
    databasePath: path.join(directory, "gradebook-test.sqlite"),
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
}
