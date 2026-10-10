import type { BoxplotSummary } from "../shared/grade-distribution";
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

export function boxplotTooltipLines(box: BoxplotSummary): Array<string> {
  return [
    `Median ${formatGradePercent(box.median)}`,
    `Lower quartile ${formatGradePercent(box.q1)}`,
    `Upper quartile ${formatGradePercent(box.q3)}`,
  ];
}

export function markTooltipLine(mark: WorkMark, highlightedStudentId?: number): string {
  const label = `${mark.name} (${formatGradePercent(mark.percent)})`;

  if (highlightedStudentId !== undefined && mark.studentId === highlightedStudentId) {
    return `${label} · highlighted`;
  }

  return label;
}

export function readString(record: unknown, key: string): string | null {
  const value = readProperty(record, key);
  return typeof value === "string" ? value : null;
}

export function readNumber(record: unknown, key: string): number | null {
  const value = readProperty(record, key);
  return typeof value === "number" ? value : null;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function readProperty(record: unknown, key: string): unknown {
  if (typeof record !== "object" || record === null || !(key in record)) {
    return null;
  }

  const properties: Record<string, unknown> = {};

  for (const [entryKey, entryValue] of Object.entries(record)) {
    properties[entryKey] = entryValue;
  }

  return properties[key];
}
