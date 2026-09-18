import {
  kernelDensityEstimation,
  mean as statisticsMean,
  median as statisticsMedian,
} from "simple-statistics";
import { assessmentCountsTowardAverage } from "./grades";
import type {
  ClassGradebook,
  GradeCategory,
  GradeWork,
  StudentGradeRow,
  StudentWorkGrade,
} from "./ipc";
import { personDisplayName } from "./person-name";

export const GRADE_PASS_CUTOFF = 0.6;
export const DISTRIBUTION_BIN_COUNT = 10;

export type WorkMark = {
  studentId: number;
  name: string;
  percent: number;
};

export type ClassWorkOption = {
  id: number;
  label: string;
};

export type DistributionBin = {
  axisPercent: number;
  start: number;
  end: number;
  label: string;
  count: number;
  belowCutoff: boolean;
  marks: Array<WorkMark>;
};

export type DensityPoint = {
  axisPercent: number;
  count: number;
};

export type WorkDistribution = {
  sampleSize: number;
  mean: number | null;
  median: number | null;
  cutoff: number;
  bins: Array<DistributionBin>;
  density: Array<DensityPoint>;
};

export type CategoryScopeOption = {
  kind: "work" | "subcategory";
  id: number;
  label: string;
};

export function listCategoryScopes(category: GradeCategory): Array<CategoryScopeOption> {
  return [
    ...category.subcategories.map((subcategory) => ({
      kind: "subcategory" as const,
      id: subcategory.id,
      label: subcategory.name,
    })),
    ...category.works.map((work) => ({
      kind: "work" as const,
      id: work.id,
      label: work.name,
    })),
  ];
}

export function listClassWorks(categories: Array<GradeCategory>): Array<ClassWorkOption> {
  return categories.flatMap((category) => [
    ...category.subcategories.flatMap((subcategory) =>
      subcategory.works.map((work) => ({
        id: work.id,
        label: `${category.name} · ${subcategory.name} · ${work.name}`,
      })),
    ),
    ...category.works.map((work) => ({
      id: work.id,
      label: `${category.name} · ${work.name}`,
    })),
  ]);
}

export function findClassWork(categories: Array<GradeCategory>, workId: number): GradeWork | null {
  for (const category of categories) {
    for (const work of category.works) {
      if (work.id === workId) {
        return work;
      }
    }

    for (const subcategory of category.subcategories) {
      for (const work of subcategory.works) {
        if (work.id === workId) {
          return work;
        }
      }
    }
  }

  return null;
}

export function countableMarksForWork(gradebook: ClassGradebook, workId: number): Array<WorkMark> {
  return gradebook.students.flatMap((row) => {
    const workGrade = workGradeFromRow(row, workId);

    if (
      workGrade === null ||
      workGrade.assessment === null ||
      !assessmentCountsTowardAverage(workGrade.assessment.status) ||
      workGrade.percent === null ||
      !Number.isFinite(workGrade.percent)
    ) {
      return [];
    }

    return [
      {
        studentId: row.student.id,
        name: personDisplayName(row.student),
        percent: workGrade.percent,
      },
    ];
  });
}

export function countableCourseMarks(gradebook: ClassGradebook): Array<WorkMark> {
  return gradebook.students.flatMap((row) => finiteMark(row, row.coursePercent));
}

export function countableMarksForCategory(
  gradebook: ClassGradebook,
  categoryId: number,
): Array<WorkMark> {
  return gradebook.students.flatMap((row) => {
    const category = row.categories.find((item) => item.categoryId === categoryId);
    return finiteMark(row, category?.percent ?? null);
  });
}

export function countableMarksForSubcategory(
  gradebook: ClassGradebook,
  categoryId: number,
  subcategoryId: number,
): Array<WorkMark> {
  return gradebook.students.flatMap((row) => {
    const category = row.categories.find((item) => item.categoryId === categoryId);
    const subcategory = category?.subcategories.find(
      (item) => item.subcategoryId === subcategoryId,
    );
    return finiteMark(row, subcategory?.percent ?? null);
  });
}

export function workDistribution(
  marks: Array<WorkMark>,
  cutoff: number = GRADE_PASS_CUTOFF,
): WorkDistribution {
  const percents = marks.map((mark) => mark.percent);
  const bins = emptyBins(cutoff);

  for (const mark of marks) {
    bins[binIndex(mark.percent)]?.marks.push(mark);
  }

  for (const bin of bins) {
    bin.count = bin.marks.length;
  }

  const density = densityCounts(percents);

  return {
    sampleSize: marks.length,
    mean: percents.length > 0 ? statisticsMean(percents) : null,
    median: percents.length > 0 ? statisticsMedian(percents) : null,
    cutoff,
    bins,
    density,
  };
}

function finiteMark(row: StudentGradeRow, percent: number | null): Array<WorkMark> {
  if (percent === null || !Number.isFinite(percent)) {
    return [];
  }

  return [
    {
      studentId: row.student.id,
      name: personDisplayName(row.student),
      percent,
    },
  ];
}

function workGradeFromRow(row: StudentGradeRow, workId: number): StudentWorkGrade | null {
  for (const category of row.categories) {
    for (const work of category.works) {
      if (work.workId === workId) {
        return work;
      }
    }

    for (const subcategory of category.subcategories) {
      for (const work of subcategory.works) {
        if (work.workId === workId) {
          return work;
        }
      }
    }
  }

  return null;
}

function emptyBins(cutoff: number): Array<DistributionBin> {
  const binWidth = 1 / DISTRIBUTION_BIN_COUNT;

  return Array.from({ length: DISTRIBUTION_BIN_COUNT }, (_unused, index) => {
    const start = index * binWidth;
    const end = (index + 1) * binWidth;

    return {
      axisPercent: ((start + end) / 2) * 100,
      start,
      end,
      label: `${Math.round(start * 100)}–${Math.round(end * 100)}%`,
      count: 0,
      belowCutoff: start < cutoff,
      marks: [],
    };
  });
}

function binIndex(percent: number): number {
  if (percent >= 1) {
    return DISTRIBUTION_BIN_COUNT - 1;
  }

  if (percent < 0) {
    return 0;
  }

  return Math.min(DISTRIBUTION_BIN_COUNT - 1, Math.floor(percent * DISTRIBUTION_BIN_COUNT));
}

function densityCounts(percents: Array<number>): Array<DensityPoint> {
  const density = densityEstimator(percents);

  if (!density) {
    return [];
  }

  const binWidth = 1 / DISTRIBUTION_BIN_COUNT;
  const steps = 40;
  const points: Array<DensityPoint> = [];

  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    const estimated = density(ratio);

    if (!Number.isFinite(estimated) || estimated < 0) {
      continue;
    }

    points.push({
      axisPercent: ratio * 100,
      count: estimated * percents.length * binWidth,
    });
  }

  return points;
}

function densityEstimator(percents: Array<number>): ((ratio: number) => number) | null {
  if (!hasSpread(percents)) {
    return null;
  }

  try {
    return kernelDensityEstimation(percents);
  } catch {
    return null;
  }
}

function hasSpread(percents: Array<number>): boolean {
  const first = percents[0];

  if (first === undefined || percents.length < 2) {
    return false;
  }

  return percents.some((percent) => percent !== first);
}
