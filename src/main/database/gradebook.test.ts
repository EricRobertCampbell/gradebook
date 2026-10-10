import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAdjustment, deleteAssessment, upsertAssessment } from "./assessments";
import { setExcuse } from "./excuses";
import { setGoalMark } from "./goal-marks";
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

  it("shows an exempt score without rolling it up, and ignores a cleared exempt mark", async () => {
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
        status: "exempt",
      });

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const subcategory = gradebook.students[0]?.categories[0]?.subcategories[0];
      const exemptWork = subcategory?.works.find((workGrade) => workGrade.workId === extraWork.id);

      expect(exemptWork?.percent).toBeCloseTo(0.8);
      expect(subcategory?.percent).toBe(1);

      await upsertAssessment(db, {
        workId: extraWork.id,
        studentId: setup.student.id,
        score: null,
        status: "exempt",
      });
      const cleared = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const clearedWork = cleared.students[0]?.categories[0]?.subcategories[0]?.works.find(
        (workGrade) => workGrade.workId === extraWork.id,
      );

      expect(clearedWork?.assessment?.score).toBeNull();
      expect(clearedWork?.percent).toBeNull();
      expect(cleared.students[0]?.categories[0]?.subcategories[0]?.percent).toBe(1);
    } finally {
      sqlite.close();
    }
  });

  it("stores not handed in without a score and counts a later zero", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      const saved = await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 8,
        status: "nhi",
      });

      expect(saved.score).toBeNull();
      expect(saved.status).toBe("nhi");

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const workGrade = gradebook.students[0]?.categories[0]?.subcategories[0]?.works[0];

      expect(workGrade?.percent).toBe(0);
      expect(gradebook.students[0]?.coursePercent).toBe(0);

      const counted = await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 0,
        status: "counted",
      });

      expect(counted).toMatchObject({ score: 0, status: "counted" });

      const countedBook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });

      expect(countedBook.students[0]?.coursePercent).toBe(0);
    } finally {
      sqlite.close();
    }
  });

  it("rejects a counted mark with no score, including when status is omitted", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);

      await expect(
        upsertAssessment(db, {
          workId: setup.work.id,
          studentId: setup.student.id,
          score: null,
        }),
      ).rejects.toThrow("Enter a mark.");

      await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 8,
      });

      await expect(
        upsertAssessment(db, {
          workId: setup.work.id,
          studentId: setup.student.id,
          score: null,
        }),
      ).rejects.toThrow("Enter a mark.");

      const exempt = await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: null,
        status: "exempt",
      });
      const zero = await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 0,
        status: "exempt",
      });

      expect(exempt).toMatchObject({ score: null, status: "exempt" });
      expect(zero).toMatchObject({ score: 0, status: "exempt" });
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
      const nhiWork = categoryGrade?.works.find(
        (workGrade) => workGrade.workId === categoryWork.id,
      );

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

      expect(
        gradebook.students[0]?.categories[0]?.subcategories[0]?.works[0]?.assessment,
      ).toBeNull();
      expect(gradebook.students[0]?.coursePercent).toBeNull();
    } finally {
      sqlite.close();
    }
  });

  it("stores a goal mark against one course, category, sub-category, or work", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      await setGoalMark(db, {
        studentId: setup.student.id,
        classId: setup.category.classId,
        goalMark: 0.9,
      });
      await setGoalMark(db, {
        studentId: setup.student.id,
        categoryId: setup.category.id,
        goalMark: 0.8,
      });
      await setGoalMark(db, {
        studentId: setup.student.id,
        subcategoryId: setup.subcategory.id,
        goalMark: 0.7,
      });
      await setGoalMark(db, {
        studentId: setup.student.id,
        workId: setup.work.id,
        goalMark: 0.6,
      });

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const row = gradebook.students[0];

      expect(row?.courseGoalMark).toBe(0.9);
      expect(row?.categories[0]?.goalMark).toBe(0.8);
      expect(row?.categories[0]?.subcategories[0]?.goalMark).toBe(0.7);
      expect(row?.categories[0]?.subcategories[0]?.works[0]?.goalMark).toBe(0.6);

      await setGoalMark(db, {
        studentId: setup.student.id,
        workId: setup.work.id,
        goalMark: null,
      });
      const cleared = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });

      expect(cleared.students[0]?.categories[0]?.subcategories[0]?.works[0]?.goalMark).toBeNull();
      await expect(
        setGoalMark(db, {
          studentId: setup.student.id,
          classId: setup.category.classId,
          workId: setup.work.id,
          goalMark: 0.5,
        }),
      ).rejects.toThrow("A goal mark needs exactly one course, category, sub-category, or work.");
    } finally {
      sqlite.close();
    }
  });

  it("drops covered work from averages and keeps the stored assessment", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 8,
      });
      await setExcuse(db, {
        categoryId: setup.category.id,
        studentId: setup.student.id,
        excused: true,
      });

      const excused = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const excusedCategory = excused.students[0]?.categories[0];
      const excusedWork = excusedCategory?.subcategories[0]?.works[0];

      expect(excusedWork?.assessment?.score).toBe(8);
      expect(excusedWork?.percent).toBeCloseTo(0.8);
      expect(excusedWork?.excused).toBe(true);
      expect(excusedCategory?.excused).toBe(true);
      expect(excusedCategory?.percent).toBeNull();
      expect(excused.students[0]?.coursePercent).toBeNull();

      await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 4,
      });
      const edited = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });

      expect(edited.students[0]?.categories[0]?.subcategories[0]?.works[0]?.percent).toBeCloseTo(
        0.4,
      );
      expect(edited.students[0]?.categories[0]?.percent).toBeNull();

      await setExcuse(db, {
        categoryId: setup.category.id,
        studentId: setup.student.id,
        excused: false,
      });
      const cleared = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });

      expect(cleared.students[0]?.categories[0]?.subcategories[0]?.works[0]?.excused).toBe(false);
      expect(cleared.students[0]?.categories[0]?.percent).toBeCloseTo(0.4);
      expect(cleared.students[0]?.coursePercent).toBeCloseTo(0.4);
    } finally {
      sqlite.close();
    }
  });

  it("excuses one sub-category without dropping sibling or category work", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      const sibling = await createSubcategory(db, {
        categoryId: setup.category.id,
        name: "Labs",
        weight: 1,
      });
      const siblingWork = await createWork(db, {
        subcategoryId: sibling.id,
        name: "Lab 1",
        notes: "",
        maximumScore: 10,
        weight: 1,
      });
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
        score: 0,
      });
      await upsertAssessment(db, {
        workId: siblingWork.id,
        studentId: setup.student.id,
        score: 10,
      });
      await upsertAssessment(db, {
        workId: categoryWork.id,
        studentId: setup.student.id,
        score: 10,
      });
      await setExcuse(db, {
        subcategoryId: setup.subcategory.id,
        studentId: setup.student.id,
        excused: true,
      });

      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const categoryGrade = gradebook.students[0]?.categories[0];
      const excusedSubcategory = categoryGrade?.subcategories.find(
        (subcategory) => subcategory.subcategoryId === setup.subcategory.id,
      );
      const siblingGrade = categoryGrade?.subcategories.find(
        (subcategory) => subcategory.subcategoryId === sibling.id,
      );

      expect(excusedSubcategory?.excused).toBe(true);
      expect(excusedSubcategory?.percent).toBeNull();
      expect(excusedSubcategory?.works[0]?.excused).toBe(true);
      expect(excusedSubcategory?.works[0]?.assessment?.score).toBe(0);
      expect(siblingGrade?.excused).toBe(false);
      expect(siblingGrade?.percent).toBe(1);
      expect(categoryGrade?.works[0]?.excused).toBe(false);
      expect(categoryGrade?.percent).toBe(1);
      expect(categoryGrade?.excused).toBe(false);
    } finally {
      sqlite.close();
    }
  });

  it("keeps a sub-category covered by its parent after that sub-category excuse is cleared", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      await upsertAssessment(db, {
        workId: setup.work.id,
        studentId: setup.student.id,
        score: 10,
      });
      await setExcuse(db, {
        categoryId: setup.category.id,
        studentId: setup.student.id,
        excused: true,
      });
      await setExcuse(db, {
        subcategoryId: setup.subcategory.id,
        studentId: setup.student.id,
        excused: true,
      });
      await setExcuse(db, {
        subcategoryId: setup.subcategory.id,
        studentId: setup.student.id,
        excused: false,
      });

      const categoryGrade = (
        await getClassGradebook(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
        })
      ).students[0]?.categories[0];

      expect(categoryGrade?.excused).toBe(true);
      expect(categoryGrade?.subcategories[0]?.excused).toBe(false);
      expect(categoryGrade?.subcategories[0]?.percent).toBeNull();
      expect(categoryGrade?.subcategories[0]?.works[0]?.excused).toBe(true);
      expect(categoryGrade?.percent).toBeNull();
    } finally {
      sqlite.close();
    }
  });

  it("ignores a not-handed-in mark while it is excused and counts it as zero afterwards", async () => {
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
      await setExcuse(db, {
        subcategoryId: setup.subcategory.id,
        studentId: setup.student.id,
        excused: true,
      });

      const excused = (
        await getClassGradebook(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
        })
      ).students[0]?.categories[0]?.subcategories[0];
      const nhiWork = excused?.works.find((workGrade) => workGrade.workId === extraWork.id);

      expect(nhiWork?.percent).toBe(0);
      expect(nhiWork?.excused).toBe(true);
      expect(excused?.percent).toBeNull();

      await setExcuse(db, {
        subcategoryId: setup.subcategory.id,
        studentId: setup.student.id,
        excused: false,
      });
      const cleared = (
        await getClassGradebook(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
        })
      ).students[0]?.categories[0]?.subcategories[0];

      expect(cleared?.percent).toBe(0.5);
    } finally {
      sqlite.close();
    }
  });

  it("leaves a work-level exemption in place after the section excuse is cleared", async () => {
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
      await setExcuse(db, {
        subcategoryId: setup.subcategory.id,
        studentId: setup.student.id,
        excused: true,
      });
      await setExcuse(db, {
        subcategoryId: setup.subcategory.id,
        studentId: setup.student.id,
        excused: false,
      });

      const subcategory = (
        await getClassGradebook(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
        })
      ).students[0]?.categories[0]?.subcategories[0];
      const exemptWork = subcategory?.works.find((workGrade) => workGrade.workId === extraWork.id);

      expect(exemptWork?.assessment?.status).toBe("exempt");
      expect(exemptWork?.excused).toBe(false);
      expect(subcategory?.percent).toBe(1);
    } finally {
      sqlite.close();
    }
  });

  it("covers work added to a category that is already excused", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      const setup = await seedScienceClass(db);
      await setExcuse(db, {
        categoryId: setup.category.id,
        studentId: setup.student.id,
        excused: true,
      });
      const added = await createWork(db, {
        categoryId: setup.category.id,
        name: "Unit exam",
        notes: "",
        maximumScore: 10,
        weight: 1,
      });
      await upsertAssessment(db, {
        workId: added.id,
        studentId: setup.student.id,
        score: 10,
      });

      const categoryGrade = (
        await getClassGradebook(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
        })
      ).students[0]?.categories[0];
      const addedGrade = categoryGrade?.works.find((workGrade) => workGrade.workId === added.id);

      expect(addedGrade?.excused).toBe(true);
      expect(addedGrade?.percent).toBe(1);
      expect(categoryGrade?.percent).toBeNull();
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
