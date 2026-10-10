import { describe, expect, it } from "vitest";
import {
  assessmentCountsTowardAverage,
  assessmentHasVisibleMark,
  assessmentPercent,
  assessmentStatusCode,
  formatGradePercent,
  formatWeightPercent,
  goalMarkAxisPercent,
  markInputErrorMessage,
  markPresentation,
  markEntryValue,
  gradeCellCommit,
  editorExemptChecked,
  editorMarkSave,
  editorNhiChecked,
  nhiClearsExistingMark,
  mean,
  parseSpecialMark,
  weightedAverage,
  workCountsTowardAverage,
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
  it("counts ordinary and not-handed-in marks, but not exemptions or unmarked notes", () => {
    expect(assessmentCountsTowardAverage("counted")).toBe(true);
    expect(assessmentCountsTowardAverage("nhi")).toBe(true);
    expect(assessmentCountsTowardAverage("exempt")).toBe(false);
    expect(assessmentCountsTowardAverage("unmarked")).toBe(false);
  });
});

describe("assessmentHasVisibleMark", () => {
  it("treats counted, exempt, and not-handed-in as marks", () => {
    expect(assessmentHasVisibleMark("counted")).toBe(true);
    expect(assessmentHasVisibleMark("exempt")).toBe(true);
    expect(assessmentHasVisibleMark("nhi")).toBe(true);
    expect(assessmentHasVisibleMark("unmarked")).toBe(false);
  });
});

describe("workCountsTowardAverage", () => {
  it("drops covered work and work with no countable assessment", () => {
    expect(
      workCountsTowardAverage({
        excused: true,
        assessment: { status: "counted" },
      }),
    ).toBe(false);
    expect(
      workCountsTowardAverage({
        excused: true,
        assessment: { status: "nhi" },
      }),
    ).toBe(false);
    expect(workCountsTowardAverage({ excused: false, assessment: null })).toBe(false);
    expect(
      workCountsTowardAverage({
        excused: false,
        assessment: { status: "exempt" },
      }),
    ).toBe(false);
    expect(
      workCountsTowardAverage({
        excused: false,
        assessment: { status: "counted" },
      }),
    ).toBe(true);
    expect(
      workCountsTowardAverage({
        excused: false,
        assessment: { status: "nhi" },
      }),
    ).toBe(true);
  });
});

describe("assessmentStatusCode", () => {
  it("returns the displayed mark code for special statuses", () => {
    expect(assessmentStatusCode("exempt")).toBe("E");
    expect(assessmentStatusCode("nhi")).toBe("NHI");
    expect(assessmentStatusCode("counted")).toBeNull();
    expect(assessmentStatusCode("unmarked")).toBeNull();
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

describe("mark presentation", () => {
  it("shows a stored exempt score, including zero, and E when the score was cleared", () => {
    expect(markPresentation("exempt", 0)).toEqual({
      tone: "exempt",
      code: null,
      greyScore: true,
    });
    expect(markPresentation("exempt", 8)).toEqual({
      tone: "exempt",
      code: null,
      greyScore: true,
    });
    expect(markPresentation("exempt", null)).toEqual({
      tone: "exempt",
      code: "E",
      greyScore: false,
    });
    expect(markEntryValue("exempt", 0)).toBe("0");
    expect(markEntryValue("exempt", null)).toBe("E");
  });

  it("shows NHI instead of a score, and a counted number as itself", () => {
    expect(markPresentation("nhi", null)).toEqual({ tone: "nhi", code: "NHI", greyScore: false });
    expect(markPresentation("nhi", 8)).toEqual({ tone: "nhi", code: "NHI", greyScore: false });
    expect(markPresentation("counted", 8)).toEqual({
      tone: "counted",
      code: null,
      greyScore: false,
    });
    expect(markEntryValue("nhi", 8)).toBe("NHI");
    expect(markEntryValue("counted", 8)).toBe("8");
  });
});

describe("grade cell commit", () => {
  it("clears an exempt score when E is typed again", () => {
    expect(gradeCellCommit({ status: "exempt", score: 8 }, "E")).toEqual({
      kind: "save",
      status: "exempt",
      score: null,
    });
    expect(gradeCellCommit({ status: "exempt", score: null }, "e")).toEqual({ kind: "ignore" });
  });

  it("leaves an unchanged greyed exempt score exempt", () => {
    expect(gradeCellCommit({ status: "exempt", score: 8 }, "8")).toEqual({ kind: "ignore" });
    expect(gradeCellCommit({ status: "exempt", score: 8 }, "9")).toEqual({
      kind: "save",
      status: "exempt",
      score: 9,
    });
  });

  it("clears the score for NHI without keeping a previous number", () => {
    expect(gradeCellCommit({ status: "exempt", score: 8 }, "NHI")).toEqual({
      kind: "save",
      status: "nhi",
      score: null,
    });
    expect(gradeCellCommit({ status: "nhi", score: null }, "nhi")).toEqual({ kind: "ignore" });
    expect(gradeCellCommit({ status: "nhi", score: 4 }, "NHI")).toEqual({
      kind: "save",
      status: "nhi",
      score: null,
    });
  });

  it("counts a number typed over E or NHI", () => {
    expect(gradeCellCommit({ status: "exempt", score: null }, "6")).toEqual({
      kind: "save",
      status: "counted",
      score: 6,
    });
    expect(gradeCellCommit({ status: "nhi", score: null }, "6")).toEqual({
      kind: "save",
      status: "counted",
      score: 6,
    });
  });

  it("deletes an existing mark when the cell is emptied and ignores an empty new cell", () => {
    expect(gradeCellCommit({ status: "counted", score: 4 }, "")).toEqual({ kind: "delete" });
    expect(gradeCellCommit({ status: "unmarked", score: null }, "")).toEqual({ kind: "ignore" });
    expect(gradeCellCommit({ status: "exempt", score: null }, "")).toEqual({ kind: "delete" });
    expect(gradeCellCommit(null, "")).toEqual({ kind: "ignore" });
    expect(gradeCellCommit(null, "abc")).toEqual({ kind: "invalid" });
  });
});

describe("editor mark save", () => {
  it("keeps an exempt score, clears NHI, and requires a counted score", () => {
    expect(editorMarkSave("exempt", 8)).toEqual({ status: "exempt", score: 8 });
    expect(editorMarkSave("exempt", null)).toEqual({ status: "exempt", score: null });
    expect(editorMarkSave("nhi", 8)).toEqual({ status: "nhi", score: null });
    expect(editorMarkSave("counted", 0)).toEqual({ status: "counted", score: 0 });
    expect(editorMarkSave("counted", null)).toBeNull();
  });

  it("treats a saved number or a numeric field as a mark NHI would clear", () => {
    expect(nhiClearsExistingMark(8, "")).toBe(true);
    expect(nhiClearsExistingMark(null, "0")).toBe(true);
    expect(nhiClearsExistingMark(null, "")).toBe(false);
    expect(nhiClearsExistingMark(null, "abc")).toBe(false);
    expect(nhiClearsExistingMark(8, "abc")).toBe(true);
  });

  it("leaves a counted zero when NHI is turned off", () => {
    expect(editorNhiChecked({ score: "", exempt: false, nhi: true }, false)).toEqual({
      score: "0",
      exempt: false,
      nhi: false,
    });
  });

  it("clears the score when Exempt replaces NHI", () => {
    expect(editorExemptChecked({ score: "8", exempt: false, nhi: true }, true)).toEqual({
      score: "",
      exempt: true,
      nhi: false,
    });
  });

  it("keeps an entered score when Exempt is turned on or off", () => {
    expect(editorExemptChecked({ score: "8", exempt: false, nhi: false }, true)).toEqual({
      score: "8",
      exempt: true,
      nhi: false,
    });
    expect(editorExemptChecked({ score: "8", exempt: true, nhi: false }, false)).toEqual({
      score: "8",
      exempt: false,
      nhi: false,
    });
  });

  it("clears the score when NHI is applied", () => {
    expect(editorNhiChecked({ score: "8", exempt: true, nhi: false }, true)).toEqual({
      score: "",
      exempt: false,
      nhi: true,
    });
  });
});

describe("goal mark axis", () => {
  it("places the goal on the percent axis", () => {
    expect(goalMarkAxisPercent(0.8)).toBe(80);
    expect(goalMarkAxisPercent(1.2)).toBe(100);
    expect(goalMarkAxisPercent(null)).toBeNull();
  });
});

describe("formatWeightPercent", () => {
  it("displays a stored weight as a percent", () => {
    expect(formatWeightPercent(1)).toBe("1%");
    expect(formatWeightPercent(2.5)).toBe("2.5%");
    expect(formatWeightPercent(Number.NaN)).toBe("—");
  });
});
