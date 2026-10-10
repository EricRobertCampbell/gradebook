import { describe, expect, it } from "vitest";
import type { GradeWork, StudentWorkGrade } from "../shared/ipc";
import { workReportDetails } from "./student-class-report-details";

describe("workReportDetails", () => {
  it("keeps the work note and adjustment details and leaves out the assessment note", () => {
    const work: GradeWork = {
      id: 1,
      categoryId: null,
      subcategoryId: 2,
      name: "Quiz",
      notes: "Open book",
      date: null,
      maximumScore: 10,
      weight: 1,
      sortOrder: 0,
    };
    const workGrade: StudentWorkGrade = {
      workId: 1,
      percent: 0.8,
      goalMark: null,
      excused: false,
      assessment: {
        id: 3,
        workId: 1,
        studentId: 4,
        score: 8,
        date: "2026-10-10",
        weight: 1,
        notes: "Late",
        status: "counted",
      },
      adjustments: [
        {
          id: 5,
          assessmentId: 3,
          percentChange: 5,
          rawChange: 1,
          description: "Bonus",
          notes: "Oral",
        },
      ],
    };

    expect(workReportDetails(work, workGrade)).toEqual([
      "Open book",
      "Bonus · raw +1 · percent +5 · Oral",
    ]);
  });
});
