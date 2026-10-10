import type { Adjustment, GradeWork, StudentWorkGrade } from "../shared/ipc";

export function workReportDetails(work: GradeWork, workGrade: StudentWorkGrade): Array<string> {
  const details: Array<string> = [];

  if (work.notes) {
    details.push(work.notes);
  }

  for (const adjustment of workGrade.adjustments) {
    details.push(adjustmentDetail(adjustment));
  }

  return details;
}

function adjustmentDetail(adjustment: Adjustment): string {
  const parts: Array<string> = [adjustment.description];

  if (adjustment.rawChange !== null) {
    parts.push(`raw ${formatSigned(adjustment.rawChange)}`);
  }

  if (adjustment.percentChange !== null) {
    parts.push(`percent ${formatSigned(adjustment.percentChange)}`);
  }

  if (adjustment.notes) {
    parts.push(adjustment.notes);
  }

  return parts.join(" · ");
}

function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
