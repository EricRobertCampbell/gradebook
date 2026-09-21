import { eq, inArray, or, type SQL } from "drizzle-orm";
import {
  assessmentCountsTowardAverage,
  assessmentPercent,
  weightedAverage,
} from "../../shared/grades";
import {
  classLookupInputSchema,
  type Adjustment,
  type Assessment,
  type ClassGradebook,
  type ClassGradingStructure,
  type ClassLookupInput,
  type GradeWork,
  type StudentCategoryGrade,
  type StudentGradeRow,
  type StudentSubcategoryGrade,
  type StudentWorkGrade,
} from "../../shared/ipc";
import { parseStoredAssessment } from "./assessments";
import { getClass } from "./classes";
import { listStudentsForClass } from "./enrolments";
import { flattenWorks, loadGradingStructure } from "./grading-structure";
import { adjustments, assessments, goalMarks } from "./schema";
import type { GradebookDatabase } from "./status";

export async function getClassGradebook(
  db: GradebookDatabase,
  input: ClassLookupInput,
): Promise<ClassGradebook> {
  const lookup = parseLookupInput(input);
  const schoolClass = await getClass(db, lookup);
  const structure = await loadGradingStructure(db, schoolClass.id);
  const students = await listStudentsForClass(db, lookup);
  const goalRows = await listClassGoalMarks(db, schoolClass.id, structure);
  const goals = indexGoalMarks(goalRows);
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
        goals,
      ),
    ),
  };
}

function buildStudentRow(
  student: StudentGradeRow["student"],
  categories: ClassGradebook["categories"],
  assessmentsByKey: Map<string, Assessment>,
  adjustmentsByAssessment: Map<number, Array<Adjustment>>,
  goals: GoalIndex,
): StudentGradeRow {
  const categoryGrades = categories.map((category) => {
    const subcategoryGrades = category.subcategories.map((subcategory) => {
      const workGrades = subcategory.works.map((work) =>
        buildWorkGrade(
          student.id,
          work,
          assessmentsByKey,
          adjustmentsByAssessment,
          lookupGoal(goals.works, student.id, work.id),
        ),
      );

      return {
        subcategoryId: subcategory.id,
        percent: weightedAverage(
          workGrades.flatMap((workGrade) => countableWorkAverage(workGrade)),
        ),
        goalMark: lookupGoal(goals.subcategories, student.id, subcategory.id),
        works: workGrades,
      } satisfies StudentSubcategoryGrade;
    });
    const categoryWorkGrades = category.works.map((work) =>
      buildWorkGrade(
        student.id,
        work,
        assessmentsByKey,
        adjustmentsByAssessment,
        lookupGoal(goals.works, student.id, work.id),
      ),
    );

    return {
      categoryId: category.id,
      percent: weightedAverage([
        ...subcategoryGrades.map((subcategoryGrade, index) => ({
          percent: subcategoryGrade.percent,
          weight: category.subcategories[index]?.weight ?? 0,
        })),
        ...categoryWorkGrades.flatMap((workGrade) => countableWorkAverage(workGrade)),
      ]),
      goalMark: lookupGoal(goals.categories, student.id, category.id),
      subcategories: subcategoryGrades,
      works: categoryWorkGrades,
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
    courseGoalMark: goals.courses.get(student.id) ?? null,
    categories: categoryGrades,
  };
}

function buildWorkGrade(
  studentId: number,
  work: GradeWork,
  assessmentsByKey: Map<string, Assessment>,
  adjustmentsByAssessment: Map<number, Array<Adjustment>>,
  goalMark: number | null,
): StudentWorkGrade {
  const assessment = assessmentsByKey.get(assessmentKey(studentId, work.id)) ?? null;
  const workAdjustments = assessment ? (adjustmentsByAssessment.get(assessment.id) ?? []) : [];
  const percent = !assessment
    ? null
    : assessment.status === "nhi"
      ? 0
      : assessmentPercent(assessment.score, work.maximumScore, workAdjustments);

  return {
    workId: work.id,
    assessment,
    adjustments: workAdjustments,
    percent,
    goalMark,
  };
}

function countableWorkAverage(
  workGrade: StudentWorkGrade,
): Array<{ percent: number | null; weight: number }> {
  if (!workGrade.assessment || !assessmentCountsTowardAverage(workGrade.assessment.status)) {
    return [];
  }

  return [{ percent: workGrade.percent, weight: workGrade.assessment.weight }];
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

type GoalIndex = {
  courses: Map<number, number>;
  categories: Map<string, number>;
  subcategories: Map<string, number>;
  works: Map<string, number>;
};

async function listClassGoalMarks(
  db: GradebookDatabase,
  classId: number,
  structure: ClassGradingStructure,
) {
  const categoryIds = structure.categories.map((category) => category.id);
  const subcategoryIds = structure.categories.flatMap((category) =>
    category.subcategories.map((subcategory) => subcategory.id),
  );
  const workIds = flattenWorks(structure).map((work) => work.id);
  const filters: Array<SQL> = [eq(goalMarks.classId, classId)];

  if (categoryIds.length > 0) {
    filters.push(inArray(goalMarks.categoryId, categoryIds));
  }

  if (subcategoryIds.length > 0) {
    filters.push(inArray(goalMarks.subcategoryId, subcategoryIds));
  }

  if (workIds.length > 0) {
    filters.push(inArray(goalMarks.workId, workIds));
  }

  return db.select().from(goalMarks).where(combineFilters(filters));
}

function indexGoalMarks(rows: Array<typeof goalMarks.$inferSelect>): GoalIndex {
  const index: GoalIndex = {
    courses: new Map(),
    categories: new Map(),
    subcategories: new Map(),
    works: new Map(),
  };

  for (const row of rows) {
    if (row.classId !== null) {
      index.courses.set(row.studentId, row.goalMark);
    } else if (row.categoryId !== null) {
      index.categories.set(goalKey(row.studentId, row.categoryId), row.goalMark);
    } else if (row.subcategoryId !== null) {
      index.subcategories.set(goalKey(row.studentId, row.subcategoryId), row.goalMark);
    } else if (row.workId !== null) {
      index.works.set(goalKey(row.studentId, row.workId), row.goalMark);
    }
  }

  return index;
}

function lookupGoal(
  goals: Map<string, number>,
  studentId: number,
  targetId: number,
): number | null {
  return goals.get(goalKey(studentId, targetId)) ?? null;
}

function goalKey(studentId: number, targetId: number): string {
  return `${studentId}:${targetId}`;
}

function combineFilters(filters: Array<SQL>): SQL {
  const [first, second, ...rest] = filters;

  if (!first) {
    throw new Error("The goal marks could not be loaded.");
  }

  if (!second) {
    return first;
  }

  const combined = or(first, second, ...rest);

  if (!combined) {
    throw new Error("The goal marks could not be loaded.");
  }

  return combined;
}

function parseLookupInput(input: ClassLookupInput): ClassLookupInput {
  const result = classLookupInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That class was not found.");
  }

  return result.data;
}
