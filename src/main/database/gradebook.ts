import { inArray } from "drizzle-orm";
import { assessmentPercent, weightedAverage } from "../../shared/grades";
import {
  classLookupInputSchema,
  type Adjustment,
  type Assessment,
  type ClassGradebook,
  type ClassLookupInput,
  type StudentCategoryGrade,
  type StudentGradeRow,
  type StudentSubcategoryGrade,
  type StudentWorkGrade,
} from "../../shared/ipc";
import { listStudentsForClass } from "./enrolments";
import { flattenWorks, getGradingStructure } from "./grading-structure";
import { adjustments, assessments } from "./schema";
import type { GradebookDatabase } from "./status";

export async function getClassGradebook(
  db: GradebookDatabase,
  input: ClassLookupInput,
): Promise<ClassGradebook> {
  const lookup = parseLookupInput(input);
  const structure = await getGradingStructure(db, lookup);
  const students = await listStudentsForClass(db, lookup);
  const workRows = flattenWorks(structure);
  const workIds = workRows.map((work) => work.id);
  const assessmentRows =
    workIds.length === 0
      ? []
      : await db.select().from(assessments).where(inArray(assessments.workId, workIds));
  const parsedAssessments = assessmentRows.map(parseStoredAssessment);
  const assessmentIds = parsedAssessments.map((assessment) => assessment.id);
  const adjustmentRows =
    assessmentIds.length === 0
      ? []
      : await db.select().from(adjustments).where(inArray(adjustments.assessmentId, assessmentIds));
  const adjustmentsByAssessment = groupAdjustments(adjustmentRows);
  const assessmentsByKey = new Map(
    parsedAssessments.map((assessment) => [
      assessmentKey(assessment.studentId, assessment.workId),
      assessment,
    ]),
  );

  return {
    categories: structure.categories,
    students: students.map((student) =>
      buildStudentRow(
        student,
        structure.categories,
        assessmentsByKey,
        adjustmentsByAssessment,
      ),
    ),
  };
}

function buildStudentRow(
  student: StudentGradeRow["student"],
  categories: ClassGradebook["categories"],
  assessmentsByKey: Map<string, Assessment>,
  adjustmentsByAssessment: Map<number, Array<Adjustment>>,
): StudentGradeRow {
  const categoryGrades = categories.map((category) => {
    const subcategoryGrades = category.subcategories.map((subcategory) => {
      const workGrades = subcategory.works.map((work) => {
        const assessment = assessmentsByKey.get(assessmentKey(student.id, work.id)) ?? null;
        const workAdjustments = assessment
          ? (adjustmentsByAssessment.get(assessment.id) ?? [])
          : [];
        const percent = assessment
          ? assessmentPercent(assessment.score, work.maximumScore, workAdjustments)
          : null;

        return {
          workId: work.id,
          assessment,
          adjustments: workAdjustments,
          percent,
        } satisfies StudentWorkGrade;
      });

      return {
        subcategoryId: subcategory.id,
        percent: weightedAverage(
          workGrades.flatMap((workGrade) => {
            if (!workGrade.assessment || workGrade.assessment.status !== "counted") {
              return [];
            }

            return [{ percent: workGrade.percent, weight: workGrade.assessment.weight }];
          }),
        ),
        works: workGrades,
      } satisfies StudentSubcategoryGrade;
    });

    return {
      categoryId: category.id,
      percent: weightedAverage(
        subcategoryGrades.map((subcategoryGrade, index) => ({
          percent: subcategoryGrade.percent,
          weight: category.subcategories[index]?.weight ?? 0,
        })),
      ),
      subcategories: subcategoryGrades,
    } satisfies StudentCategoryGrade;
  });

  return {
    student,
    coursePercent: weightedAverage(
      categoryGrades.map((categoryGrade, index) => ({
        percent: categoryGrade.percent,
        weight: categories[index]?.weight ?? 0,
      })),
    ),
    categories: categoryGrades,
  };
}

function groupAdjustments(rows: Array<Adjustment>): Map<number, Array<Adjustment>> {
  const grouped = new Map<number, Array<Adjustment>>();

  for (const adjustment of rows) {
    const existing = grouped.get(adjustment.assessmentId) ?? [];
    existing.push(adjustment);
    grouped.set(adjustment.assessmentId, existing);
  }

  return grouped;
}

function assessmentKey(studentId: number, workId: number): string {
  return `${studentId}:${workId}`;
}

function parseStoredAssessment(row: typeof assessments.$inferSelect): Assessment {
  if (row.status !== "counted" && row.status !== "exempt") {
    throw new Error("That assessment has an invalid status.");
  }

  return { ...row, status: row.status };
}

function parseLookupInput(input: ClassLookupInput): ClassLookupInput {
  const result = classLookupInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That class was not found.");
  }

  return result.data;
}
