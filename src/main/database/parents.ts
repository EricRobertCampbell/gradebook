import { and, asc, eq } from "drizzle-orm";
import {
  parentCreateInputSchema,
  parentDeleteInputSchema,
  parentUpdateInputSchema,
  studentIdInputSchema,
  type DeleteResult,
  type Parent,
  type ParentCreateInput,
  type ParentDeleteInput,
  type ParentUpdateInput,
  type StudentIdInput,
} from "../../shared/ipc";
import { parents, studentParents } from "./schema";
import type { GradebookDatabase } from "./status";
import { deleteOrphanedParents, requireStudent } from "./students";

export async function listParentsForStudent(
  db: GradebookDatabase,
  input: StudentIdInput,
): Promise<Array<Parent>> {
  const studentId = parseStudentId(input).id;
  await requireStudent(db, studentId);

  return db
    .select({
      id: parents.id,
      firstName: parents.firstName,
      lastName: parents.lastName,
      preferredName: parents.preferredName,
      notes: parents.notes,
      emailAddress1: parents.emailAddress1,
      emailAddress2: parents.emailAddress2,
    })
    .from(studentParents)
    .innerJoin(parents, eq(studentParents.parentId, parents.id))
    .where(eq(studentParents.studentId, studentId))
    .orderBy(asc(parents.lastName), asc(parents.firstName));
}

export async function createParentForStudent(
  db: GradebookDatabase,
  input: ParentCreateInput,
): Promise<Parent> {
  const parsed = parseCreateInput(input);
  await requireStudent(db, parsed.studentId);

  const inserted = await db
    .insert(parents)
    .values({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      preferredName: parsed.preferredName,
      notes: parsed.notes,
      emailAddress1: parsed.emailAddress1,
      emailAddress2: parsed.emailAddress2,
    })
    .returning();
  const parent = inserted[0];

  if (!parent) {
    throw new Error("The parent could not be created.");
  }

  await db.insert(studentParents).values({
    studentId: parsed.studentId,
    parentId: parent.id,
  });

  return parent;
}

export async function updateParent(db: GradebookDatabase, input: ParentUpdateInput): Promise<Parent> {
  const parsed = parseUpdateInput(input);
  await requireParent(db, parsed.id);

  const updated = await db
    .update(parents)
    .set({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      preferredName: parsed.preferredName,
      notes: parsed.notes,
      emailAddress1: parsed.emailAddress1,
      emailAddress2: parsed.emailAddress2,
    })
    .where(eq(parents.id, parsed.id))
    .returning();
  const parent = updated[0];

  if (!parent) {
    throw new Error("The parent could not be updated.");
  }

  return parent;
}

export async function deleteParentForStudent(
  db: GradebookDatabase,
  input: ParentDeleteInput,
): Promise<DeleteResult> {
  const parsed = parseDeleteInput(input);
  await requireStudent(db, parsed.studentId);
  await requireParent(db, parsed.id);

  const unlinked = await db
    .delete(studentParents)
    .where(and(eq(studentParents.studentId, parsed.studentId), eq(studentParents.parentId, parsed.id)))
    .returning();

  if (!unlinked[0]) {
    throw new Error("That parent is not linked to this student.");
  }

  await deleteOrphanedParents(db, [parsed.id]);

  return { deleted: true };
}

async function requireParent(db: GradebookDatabase, parentId: number): Promise<Parent> {
  const rows = await db.select().from(parents).where(eq(parents.id, parentId)).limit(1);
  const parent = rows[0];

  if (!parent) {
    throw new Error("That parent was not found.");
  }

  return parent;
}

function parseStudentId(input: StudentIdInput): StudentIdInput {
  const result = studentIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That student was not found.");
  }

  return result.data;
}

function parseCreateInput(input: ParentCreateInput): ParentCreateInput {
  const result = parentCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The parent could not be created.");
  }

  return result.data;
}

function parseUpdateInput(input: ParentUpdateInput): ParentUpdateInput {
  const result = parentUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The parent could not be updated.");
  }

  return result.data;
}

function parseDeleteInput(input: ParentDeleteInput): ParentDeleteInput {
  const result = parentDeleteInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That parent was not found.");
  }

  return result.data;
}
