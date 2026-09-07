import { asc, eq } from "drizzle-orm";
import {
  studentCreateInputSchema,
  studentIdInputSchema,
  studentUpdateInputSchema,
  type DeleteResult,
  type Student,
  type StudentCreateInput,
  type StudentIdInput,
  type StudentUpdateInput,
} from "../../shared/ipc";
import { parents, studentParents, students } from "./schema";
import type { GradebookDatabase } from "./status";

export async function listStudents(db: GradebookDatabase): Promise<Array<Student>> {
  return db.select().from(students).orderBy(asc(students.lastName), asc(students.firstName));
}

export async function getStudent(db: GradebookDatabase, input: StudentIdInput): Promise<Student> {
  return requireStudent(db, parseStudentId(input).id);
}

export async function createStudent(db: GradebookDatabase, input: StudentCreateInput): Promise<Student> {
  const parsed = parseCreateInput(input);
  const created = await db
    .insert(students)
    .values({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      preferredName: parsed.preferredName,
      notes: parsed.notes,
      email: parsed.email,
    })
    .returning();
  const student = created[0];

  if (!student) {
    throw new Error("The student could not be created.");
  }

  return student;
}

export async function updateStudent(db: GradebookDatabase, input: StudentUpdateInput): Promise<Student> {
  const parsed = parseUpdateInput(input);
  await requireStudent(db, parsed.id);

  const updated = await db
    .update(students)
    .set({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      preferredName: parsed.preferredName,
      notes: parsed.notes,
      email: parsed.email,
    })
    .where(eq(students.id, parsed.id))
    .returning();
  const student = updated[0];

  if (!student) {
    throw new Error("The student could not be updated.");
  }

  return student;
}

export async function deleteStudent(db: GradebookDatabase, input: StudentIdInput): Promise<DeleteResult> {
  const studentId = parseStudentId(input).id;
  const linkedParents = await db
    .select({ parentId: studentParents.parentId })
    .from(studentParents)
    .where(eq(studentParents.studentId, studentId));
  const deleted = await db.delete(students).where(eq(students.id, studentId)).returning();

  if (!deleted[0]) {
    throw new Error("That student was not found.");
  }

  await deleteOrphanedParents(
    db,
    linkedParents.map((row) => row.parentId),
  );

  return { deleted: true };
}

export async function requireStudent(db: GradebookDatabase, studentId: number): Promise<Student> {
  const rows = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  const student = rows[0];

  if (!student) {
    throw new Error("That student was not found.");
  }

  return student;
}

export async function deleteOrphanedParents(
  db: GradebookDatabase,
  parentIds: Array<number>,
): Promise<void> {
  for (const parentId of parentIds) {
    const remaining = await db
      .select({ studentId: studentParents.studentId })
      .from(studentParents)
      .where(eq(studentParents.parentId, parentId))
      .limit(1);

    if (remaining[0]) {
      continue;
    }

    await db.delete(parents).where(eq(parents.id, parentId));
  }
}

function parseStudentId(input: StudentIdInput): StudentIdInput {
  const result = studentIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That student was not found.");
  }

  return result.data;
}

function parseCreateInput(input: StudentCreateInput): StudentCreateInput {
  const result = studentCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The student could not be created.");
  }

  return result.data;
}

function parseUpdateInput(input: StudentUpdateInput): StudentUpdateInput {
  const result = studentUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The student could not be updated.");
  }

  return result.data;
}
