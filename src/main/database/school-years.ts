import { asc, eq } from "drizzle-orm";
import {
  recordIdInputSchema,
  schoolYearNameSchema,
  type RecordIdInput,
  type SchoolYear,
  type SchoolYearDeleteResult,
} from "../../shared/ipc";
import { schoolYears } from "./schema";
import type { GradebookDatabase } from "./status";

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (/UNIQUE constraint failed/i.test(error.message)) {
    return true;
  }

  return error.cause instanceof Error && /UNIQUE constraint failed/i.test(error.cause.message);
}

function describeSchoolYearError(error: unknown, name: string): Error {
  if (isUniqueConstraintError(error)) {
    return new Error(`A school year named "${name}" already exists.`);
  }

  return error instanceof Error ? error : new Error(String(error));
}

function parseRecordId(input: RecordIdInput): RecordIdInput {
  const result = recordIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That school year was not found.");
  }

  return result.data;
}

function parseSchoolYearName(rawName: string): string {
  const result = schoolYearNameSchema.safeParse(rawName);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "A school year name is required.");
  }

  return result.data;
}

export async function listSchoolYears(db: GradebookDatabase): Promise<Array<SchoolYear>> {
  return db.select().from(schoolYears).orderBy(asc(schoolYears.name));
}

export async function getSchoolYearById(
  db: GradebookDatabase,
  input: RecordIdInput,
): Promise<SchoolYear> {
  const schoolYearId = parseRecordId(input).id;
  const rows = await db.select().from(schoolYears).where(eq(schoolYears.id, schoolYearId)).limit(1);
  const schoolYear = rows[0];

  if (!schoolYear) {
    throw new Error("That school year was not found.");
  }

  return schoolYear;
}

export async function getSchoolYearByName(
  db: GradebookDatabase,
  rawName: string,
): Promise<SchoolYear> {
  const name = parseSchoolYearName(rawName);
  const rows = await db.select().from(schoolYears).where(eq(schoolYears.name, name)).limit(1);
  const schoolYear = rows[0];

  if (!schoolYear) {
    throw new Error(`School year "${name}" was not found.`);
  }

  return schoolYear;
}

export async function createSchoolYear(db: GradebookDatabase, rawName: string): Promise<SchoolYear> {
  const name = parseSchoolYearName(rawName);

  try {
    const created = await db.insert(schoolYears).values({ name }).returning();
    const schoolYear = created[0];

    if (!schoolYear) {
      throw new Error("The school year could not be created.");
    }

    return schoolYear;
  } catch (error) {
    throw describeSchoolYearError(error, name);
  }
}

export async function deleteSchoolYear(
  db: GradebookDatabase,
  rawName: string,
): Promise<SchoolYearDeleteResult> {
  const name = parseSchoolYearName(rawName);
  const deleted = await db.delete(schoolYears).where(eq(schoolYears.name, name)).returning();

  if (!deleted[0]) {
    throw new Error(`School year "${name}" was not found.`);
  }

  return { deleted: true };
}
