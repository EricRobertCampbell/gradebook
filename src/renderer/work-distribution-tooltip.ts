import { formatGradePercent } from "../shared/grades";
import type {
  DensityPoint,
  DistributionBin,
  WorkDistribution,
  WorkMark,
} from "../shared/grade-distribution";

export function binTooltipLines(
  bin: DistributionBin,
  highlightedStudentId?: number,
): Array<string> {
  const heading = `${bin.label}: ${studentCountLabel(bin.count)}`;

  if (bin.marks.length === 0) {
    return [heading];
  }

  const names = bin.marks.map((mark) => markTooltipLine(mark, highlightedStudentId));
  return [heading, ...names];
}

export function densityTooltipLine(point: DensityPoint): string {
  return `Density ≈ ${point.count.toFixed(1)} students per 10%`;
}

export function distributionSummary(distribution: WorkDistribution): string {
  const mean = formatGradePercent(distribution.mean);
  const median = formatGradePercent(distribution.median);
  return `${studentCountLabel(distribution.sampleSize)} · mean ${mean} · median ${median}`;
}

export function studentCountLabel(count: number): string {
  if (count === 1) {
    return "1 student";
  }

  return `${count} students`;
}

export function axisPercentLabel(value: number): string {
  return `${value}%`;
}

function markTooltipLine(mark: WorkMark, highlightedStudentId?: number): string {
  const label = `${mark.name} (${formatGradePercent(mark.percent)})`;

  if (highlightedStudentId !== undefined && mark.studentId === highlightedStudentId) {
    return `${label} · highlighted`;
  }

  return label;
}
