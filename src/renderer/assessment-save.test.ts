import { describe, expect, it } from "vitest";
import { assessmentScoreIsRequired, planAssessmentSave } from "./assessment-save";

describe("planAssessmentSave", () => {
  it("saves exempt and not handed in when the score box is empty", () => {
    expect(
      planAssessmentSave({
        exempt: true,
        nhi: false,
        score: "",
        notes: "",
        hasAssessment: true,
      }),
    ).toEqual({ kind: "upsert", status: "exempt", score: null });
    expect(
      planAssessmentSave({
        exempt: true,
        nhi: false,
        score: "8",
        notes: "Away",
        hasAssessment: true,
      }),
    ).toEqual({ kind: "upsert", status: "exempt", score: 8 });
    expect(
      planAssessmentSave({
        exempt: true,
        nhi: false,
        score: "0",
        notes: "",
        hasAssessment: true,
      }),
    ).toEqual({ kind: "upsert", status: "exempt", score: 0 });
    expect(
      planAssessmentSave({
        exempt: false,
        nhi: true,
        score: "",
        notes: "Missing",
        hasAssessment: false,
      }),
    ).toEqual({ kind: "upsert", status: "nhi", score: null });
  });

  it("saves a counted mark and creates an unmarked note when there is no row", () => {
    expect(
      planAssessmentSave({
        exempt: false,
        nhi: false,
        score: " 8 ",
        notes: "Late",
        hasAssessment: false,
      }),
    ).toEqual({ kind: "upsert", status: "counted", score: 8 });
    expect(
      planAssessmentSave({
        exempt: false,
        nhi: false,
        score: "",
        notes: " Late ",
        hasAssessment: false,
      }),
    ).toEqual({ kind: "upsert", status: "unmarked", score: null });
  });

  it("clears an existing row when the counted score is empty", () => {
    expect(
      planAssessmentSave({
        exempt: false,
        nhi: false,
        score: "",
        notes: "Late",
        hasAssessment: true,
      }),
    ).toEqual({ kind: "clear" });
    expect(
      planAssessmentSave({
        exempt: false,
        nhi: false,
        score: "   ",
        notes: "",
        hasAssessment: true,
      }),
    ).toEqual({ kind: "clear" });
  });

  it("rejects a counted save that has no score, no note, and no row", () => {
    expect(() =>
      planAssessmentSave({
        exempt: false,
        nhi: false,
        score: "",
        notes: "   ",
        hasAssessment: false,
      }),
    ).toThrow("Enter a mark.");
  });
});

describe("assessmentScoreIsRequired", () => {
  it("requires a score only for a new counted save with no note", () => {
    expect(
      assessmentScoreIsRequired({
        exempt: false,
        nhi: false,
        score: "",
        notes: "",
        hasAssessment: false,
      }),
    ).toBe(true);
    expect(
      assessmentScoreIsRequired({
        exempt: false,
        nhi: false,
        score: "",
        notes: "Late",
        hasAssessment: false,
      }),
    ).toBe(false);
    expect(
      assessmentScoreIsRequired({
        exempt: false,
        nhi: false,
        score: "",
        notes: "",
        hasAssessment: true,
      }),
    ).toBe(false);
    expect(
      assessmentScoreIsRequired({
        exempt: true,
        nhi: false,
        score: "",
        notes: "",
        hasAssessment: false,
      }),
    ).toBe(false);
  });
});
