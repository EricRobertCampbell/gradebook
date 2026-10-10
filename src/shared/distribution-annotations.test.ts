import { describe, expect, it } from "vitest";
import {
  distributionAnnotations,
  isHighlightedStudent,
  markIsBelowCutoff,
} from "./distribution-annotations";
import { GRADE_PASS_CUTOFF } from "./grade-distribution";

describe("distributionAnnotations", () => {
  it("scales the cutoff and clamps the goal", () => {
    expect(distributionAnnotations(0.6, undefined, null)).toEqual({
      cutoffPercent: 60,
      goalPercent: null,
      highlightedStudentId: undefined,
    });
    expect(distributionAnnotations(0.6, 4, 1.4)).toEqual({
      cutoffPercent: 60,
      goalPercent: 100,
      highlightedStudentId: 4,
    });
    expect(distributionAnnotations(0.6, 4, Number.NaN).goalPercent).toBeNull();
  });
});

describe("markIsBelowCutoff", () => {
  it("treats the pass cutoff as at or above", () => {
    expect(markIsBelowCutoff(0.599, GRADE_PASS_CUTOFF)).toBe(true);
    expect(markIsBelowCutoff(GRADE_PASS_CUTOFF, GRADE_PASS_CUTOFF)).toBe(false);
  });

  it("uses the cutoff it is given", () => {
    expect(markIsBelowCutoff(0.7, 0.8)).toBe(true);
    expect(markIsBelowCutoff(0.8, 0.8)).toBe(false);
    expect(markIsBelowCutoff(0.7, GRADE_PASS_CUTOFF)).toBe(false);
  });
});

describe("isHighlightedStudent", () => {
  it("matches only the selected student", () => {
    expect(isHighlightedStudent(4, 4)).toBe(true);
    expect(isHighlightedStudent(3, 4)).toBe(false);
    expect(isHighlightedStudent(4, undefined)).toBe(false);
  });
});
