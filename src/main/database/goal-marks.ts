import { and, eq } from "drizzle-orm";
import {
  goalMarkSetInputSchema,
  type GoalMarkSetInput,
  type GoalMarkSetResult,
} from "../../shared/ipc";
import { requireCategory, requireSubcategory, requireWorkInClass } from "./grading-structure";
import { classStudents, classes, goalMarks } from "./schema";
import type { GradebookDatabase } from "./status";
import { requireStudent } from "./students";

export async function setGoalMark(
  db: GradebookDatabase,
  input: GoalMarkSetInput,
): Promise<GoalMarkSetResult> {
  const parsed = parseSetInput(input);
  const target = normaliseTarget(parsed);
  await requireStudent(db, parsed.studentId);
  await requireTargetEnrolment(db, parsed.studentId, target);
  const match = targetMatch(parsed.studentId, target);

  if (parsed.goalMark === null) {
    await db.delete(goalMarks).where(match);
    return { goalMark: null };
  }

  const existing = await db.select().from(goalMarks).where(match).limit(1);
  const current = existing[0];

  if (current) {
    const updated = await db
      .update(goalMarks)
      .set({ goalMark: parsed.goalMark })
      .where(eq(goalMarks.id, current.id))
      .returning();
    const row = updated[0];

    if (!row) {
      throw new Error("The goal mark could not be saved.");
    }

    return { goalMark: row.goalMark };
  }

  const created = await db
    .insert(goalMarks)
    .values({
      studentId: parsed.studentId,
      classId: target.classId,
      categoryId: target.categoryId,
      subcategoryId: target.subcategoryId,
      workId: target.workId,
      goalMark: parsed.goalMark,
    })
    .returning();
  const row = created[0];

  if (!row) {
    throw new Error("The goal mark could not be saved.");
  }

  return { goalMark: row.goalMark };
}

type GoalTarget = {
  classId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  workId: number | null;
};

function normaliseTarget(input: GoalMarkSetInput): GoalTarget {
  return {
    classId: input.classId ?? null,
    categoryId: input.categoryId ?? null,
    subcategoryId: input.subcategoryId ?? null,
    workId: input.workId ?? null,
  };
}

function targetMatch(studentId: number, target: GoalTarget) {
  if (target.classId !== null) {
    return and(eq(goalMarks.studentId, studentId), eq(goalMarks.classId, target.classId));
  }

  if (target.categoryId !== null) {
    return and(eq(goalMarks.studentId, studentId), eq(goalMarks.categoryId, target.categoryId));
  }

  if (target.subcategoryId !== null) {
    return and(
      eq(goalMarks.studentId, studentId),
      eq(goalMarks.subcategoryId, target.subcategoryId),
    );
  }

  if (target.workId !== null) {
    return and(eq(goalMarks.studentId, studentId), eq(goalMarks.workId, target.workId));
  }

  throw new Error("A goal mark needs exactly one course, category, sub-category, or work.");
}

async function requireTargetEnrolment(
  db: GradebookDatabase,
  studentId: number,
  target: GoalTarget,
): Promise<void> {
  if (target.classId !== null) {
    await requireEnrolled(db, studentId, target.classId);
    return;
  }

  if (target.categoryId !== null) {
    const category = await requireCategory(db, target.categoryId);
    await requireEnrolled(db, studentId, category.classId);
    return;
  }

  if (target.subcategoryId !== null) {
    const subcategory = await requireSubcategory(db, target.subcategoryId);
    const category = await requireCategory(db, subcategory.categoryId);
    await requireEnrolled(db, studentId, category.classId);
    return;
  }

  if (target.workId !== null) {
    await requireWorkInClass(db, target.workId, studentId);
  }
}

async function requireEnrolled(
  db: GradebookDatabase,
  studentId: number,
  classId: number,
): Promise<void> {
  const schoolClass = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);

  if (!schoolClass[0]) {
    throw new Error("That class was not found.");
  }

  const enrolment = await db
    .select()
    .from(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)))
    .limit(1);

  if (!enrolment[0]) {
    throw new Error("That student is not in this class.");
  }
}

function parseSetInput(input: GoalMarkSetInput): GoalMarkSetInput {
  const result = goalMarkSetInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The goal mark could not be saved.");
  }

  return result.data;
}
