import { and, eq } from "drizzle-orm";
import {
  excuseSetAllInputSchema,
  excuseSetInputSchema,
  type ExcuseSetAllInput,
  type ExcuseSetAllResult,
  type ExcuseSetInput,
  type ExcuseSetResult,
} from "../../shared/ipc";
import { requireStudentEnrolled } from "./enrolments";
import { requireCategory, requireSubcategory } from "./grading-structure";
import { classStudents, excuses } from "./schema";
import type { GradebookDatabase } from "./status";
import { requireStudent } from "./students";

export async function setExcuse(
  db: GradebookDatabase,
  input: ExcuseSetInput,
): Promise<ExcuseSetResult> {
  const parsed = parseSetInput(input);
  const target = normaliseTarget(parsed);
  await requireStudent(db, parsed.studentId);
  const classId = await classIdForTarget(db, target);
  await requireStudentEnrolled(db, classId, parsed.studentId);
  const match = and(eq(excuses.studentId, parsed.studentId), targetMatch(target));

  if (!parsed.excused) {
    await db.delete(excuses).where(match);
    return { excused: false };
  }

  const existing = await db.select({ id: excuses.id }).from(excuses).where(match).limit(1);

  if (existing[0]) {
    return { excused: true };
  }

  await db.insert(excuses).values({
    studentId: parsed.studentId,
    categoryId: target.categoryId,
    subcategoryId: target.subcategoryId,
  });

  return { excused: true };
}

export async function setAllExcuses(
  db: GradebookDatabase,
  input: ExcuseSetAllInput,
): Promise<ExcuseSetAllResult> {
  const parsed = parseSetAllInput(input);
  const target = normaliseTarget(parsed);
  const classId = await classIdForTarget(db, target);
  const enrolled = await db
    .select({ studentId: classStudents.studentId })
    .from(classStudents)
    .where(eq(classStudents.classId, classId));
  const studentIds = enrolled.map((row) => row.studentId);
  const excusedStudentIds = parsed.excused ? studentIds : [];

  db.transaction((tx) => {
    tx.delete(excuses).where(targetMatch(target)).run();

    if (excusedStudentIds.length === 0) {
      return;
    }

    tx.insert(excuses)
      .values(
        excusedStudentIds.map((studentId) => ({
          studentId,
          categoryId: target.categoryId,
          subcategoryId: target.subcategoryId,
        })),
      )
      .run();
  });

  return { excusedStudentIds };
}

interface ExcuseTarget {
  categoryId: number | null;
  subcategoryId: number | null;
}

function normaliseTarget(input: {
  categoryId?: number | null;
  subcategoryId?: number | null;
}): ExcuseTarget {
  return {
    categoryId: input.categoryId ?? null,
    subcategoryId: input.subcategoryId ?? null,
  };
}

function targetMatch(target: ExcuseTarget) {
  if (target.categoryId !== null) {
    return eq(excuses.categoryId, target.categoryId);
  }

  if (target.subcategoryId !== null) {
    return eq(excuses.subcategoryId, target.subcategoryId);
  }

  throw new Error("An excuse needs exactly one category or sub-category.");
}

async function classIdForTarget(db: GradebookDatabase, target: ExcuseTarget): Promise<number> {
  if (target.categoryId !== null) {
    const category = await requireCategory(db, target.categoryId);
    return category.classId;
  }

  if (target.subcategoryId !== null) {
    const subcategory = await requireSubcategory(db, target.subcategoryId);
    const category = await requireCategory(db, subcategory.categoryId);
    return category.classId;
  }

  throw new Error("An excuse needs exactly one category or sub-category.");
}

function parseSetInput(input: ExcuseSetInput): ExcuseSetInput {
  const result = excuseSetInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The excuse could not be saved.");
  }

  return result.data;
}

function parseSetAllInput(input: ExcuseSetAllInput): ExcuseSetAllInput {
  const result = excuseSetAllInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The excuse could not be saved.");
  }

  return result.data;
}
