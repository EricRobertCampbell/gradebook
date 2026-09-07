import { and, asc, eq } from "drizzle-orm";
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
import { classStudents, classes, schoolYears, students } from "./schema";
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

  const removed = await db
    .delete(classStudents)
    .where(and(eq(classStudents.classId, schoolClass.id), eq(classStudents.studentId, parsed.studentId)))
    .returning();

  if (!removed[0]) {
    throw new Error("That student is not enrolled in this class.");
  }

  return { deleted: true };
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

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (/UNIQUE constraint failed/i.test(error.message)) {
    return true;
  }

  return error.cause instanceof Error && /UNIQUE constraint failed/i.test(error.cause.message);
}
