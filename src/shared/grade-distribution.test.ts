import { describe, expect, it } from "vitest";
import {
  GRADE_PASS_CUTOFF,
  countableCourseMarks,
  countableMarksForCategory,
  countableMarksForSubcategory,
  countableMarksForWork,
  findClassWork,
  listCategoryScopes,
  listClassWorks,
  workDistribution,
} from "./grade-distribution";
import type {
  ClassGradebook,
  GradeCategory,
  GradeWork,
  Student,
  StudentGradeRow,
  StudentWorkGrade,
} from "./ipc";

describe("listClassWorks", () => {
  it("labels category and sub-category work", () => {
    expect(listClassWorks([categoryFixture()])).toEqual([
      { id: 2, label: "Tests · Essays · Essay 1" },
      { id: 1, label: "Tests · Quiz 1" },
    ]);
  });
});

describe("findClassWork", () => {
  it("returns category and sub-category work by id", () => {
    const categories = [categoryFixture()];

    expect(findClassWork(categories, 1)?.name).toBe("Quiz 1");
    expect(findClassWork(categories, 2)?.name).toBe("Essay 1");
    expect(findClassWork(categories, 99)).toBeNull();
  });
});

describe("listCategoryScopes", () => {
  it("lists sub-categories before category-level work", () => {
    expect(listCategoryScopes(categoryFixture())).toEqual([
      { kind: "subcategory", id: 20, label: "Essays" },
      { kind: "work", id: 1, label: "Quiz 1" },
    ]);
  });
});

describe("countableMarksForWork", () => {
  it("keeps counted and not-handed-in percents, and skips exemptions and missing marks", () => {
    const gradebook = gradebookFixture();

    expect(countableMarksForWork(gradebook, 1)).toEqual([
      { studentId: 1, name: "Alex", percent: 0.8 },
      { studentId: 2, name: "Blair", percent: 0 },
    ]);
    expect(countableMarksForWork(gradebook, 2)).toEqual([]);
  });
});

describe("countableCourseMarks", () => {
  it("keeps finite course percents", () => {
    expect(countableCourseMarks(gradebookWithAverages())).toEqual([
      { studentId: 1, name: "Alex", percent: 0.8 },
      { studentId: 2, name: "Blair", percent: 0 },
    ]);
  });
});

describe("countableMarksForCategory", () => {
  it("keeps finite category percents for the matching category", () => {
    expect(countableMarksForCategory(gradebookWithAverages(), 10)).toEqual([
      { studentId: 1, name: "Alex", percent: 0.75 },
      { studentId: 2, name: "Blair", percent: 0 },
    ]);
    expect(countableMarksForCategory(gradebookWithAverages(), 99)).toEqual([]);
  });
});

describe("countableMarksForSubcategory", () => {
  it("keeps finite sub-category percents for the matching sub-category", () => {
    expect(countableMarksForSubcategory(gradebookWithAverages(), 10, 20)).toEqual([
      { studentId: 1, name: "Alex", percent: 0.7 },
      { studentId: 2, name: "Blair", percent: 0 },
    ]);
    expect(countableMarksForSubcategory(gradebookWithAverages(), 10, 99)).toEqual([]);
  });
});

describe("workDistribution", () => {
  it("bins marks, colours bars below the cutoff, and summarises the sample", () => {
    const distribution = workDistribution([
      workMark("Low", 0.42),
      workMark("Edge", 0.6),
      workMark("High", 0.88),
    ]);
    const lowBin = distribution.bins.find((bin) => bin.label === "40–50%");
    const passBin = distribution.bins.find((bin) => bin.label === "60–70%");
    const highBin = distribution.bins.find((bin) => bin.label === "80–90%");

    expect(distribution.sampleSize).toBe(3);
    expect(distribution.cutoff).toBe(GRADE_PASS_CUTOFF);
    expect(distribution.mean).toBeCloseTo(0.6333);
    expect(distribution.median).toBeCloseTo(0.6);
    expect(lowBin?.count).toBe(1);
    expect(lowBin?.belowCutoff).toBe(true);
    expect(lowBin?.marks.map((mark) => mark.name)).toEqual(["Low"]);
    expect(passBin?.count).toBe(1);
    expect(passBin?.belowCutoff).toBe(false);
    expect(highBin?.count).toBe(1);
    expect(highBin?.belowCutoff).toBe(false);
  });

  it("puts 60% in the first bin that is not below the cutoff", () => {
    const distribution = workDistribution([workMark("Pass", 0.6)]);
    const below = distribution.bins.find((bin) => bin.label === "50–60%");
    const atCutoff = distribution.bins.find((bin) => bin.label === "60–70%");

    expect(below?.count).toBe(0);
    expect(atCutoff?.count).toBe(1);
    expect(atCutoff?.belowCutoff).toBe(false);
  });

  it("places a student's countable mark in the matching bin", () => {
    const marks = countableMarksForWork(gradebookFixture(), 1);
    const distribution = workDistribution(marks);
    const alexBin = distribution.bins.find((bin) => bin.marks.some((mark) => mark.studentId === 1));
    const blairBin = distribution.bins.find((bin) =>
      bin.marks.some((mark) => mark.studentId === 2),
    );

    expect(alexBin?.label).toBe("80–90%");
    expect(blairBin?.label).toBe("0–10%");
  });

  it("omits a density curve when there are fewer than two distinct marks", () => {
    expect(workDistribution([]).density).toEqual([]);
    expect(workDistribution([workMark("Only", 0.7)]).density).toEqual([]);
    expect(workDistribution([workMark("A", 0.7, 1), workMark("B", 0.7, 2)]).density).toEqual([]);
  });

  it("estimates a non-negative density curve when marks are spread out", () => {
    const distribution = workDistribution([
      workMark("Amira", 0.38),
      workMark("Ben", 0.47),
      workMark("Cara", 0.55),
      workMark("Dev", 0.58),
      workMark("Elena", 0.62),
      workMark("Farid", 0.66),
      workMark("Grace", 0.71),
      workMark("Hugo", 0.74),
      workMark("Ines", 0.76),
      workMark("Jules", 0.88),
    ]);

    expect(distribution.density.length).toBeGreaterThan(10);
    expect(distribution.density.every((point) => Number.isFinite(point.count))).toBe(true);
    expect(distribution.density.every((point) => point.count >= 0)).toBe(true);
    expect(distribution.density[0]?.axisPercent).toBe(0);
    expect(distribution.density.at(-1)?.axisPercent).toBe(100);
  });
});

function workMark(
  name: string,
  percent: number,
  studentId = 1,
): { studentId: number; name: string; percent: number } {
  return { studentId, name, percent };
}

function gradebookWithAverages(): ClassGradebook {
  const gradebook = gradebookFixture();

  return {
    ...gradebook,
    students: gradebook.students.map((row, index) => {
      if (index === 0) {
        return withAverages(row, 0.8, 0.75, 0.7);
      }

      if (index === 1) {
        return withAverages(row, 0, 0, 0);
      }

      return row;
    }),
  };
}

function withAverages(
  row: StudentGradeRow,
  coursePercent: number,
  categoryPercent: number,
  subcategoryPercent: number,
): StudentGradeRow {
  return {
    ...row,
    coursePercent,
    categories: row.categories.map((category) => ({
      ...category,
      percent: categoryPercent,
      subcategories: category.subcategories.map((subcategory) => ({
        ...subcategory,
        percent: subcategoryPercent,
      })),
    })),
  };
}

function gradebookFixture(): ClassGradebook {
  const quiz = workFixture(1, 10, null);
  const essay = workFixture(2, null, 20);

  return {
    categories: [categoryFixture(quiz, essay)],
    students: [
      studentRow(1, "Alex", [countedGrade(quiz.id, 1, 0.8), missingGrade(essay.id)]),
      studentRow(2, "Blair", [nhiGrade(quiz.id, 2), missingGrade(essay.id)]),
      studentRow(3, "Casey", [exemptGrade(quiz.id, 3), missingGrade(essay.id)]),
    ],
  };
}

function categoryFixture(
  quiz = workFixture(1, 10, null),
  essay = workFixture(2, null, 20),
): GradeCategory {
  return {
    id: 10,
    classId: 1,
    name: "Tests",
    notes: "",
    weight: 1,
    works: [quiz],
    subcategories: [
      {
        id: 20,
        categoryId: 10,
        name: "Essays",
        weight: 1,
        works: [essay],
      },
    ],
  };
}

function workFixture(
  id: number,
  categoryId: number | null,
  subcategoryId: number | null,
): GradeWork {
  return {
    id,
    categoryId,
    subcategoryId,
    name: id === 1 ? "Quiz 1" : "Essay 1",
    notes: "",
    maximumScore: 10,
    weight: 1,
  };
}

function studentRow(
  id: number,
  firstName: string,
  works: Array<StudentWorkGrade>,
): StudentGradeRow {
  return {
    student: studentFixture(id, firstName),
    coursePercent: null,
    categories: [
      {
        categoryId: 10,
        percent: null,
        works: works.filter((work) => work.workId === 1),
        subcategories: [
          {
            subcategoryId: 20,
            percent: null,
            works: works.filter((work) => work.workId === 2),
          },
        ],
      },
    ],
  };
}

function studentFixture(id: number, firstName: string): Student {
  return {
    id,
    firstName,
    lastName: "Example",
    preferredName: firstName,
    notes: "",
    email: "",
    goalMark: null,
  };
}

function countedGrade(workId: number, studentId: number, percent: number): StudentWorkGrade {
  return {
    workId,
    percent,
    adjustments: [],
    assessment: {
      id: studentId,
      workId,
      studentId,
      score: percent * 10,
      date: "2026-09-01",
      weight: 1,
      notes: "",
      status: "counted",
    },
  };
}

function nhiGrade(workId: number, studentId: number): StudentWorkGrade {
  return {
    workId,
    percent: 0,
    adjustments: [],
    assessment: {
      id: studentId + 10,
      workId,
      studentId,
      score: 0,
      date: "2026-09-01",
      weight: 1,
      notes: "",
      status: "nhi",
    },
  };
}

function exemptGrade(workId: number, studentId: number): StudentWorkGrade {
  return {
    workId,
    percent: 0.4,
    adjustments: [],
    assessment: {
      id: studentId + 20,
      workId,
      studentId,
      score: 4,
      date: "2026-09-01",
      weight: 1,
      notes: "",
      status: "exempt",
    },
  };
}

function missingGrade(workId: number): StudentWorkGrade {
  return {
    workId,
    percent: null,
    adjustments: [],
    assessment: null,
  };
}
