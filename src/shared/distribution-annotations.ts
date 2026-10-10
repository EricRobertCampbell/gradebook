import { goalMarkAxisPercent } from "./grades";

export interface DistributionAnnotations {
  cutoffPercent: number;
  goalPercent: number | null;
  highlightedStudentId: number | undefined;
}

export function distributionAnnotations(
  cutoff: number,
  highlightedStudentId: number | undefined,
  goalMark: number | null | undefined,
): DistributionAnnotations {
  return {
    cutoffPercent: cutoff * 100,
    goalPercent: goalMarkAxisPercent(goalMark),
    highlightedStudentId,
  };
}

export function markIsBelowCutoff(percent: number, cutoff: number): boolean {
  return percent < cutoff;
}

export function isHighlightedStudent(
  studentId: number,
  highlightedStudentId: number | undefined,
): boolean {
  return highlightedStudentId !== undefined && studentId === highlightedStudentId;
}
