import { and, asc, eq } from "drizzle-orm";
import {
  classCreateInputSchema,
  classLookupInputSchema,
  classUpdateInputSchema,
  recordIdInputSchema,
  schoolYearNameSchema,
  type Class,
  type ClassCreateInput,
  type ClassDeleteResult,
  type ClassLookupInput,
  type ClassUpdateInput,
  type RecordIdInput,
} from "../../shared/ipc";
import { classes } from "./schema";
import { getSchoolYearByName } from "./school-years";
import type { GradebookDatabase } from "./status";

export async function listClasses(db: GradebookDatabase, schoolYearName: string): Promise<Array<Class>> {
  const year = await getSchoolYearByName(db, parseSchoolYearName(schoolYearName));

  return db
    .select()
    .from(classes)
    .where(eq(classes.schoolYearId, year.id))
    .orderBy(asc(classes.displayName));
}

export async function getClass(db: GradebookDatabase, input: ClassLookupInput): Promise<Class> {
  const lookup = parseLookupInput(input);
  return requireClass(db, lookup.schoolYearName, lookup.internalName);
}

export async function getClassById(db: GradebookDatabase, input: RecordIdInput): Promise<Class> {
  const classId = parseRecordId(input).id;
  const rows = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  const schoolClass = rows[0];

  if (!schoolClass) {
    throw new Error("That class was not found.");
  }

  return schoolClass;
}

export async function createClass(db: GradebookDatabase, input: ClassCreateInput): Promise<Class> {
  const parsed = parseCreateInput(input);
  const year = await getSchoolYearByName(db, parsed.schoolYearName);

  try {
    const created = await db
      .insert(classes)
      .values({
        displayName: parsed.displayName,
        internalName: parsed.internalName,
        subject: parsed.subject,
        section: parsed.section,
        notes: parsed.notes,
        schoolYearId: year.id,
      })
      .returning();
    const schoolClass = created[0];

    if (!schoolClass) {
      throw new Error("The class could not be created.");
    }

    return schoolClass;
  } catch (error) {
    throw describeClassError(error, parsed.internalName);
  }
}

export async function updateClass(db: GradebookDatabase, input: ClassUpdateInput): Promise<Class> {
  const parsed = parseUpdateInput(input);
  const existing = await requireClass(db, parsed.schoolYearName, parsed.currentInternalName);

  try {
    const updated = await db
      .update(classes)
      .set({
        displayName: parsed.displayName,
        internalName: parsed.internalName,
        subject: parsed.subject,
        section: parsed.section,
        notes: parsed.notes,
      })
      .where(eq(classes.id, existing.id))
      .returning();
    const schoolClass = updated[0];

    if (!schoolClass) {
      throw new Error("The class could not be updated.");
    }

    return schoolClass;
  } catch (error) {
    throw describeClassError(error, parsed.internalName);
  }
}

export async function deleteClass(
  db: GradebookDatabase,
  input: ClassLookupInput,
): Promise<ClassDeleteResult> {
  const lookup = parseLookupInput(input);
  const year = await getSchoolYearByName(db, lookup.schoolYearName);
  const deleted = await db
    .delete(classes)
    .where(and(eq(classes.schoolYearId, year.id), eq(classes.internalName, lookup.internalName)))
    .returning();

  if (!deleted[0]) {
    throw new Error(`Class "${lookup.internalName}" was not found.`);
  }

  return { deleted: true };
}

async function requireClass(
  db: GradebookDatabase,
  schoolYearName: string,
  internalName: string,
): Promise<Class> {
  const year = await getSchoolYearByName(db, schoolYearName);
  const rows = await db
    .select()
    .from(classes)
    .where(and(eq(classes.schoolYearId, year.id), eq(classes.internalName, internalName)))
    .limit(1);
  const schoolClass = rows[0];

  if (!schoolClass) {
    throw new Error(`Class "${internalName}" was not found.`);
  }

  return schoolClass;
}

function parseSchoolYearName(rawName: string): string {
  const result = schoolYearNameSchema.safeParse(rawName);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "A school year name is required.");
  }

  return result.data;
}

function parseCreateInput(input: ClassCreateInput): ClassCreateInput {
  const result = classCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The class could not be created.");
  }

  return result.data;
}

function parseUpdateInput(input: ClassUpdateInput): ClassUpdateInput {
  const result = classUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The class could not be updated.");
  }

  return result.data;
}

function parseLookupInput(input: ClassLookupInput): ClassLookupInput {
  const result = classLookupInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That class was not found.");
  }

  return result.data;
}

function parseRecordId(input: RecordIdInput): RecordIdInput {
  const result = recordIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That class was not found.");
  }

  return result.data;
}

function describeClassError(error: unknown, internalName: string): Error {
  if (isUniqueConstraintError(error)) {
    return new Error(
      `A class with internal name "${internalName}" already exists in this school year.`,
    );
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
