import { and, asc, eq, inArray, or, type SQL } from "drizzle-orm";
import {
  classLookupInputSchema,
  classStudentInputSchema,
  studentIdInputSchema,
  type ClassLookupInput,
  type ClassStudentInput,
  type DeleteResult,
  type EnrolledClass,
  type Student,
  type StudentIdInput,
} from "../../shared/ipc";
import { getClass } from "./classes";
import {
  assessments,
  categories,
  classStudents,
  classes,
  excuses,
  schoolYears,
  students,
  subcategories,
  works,
} from "./schema";
import type { GradebookDatabase } from "./status";
import { requireStudent } from "./students";

export async function listStudentsForClass(
  db: GradebookDatabase,
  input: ClassLookupInput,
): Promise<Array<Student>> {
  const schoolClass = await getClass(db, parseLookupInput(input));

  return db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      preferredName: students.preferredName,
      notes: students.notes,
      email: students.email,
    })
    .from(classStudents)
    .innerJoin(students, eq(classStudents.studentId, students.id))
    .where(eq(classStudents.classId, schoolClass.id))
    .orderBy(asc(students.lastName), asc(students.firstName));
}

export async function listClassesForStudent(
  db: GradebookDatabase,
  input: StudentIdInput,
): Promise<Array<EnrolledClass>> {
  const studentId = parseStudentId(input).id;
  await requireStudent(db, studentId);

  return db
    .select({
      id: classes.id,
      displayName: classes.displayName,
      internalName: classes.internalName,
      subject: classes.subject,
      section: classes.section,
      notes: classes.notes,
      schoolYearId: classes.schoolYearId,
      schoolYearName: schoolYears.name,
    })
    .from(classStudents)
    .innerJoin(classes, eq(classStudents.classId, classes.id))
    .innerJoin(schoolYears, eq(classes.schoolYearId, schoolYears.id))
    .where(eq(classStudents.studentId, studentId))
    .orderBy(asc(schoolYears.name), asc(classes.displayName));
}

export async function addStudentToClass(
  db: GradebookDatabase,
  input: ClassStudentInput,
): Promise<Student> {
  const parsed = parseClassStudentInput(input);
  const schoolClass = await getClass(db, parsed);
  const student = await requireStudent(db, parsed.studentId);

  try {
    await db.insert(classStudents).values({
      classId: schoolClass.id,
      studentId: student.id,
    });
  } catch (error) {
    throw describeEnrolmentError(error);
  }

  return student;
}

export async function removeStudentFromClass(
  db: GradebookDatabase,
  input: ClassStudentInput,
): Promise<DeleteResult> {
  const parsed = parseClassStudentInput(input);
  const schoolClass = await getClass(db, parsed);
  await requireStudent(db, parsed.studentId);
  await requireStudentEnrolled(db, schoolClass.id, parsed.studentId);
  const scope = await classRemovalScope(db, schoolClass.id);

  db.transaction((tx) => {
    if (scope.workIds.length > 0) {
      tx.delete(assessments)
        .where(
          and(
            eq(assessments.studentId, parsed.studentId),
            inArray(assessments.workId, scope.workIds),
          ),
        )
        .run();
    }

    const excuseFilter = excuseScopeFilter(parsed.studentId, scope);
    if (excuseFilter) {
      tx.delete(excuses).where(excuseFilter).run();
    }

    const removed = tx
      .delete(classStudents)
      .where(
        and(
          eq(classStudents.classId, schoolClass.id),
          eq(classStudents.studentId, parsed.studentId),
        ),
      )
      .returning()
      .all();

    if (!removed[0]) {
      throw new Error("That student is not enrolled in this class.");
    }
  });

  return { deleted: true };
}

export async function requireStudentEnrolled(
  db: GradebookDatabase,
  classId: number,
  studentId: number,
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

function parseLookupInput(input: ClassLookupInput): ClassLookupInput {
  const result = classLookupInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That class was not found.");
  }

  return result.data;
}

function parseStudentId(input: StudentIdInput): StudentIdInput {
  const result = studentIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That student was not found.");
  }

  return result.data;
}

function parseClassStudentInput(input: ClassStudentInput): ClassStudentInput {
  const result = classStudentInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That enrolment could not be changed.");
  }

  return result.data;
}

function describeEnrolmentError(error: unknown): Error {
  if (isUniqueConstraintError(error)) {
    return new Error("That student is already enrolled in this class.");
  }

  return error instanceof Error ? error : new Error(String(error));
}

async function classRemovalScope(
  db: GradebookDatabase,
  classId: number,
): Promise<{ categoryIds: Array<number>; subcategoryIds: Array<number>; workIds: Array<number> }> {
  const categoryRows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.classId, classId));
  const categoryIds = categoryRows.map((row) => row.id);
  const subcategoryRows =
    categoryIds.length === 0
      ? []
      : await db
          .select({ id: subcategories.id })
          .from(subcategories)
          .where(inArray(subcategories.categoryId, categoryIds));
  const subcategoryIds = subcategoryRows.map((row) => row.id);
  const workFilters = [
    ...(categoryIds.length > 0 ? [inArray(works.categoryId, categoryIds)] : []),
    ...(subcategoryIds.length > 0 ? [inArray(works.subcategoryId, subcategoryIds)] : []),
  ];
  const workFilter = anyOf(workFilters);
  const workRows = workFilter
    ? await db.select({ id: works.id }).from(works).where(workFilter)
    : [];

  return {
    categoryIds,
    subcategoryIds,
    workIds: workRows.map((row) => row.id),
  };
}

function excuseScopeFilter(
  studentId: number,
  scope: { categoryIds: Array<number>; subcategoryIds: Array<number> },
): SQL | undefined {
  const targetFilter = anyOf([
    ...(scope.categoryIds.length > 0 ? [inArray(excuses.categoryId, scope.categoryIds)] : []),
    ...(scope.subcategoryIds.length > 0
      ? [inArray(excuses.subcategoryId, scope.subcategoryIds)]
      : []),
  ]);

  if (!targetFilter) {
    return undefined;
  }

  return and(eq(excuses.studentId, studentId), targetFilter);
}

function anyOf(filters: Array<SQL>): SQL | undefined {
  const [first, ...rest] = filters;

  if (!first) {
    return undefined;
  }

  if (rest.length === 0) {
    return first;
  }

  return or(first, ...rest);
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (/UNIQUE constraint failed/i.test(error.message)) {
    return true;
  }

  return error.cause instanceof Error && /UNIQUE constraint failed/i.test(error.cause.message);
}
