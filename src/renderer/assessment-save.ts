import type { AssessmentStatus } from "../shared/ipc";
import { parseOptionalNumber } from "./form-numbers";

export type AssessmentSavePlan =
  | {
      kind: "upsert";
      status: AssessmentStatus;
      score: number | null;
    }
  | { kind: "clear" };

interface AssessmentSaveInput {
  exempt: boolean;
  nhi: boolean;
  score: string;
  notes: string;
  hasAssessment: boolean;
}

export function assessmentScoreIsRequired(input: AssessmentSaveInput): boolean {
  return !input.exempt && !input.nhi && !input.hasAssessment && input.notes.trim() === "";
}

export function planAssessmentSave(input: AssessmentSaveInput): AssessmentSavePlan {
  if (input.nhi) {
    return { kind: "upsert", status: "nhi", score: null };
  }

  if (input.exempt) {
    return { kind: "upsert", status: "exempt", score: parseOptionalNumber(input.score) };
  }

  const score = parseOptionalNumber(input.score);

  if (score !== null) {
    return { kind: "upsert", status: "counted", score };
  }

  if (assessmentScoreIsRequired(input)) {
    throw new Error("Enter a mark.");
  }

  if (!input.hasAssessment) {
    return { kind: "upsert", status: "unmarked", score: null };
  }

  return { kind: "clear" };
}
