import path from "node:path";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createAdjustment, upsertAssessment } from "./assessments";
import { createClass } from "./classes";
import { bootstrapDatabase } from "./client";
import {
  addStudentToClass,
  listClassesForStudent,
  listStudentsForClass,
  removeStudentFromClass,
} from "./enrolments";
import { setExcuse } from "./excuses";
import { getClassGradebook } from "./gradebook";
import { setGoalMark } from "./goal-marks";
import { createCategory, createSubcategory, createWork } from "./grading-structure";
import { createSchoolYear } from "./school-years";
import { adjustments, assessments, classStudents, excuses } from "./schema";
import { createStudent } from "./students";

describe("enrolments", () => {
  it("adds students to classes and lists both sides of the enrolment", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      await createSchoolYear(db, "2024-2025");
      const science = await createClass(db, classInput("2024-2025", "Science", "sci-9"));
      const english = await createClass(db, classInput("2024-2025", "English", "eng-9"));
      const zoe = await createStudent(db, studentInput("Zoe", "Young"));
      const ada = await createStudent(db, studentInput("Ada", "Lovelace"));

      await expect(
        addStudentToClass(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
          studentId: zoe.id,
        }),
      ).resolves.toEqual(zoe);
      await addStudentToClass(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        studentId: ada.id,
      });
      await addStudentToClass(db, {
        schoolYearName: "2024-2025",
        internalName: "eng-9",
        studentId: ada.id,
      });

      await expect(
        listStudentsForClass(db, { schoolYearName: "2024-2025", internalName: "sci-9" }),
      ).resolves.toEqual([ada, zoe]);

      await expect(listClassesForStudent(db, { id: ada.id })).resolves.toEqual([
        expect.objectContaining({
          id: english.id,
          displayName: "English",
          schoolYearName: "2024-2025",
        }),
        expect.objectContaining({
          id: science.id,
          displayName: "Science",
          schoolYearName: "2024-2025",
        }),
      ]);

      await expect(
        removeStudentFromClass(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
          studentId: zoe.id,
        }),
      ).resolves.toEqual({ deleted: true });
      await expect(
        listStudentsForClass(db, { schoolYearName: "2024-2025", internalName: "sci-9" }),
      ).resolves.toEqual([ada]);
    } finally {
      sqlite.close();
    }
  });

  it("rejects duplicate enrolments", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      await createSchoolYear(db, "2024-2025");
      await createClass(db, classInput("2024-2025", "Science", "sci-9"));
      const ada = await createStudent(db, studentInput("Ada", "Lovelace"));

      await addStudentToClass(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        studentId: ada.id,
      });
      await expect(
        addStudentToClass(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
          studentId: ada.id,
        }),
      ).rejects.toThrow("That student is already enrolled in this class.");
    } finally {
      sqlite.close();
    }
  });

  it("deletes this class's assessments and excuses when a student is removed", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      const setup = await seedMarkedClass(db);
      await removeStudentFromClass(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        studentId: setup.ada.id,
      });

      const scienceMarks = await db
        .select()
        .from(assessments)
        .where(eq(assessments.workId, setup.scienceWork.id));
      const categoryMarks = await db
        .select()
        .from(assessments)
        .where(eq(assessments.workId, setup.categoryWork.id));
      const englishMarks = await db
        .select()
        .from(assessments)
        .where(eq(assessments.workId, setup.englishWork.id));
      const remainingExcuses = await db
        .select()
        .from(excuses)
        .where(eq(excuses.studentId, setup.ada.id));

      expect(scienceMarks.map((mark) => mark.studentId)).toEqual([setup.blair.id]);
      expect(categoryMarks).toEqual([]);
      expect(englishMarks).toHaveLength(1);
      expect(remainingExcuses).toEqual([]);
      expect(await db.select().from(adjustments)).toEqual([]);

      await addStudentToClass(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        studentId: setup.ada.id,
      });
      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const row = gradebook.students.find((student) => student.student.id === setup.ada.id);

      expect(row?.categories[0]?.subcategories[0]?.works[0]?.assessment).toBeNull();
      expect(row?.categories[0]?.works[0]?.assessment).toBeNull();
      expect(row?.courseGoalMark).toBe(0.9);
      expect(
        gradebook.students.find((student) => student.student.id === setup.blair.id)?.categories[0]
          ?.subcategories[0]?.works[0]?.assessment?.score,
      ).toBe(6);
    } finally {
      sqlite.close();
    }
  });

  it("rolls the removal back when deleting the enrolment fails", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      const setup = await seedMarkedClass(db);
      sqlite.exec(`
        CREATE TRIGGER abort_class_student_delete
        BEFORE DELETE ON class_students
        BEGIN
          SELECT RAISE(ABORT, 'forced rollback');
        END;
      `);

      await expect(
        removeStudentFromClass(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
          studentId: setup.ada.id,
        }),
      ).rejects.toThrow("forced rollback");

      const marks = await db
        .select()
        .from(assessments)
        .where(eq(assessments.workId, setup.scienceWork.id));
      const categoryMarks = await db
        .select()
        .from(assessments)
        .where(eq(assessments.workId, setup.categoryWork.id));
      const enrolled = await listStudentsForClass(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const remainingExcuses = await db
        .select()
        .from(excuses)
        .where(eq(excuses.studentId, setup.ada.id));

      expect(marks).toHaveLength(2);
      expect(marks.map((mark) => mark.studentId)).toEqual(
        expect.arrayContaining([setup.ada.id, setup.blair.id]),
      );
      expect(categoryMarks.map((mark) => mark.studentId)).toEqual([setup.ada.id]);
      expect(enrolled.map((student) => student.id)).toContain(setup.ada.id);
      expect(remainingExcuses).toHaveLength(1);
    } finally {
      sqlite.close();
    }
  });

  it("keeps an assessment left by a removal that happened before this change", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      const setup = await seedMarkedClass(db);
      await db.delete(classStudents).where(eq(classStudents.studentId, setup.ada.id));

      const orphan = await db
        .select()
        .from(assessments)
        .where(
          and(
            eq(assessments.workId, setup.scienceWork.id),
            eq(assessments.studentId, setup.ada.id),
          ),
        );
      expect(orphan).toHaveLength(1);

      await addStudentToClass(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        studentId: setup.ada.id,
      });
      const gradebook = await getClassGradebook(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
      });
      const row = gradebook.students.find((student) => student.student.id === setup.ada.id);

      expect(row?.categories[0]?.subcategories[0]?.works[0]?.assessment?.score).toBe(8);
    } finally {
      sqlite.close();
    }
  });
});

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

function studentInput(firstName: string, lastName: string) {
  return {
    firstName,
    lastName,
    preferredName: "",
    notes: "",
    email: "",
  };
}

async function seedMarkedClass(db: Awaited<ReturnType<typeof bootstrapDatabase>>["db"]) {
  await createSchoolYear(db, "2024-2025");
  const science = await createClass(db, classInput("2024-2025", "Science", "sci-9"));
  await createClass(db, classInput("2024-2025", "English", "eng-9"));
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
  await addStudentToClass(db, {
    schoolYearName: "2024-2025",
    internalName: "eng-9",
    studentId: ada.id,
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
  const scienceWork = await createWork(db, {
    subcategoryId: subcategory.id,
    name: "Worksheet 1",
    notes: "",
    maximumScore: 10,
    weight: 1,
  });
  const categoryWork = await createWork(db, {
    categoryId: category.id,
    name: "Unit exam",
    notes: "",
    maximumScore: 10,
    weight: 1,
  });
  const englishCategory = await createCategory(db, {
    schoolYearName: "2024-2025",
    internalName: "eng-9",
    name: "Unit 1",
    notes: "",
    weight: 1,
  });
  const englishSubcategory = await createSubcategory(db, {
    categoryId: englishCategory.id,
    name: "Homework",
    weight: 1,
  });
  const englishWork = await createWork(db, {
    subcategoryId: englishSubcategory.id,
    name: "Essay",
    notes: "",
    maximumScore: 10,
    weight: 1,
  });
  const assessment = await upsertAssessment(db, {
    workId: scienceWork.id,
    studentId: ada.id,
    score: 8,
  });
  await createAdjustment(db, {
    assessmentId: assessment.id,
    percentChange: 5,
    rawChange: null,
    description: "Bonus",
    notes: "",
  });
  await upsertAssessment(db, {
    workId: categoryWork.id,
    studentId: ada.id,
    score: 7,
  });
  await upsertAssessment(db, {
    workId: scienceWork.id,
    studentId: blair.id,
    score: 6,
  });
  await upsertAssessment(db, {
    workId: englishWork.id,
    studentId: ada.id,
    score: 10,
  });
  await setExcuse(db, {
    categoryId: category.id,
    studentId: ada.id,
    excused: true,
  });
  await setGoalMark(db, {
    studentId: ada.id,
    classId: science.id,
    goalMark: 0.9,
  });

  return { ada, blair, scienceWork, categoryWork, englishWork };
}
