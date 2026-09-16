import { describe, expect, it } from "vitest";
import {
  assessmentCountsTowardAverage,
  assessmentPercent,
  assessmentStatusCode,
  formatGradePercent,
  formatWeightPercent,
  markInputErrorMessage,
  mean,
  parseSpecialMark,
  weightedAverage,
} from "./grades";

describe("assessmentPercent", () => {
  it("divides the score by the maximum score", () => {
    expect(assessmentPercent(8, 10, [])).toBe(0.8);
  });

  it("applies raw adjustments to the score before dividing", () => {
    expect(assessmentPercent(8, 10, [{ rawChange: 1, percentChange: null }])).toBe(0.9);
  });

  it("applies percent adjustments to the score over the maximum", () => {
    expect(assessmentPercent(8, 10, [{ rawChange: null, percentChange: 5 }])).toBeCloseTo(0.85);
  });

  it("applies raw adjustments first, then percent adjustments", () => {
    expect(
      assessmentPercent(8, 10, [
        { rawChange: 1, percentChange: null },
        { rawChange: null, percentChange: 5 },
      ]),
    ).toBeCloseTo(0.95);
  });

  it("returns null when the maximum score is not usable", () => {
    expect(assessmentPercent(8, 0, [])).toBeNull();
    expect(assessmentPercent(8, Number.NaN, [])).toBeNull();
  });
});

describe("weightedAverage", () => {
  it("returns a weighted average of countable percents", () => {
    expect(
      weightedAverage([
        { percent: 0.8, weight: 1 },
        { percent: 1, weight: 3 },
      ]),
    ).toBe(0.95);
  });

  it("ignores null percents, non-positive weights, and empty lists", () => {
    expect(
      weightedAverage([
        { percent: null, weight: 2 },
        { percent: 0.5, weight: 0 },
      ]),
    ).toBeNull();
    expect(weightedAverage([])).toBeNull();
  });
});

describe("mean", () => {
  it("returns the unweighted mean of finite values", () => {
    expect(mean([0.5, 1, null, Number.NaN])).toBe(0.75);
  });

  it("returns null when nothing is countable", () => {
    expect(mean([null, Number.NaN])).toBeNull();
    expect(mean([])).toBeNull();
  });
});

describe("formatGradePercent", () => {
  it("formats a ratio as a percentage", () => {
    expect(formatGradePercent(0.8)).toBe("80.0%");
    expect(formatGradePercent(null)).toBe("—");
  });
});

describe("assessmentCountsTowardAverage", () => {
  it("counts ordinary and not-handed-in marks, but not exemptions", () => {
    expect(assessmentCountsTowardAverage("counted")).toBe(true);
    expect(assessmentCountsTowardAverage("nhi")).toBe(true);
    expect(assessmentCountsTowardAverage("exempt")).toBe(false);
  });
});

describe("assessmentStatusCode", () => {
  it("returns the displayed mark code for special statuses", () => {
    expect(assessmentStatusCode("exempt")).toBe("E");
    expect(assessmentStatusCode("nhi")).toBe("NHI");
    expect(assessmentStatusCode("counted")).toBeNull();
  });
});

describe("parseSpecialMark", () => {
  it("accepts exempt and not-handed-in codes without regard to case", () => {
    expect(parseSpecialMark("E")).toBe("exempt");
    expect(parseSpecialMark("e")).toBe("exempt");
    expect(parseSpecialMark("NHI")).toBe("nhi");
    expect(parseSpecialMark("nhi")).toBe("nhi");
    expect(parseSpecialMark("Nhi")).toBe("nhi");
    expect(parseSpecialMark("nHi")).toBe("nhi");
  });

  it("ignores surrounding whitespace", () => {
    expect(parseSpecialMark("  nhi  ")).toBe("nhi");
    expect(parseSpecialMark(" e ")).toBe("exempt");
  });

  it("returns null for ordinary marks and unknown codes", () => {
    expect(parseSpecialMark("12")).toBeNull();
    expect(parseSpecialMark("abc")).toBeNull();
    expect(parseSpecialMark("")).toBeNull();
  });
});

describe("markInputErrorMessage", () => {
  it("lists every special mark code", () => {
    expect(markInputErrorMessage()).toBe("Enter a mark, E, or NHI.");
  });
});

describe("formatWeightPercent", () => {
  it("displays a stored weight as a percent", () => {
    expect(formatWeightPercent(1)).toBe("1%");
    expect(formatWeightPercent(2.5)).toBe("2.5%");
    expect(formatWeightPercent(Number.NaN)).toBe("—");
  });
});
