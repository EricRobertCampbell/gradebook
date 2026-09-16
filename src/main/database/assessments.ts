import { and, eq } from "drizzle-orm";
import {
  adjustmentCreateInputSchema,
  adjustmentUpdateInputSchema,
  assessmentLookupInputSchema,
  assessmentStatusSchema,
  assessmentUpsertInputSchema,
  recordIdInputSchema,
  type Adjustment,
  type AdjustmentCreateInput,
  type AdjustmentUpdateInput,
  type Assessment,
  type AssessmentLookupInput,
  type AssessmentUpsertInput,
  type DeleteResult,
  type RecordIdInput,
} from "../../shared/ipc";
import { adjustments, assessments } from "./schema";
import { requireWorkInClass } from "./grading-structure";
import type { GradebookDatabase } from "./status";
import { requireStudent } from "./students";

export async function upsertAssessment(
  db: GradebookDatabase,
  input: AssessmentUpsertInput,
): Promise<Assessment> {
  const parsed = parseUpsertInput(input);
  await requireStudent(db, parsed.studentId);
  const { work } = await requireWorkInClass(db, parsed.workId, parsed.studentId);
  const existing = await findAssessment(db, parsed.workId, parsed.studentId);

  if (existing) {
    const updated = await db
      .update(assessments)
      .set({
        score: parsed.score,
        date: parsed.date ?? existing.date,
        weight: parsed.weight ?? existing.weight,
        notes: parsed.notes ?? existing.notes,
        status: parsed.status ?? existing.status,
      })
      .where(eq(assessments.id, existing.id))
      .returning();
    const assessment = updated[0];

    if (!assessment) {
      throw new Error("The assessment could not be updated.");
    }

    return parseStoredAssessment(assessment);
  }

  const created = await db
    .insert(assessments)
    .values({
      workId: parsed.workId,
      studentId: parsed.studentId,
      score: parsed.score,
      date: parsed.date ?? todayIsoDate(),
      weight: parsed.weight ?? work.weight,
      notes: parsed.notes ?? "",
      status: parsed.status ?? "counted",
    })
    .returning();
  const assessment = created[0];

  if (!assessment) {
    throw new Error("The assessment could not be created.");
  }

  return parseStoredAssessment(assessment);
}

export async function deleteAssessment(
  db: GradebookDatabase,
  input: AssessmentLookupInput,
): Promise<DeleteResult> {
  const parsed = parseLookupInput(input);
  const deleted = await db
    .delete(assessments)
    .where(and(eq(assessments.workId, parsed.workId), eq(assessments.studentId, parsed.studentId)))
    .returning();

  if (!deleted[0]) {
    throw new Error("That assessment was not found.");
  }

  return { deleted: true };
}

export async function createAdjustment(
  db: GradebookDatabase,
  input: AdjustmentCreateInput,
): Promise<Adjustment> {
  const parsed = parseAdjustmentCreate(input);
  await requireAssessment(db, parsed.assessmentId);
  const created = await db
    .insert(adjustments)
    .values({
      assessmentId: parsed.assessmentId,
      percentChange: parsed.percentChange,
      rawChange: parsed.rawChange,
      description: parsed.description,
      notes: parsed.notes,
    })
    .returning();
  const adjustment = created[0];

  if (!adjustment) {
    throw new Error("The adjustment could not be created.");
  }

  return adjustment;
}

export async function updateAdjustment(
  db: GradebookDatabase,
  input: AdjustmentUpdateInput,
): Promise<Adjustment> {
  const parsed = parseAdjustmentUpdate(input);
  await requireAdjustment(db, parsed.id);
  const updated = await db
    .update(adjustments)
    .set({
      percentChange: parsed.percentChange,
      rawChange: parsed.rawChange,
      description: parsed.description,
      notes: parsed.notes,
    })
    .where(eq(adjustments.id, parsed.id))
    .returning();
  const adjustment = updated[0];

  if (!adjustment) {
    throw new Error("The adjustment could not be updated.");
  }

  return adjustment;
}

export async function deleteAdjustment(
  db: GradebookDatabase,
  input: RecordIdInput,
): Promise<DeleteResult> {
  const adjustmentId = parseRecordId(input).id;
  const deleted = await db.delete(adjustments).where(eq(adjustments.id, adjustmentId)).returning();

  if (!deleted[0]) {
    throw new Error("That adjustment was not found.");
  }

  return { deleted: true };
}

export async function requireAssessment(
  db: GradebookDatabase,
  assessmentId: number,
): Promise<Assessment> {
  const rows = await db.select().from(assessments).where(eq(assessments.id, assessmentId)).limit(1);
  const assessment = rows[0];

  if (!assessment) {
    throw new Error("That assessment was not found.");
  }

  return parseStoredAssessment(assessment);
}

async function findAssessment(
  db: GradebookDatabase,
  workId: number,
  studentId: number,
): Promise<Assessment | undefined> {
  const rows = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.workId, workId), eq(assessments.studentId, studentId)))
    .limit(1);

  return rows[0] ? parseStoredAssessment(rows[0]) : undefined;
}

async function requireAdjustment(db: GradebookDatabase, adjustmentId: number): Promise<Adjustment> {
  const rows = await db.select().from(adjustments).where(eq(adjustments.id, adjustmentId)).limit(1);
  const adjustment = rows[0];

  if (!adjustment) {
    throw new Error("That adjustment was not found.");
  }

  return adjustment;
}

export function parseStoredAssessment(row: typeof assessments.$inferSelect): Assessment {
  const status = assessmentStatusSchema.safeParse(row.status);

  if (!status.success) {
    throw new Error("That assessment has an invalid status.");
  }

  return { ...row, status: status.data };
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseUpsertInput(input: AssessmentUpsertInput): AssessmentUpsertInput {
  const result = assessmentUpsertInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The assessment could not be saved.");
  }

  return result.data;
}

function parseLookupInput(input: AssessmentLookupInput): AssessmentLookupInput {
  const result = assessmentLookupInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That assessment was not found.");
  }

  return result.data;
}

function parseAdjustmentCreate(input: AdjustmentCreateInput): AdjustmentCreateInput {
  const result = adjustmentCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The adjustment could not be created.");
  }

  return result.data;
}

function parseAdjustmentUpdate(input: AdjustmentUpdateInput): AdjustmentUpdateInput {
  const result = adjustmentUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The adjustment could not be updated.");
  }

  return result.data;
}

function parseRecordId(input: RecordIdInput): RecordIdInput {
  const result = recordIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That adjustment was not found.");
  }

  return result.data;
}
