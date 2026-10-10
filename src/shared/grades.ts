export type GradeAdjustmentInput = {
  rawChange: number | null;
  percentChange: number | null;
};

export function assessmentPercent(
  score: number,
  maximumScore: number,
  adjustments: Array<GradeAdjustmentInput>,
): number | null {
  if (!Number.isFinite(score) || !Number.isFinite(maximumScore) || maximumScore <= 0) {
    return null;
  }

  const adjustedScore =
    score + adjustments.reduce((sum, adjustment) => sum + (adjustment.rawChange ?? 0), 0);
  const percentAdjustment =
    adjustments.reduce((sum, adjustment) => sum + (adjustment.percentChange ?? 0), 0) / 100;

  return adjustedScore / maximumScore + percentAdjustment;
}

export function weightedAverage(
  items: Array<{ percent: number | null; weight: number }>,
): number | null {
  const countable = items.flatMap((item) => {
    if (item.percent === null || !Number.isFinite(item.weight) || item.weight <= 0) {
      return [];
    }

    return [{ percent: item.percent, weight: item.weight }];
  });
  const totalWeight = countable.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight === 0) {
    return null;
  }

  return countable.reduce((sum, item) => sum + item.percent * item.weight, 0) / totalWeight;
}

export function mean(values: Array<number | null>): number | null {
  const countable = values.flatMap((value) => {
    if (value === null || !Number.isFinite(value)) {
      return [];
    }

    return [value];
  });

  if (countable.length === 0) {
    return null;
  }

  return countable.reduce((sum, value) => sum + value, 0) / countable.length;
}

export function formatGradePercent(percent: number | null): string {
  if (percent === null || !Number.isFinite(percent)) {
    return "—";
  }

  return `${(percent * 100).toFixed(1)}%`;
}

export function assessmentCountsTowardAverage(status: string): boolean {
  return status === "counted" || status === "nhi";
}

export function assessmentStatusCode(status: string): string | null {
  for (const mark of SPECIAL_MARKS) {
    if (mark.status === status) {
      return mark.code;
    }
  }

  return null;
}

export function parseSpecialMark(value: string): SpecialMarkStatus | null {
  const normalised = value.trim().toLocaleLowerCase("en-GB");

  for (const mark of SPECIAL_MARKS) {
    if (mark.code.toLocaleLowerCase("en-GB") === normalised) {
      return mark.status;
    }
  }

  return null;
}

export function markInputErrorMessage(): string {
  const codes = SPECIAL_MARKS.map((mark) => mark.code);
  const last = codes.at(-1);

  if (!last) {
    return "Enter a mark.";
  }

  if (codes.length === 1) {
    return `Enter a mark or ${last}.`;
  }

  const leading = codes.slice(0, -1).join(", ");
  return `Enter a mark, ${leading}, or ${last}.`;
}

export function goalMarkAxisPercent(goalMark: number | null | undefined): number | null {
  if (goalMark == null || !Number.isFinite(goalMark)) {
    return null;
  }

  return Math.min(100, Math.max(0, goalMark * 100));
}

export function formatWeightPercent(weight: number): string {
  if (!Number.isFinite(weight)) {
    return "—";
  }

  return `${weight}%`;
}

const SPECIAL_MARKS = [
  { code: "E", status: "exempt" },
  { code: "NHI", status: "nhi" },
] as const;

type SpecialMarkStatus = (typeof SPECIAL_MARKS)[number]["status"];

export type MarkPresentation = {
  tone: "counted" | "exempt" | "nhi";
  code: "E" | "NHI" | null;
  greyScore: boolean;
};

export function markPresentation(status: string, score: number | null): MarkPresentation {
  if (status === "nhi") {
    return { tone: "nhi", code: "NHI", greyScore: false };
  }

  if (status === "exempt") {
    if (score === null) {
      return { tone: "exempt", code: "E", greyScore: false };
    }

    return { tone: "exempt", code: null, greyScore: true };
  }

  return { tone: "counted", code: null, greyScore: false };
}

export function markEntryValue(status: string, score: number | null): string {
  const presentation = markPresentation(status, score);

  if (presentation.code) {
    return presentation.code;
  }

  if (score === null) {
    return "";
  }

  return String(score);
}

export type GradeCellCommit =
  | { kind: "ignore" }
  | { kind: "delete" }
  | { kind: "invalid" }
  | { kind: "save"; status: "counted" | "exempt" | "nhi"; score: number | null };

export function gradeCellCommit(
  current: { status: string; score: number | null } | null,
  value: string,
): GradeCellCommit {
  const trimmed = value.trim();

  if (trimmed === "") {
    return current ? { kind: "delete" } : { kind: "ignore" };
  }

  const specialStatus = parseSpecialMark(trimmed);

  if (specialStatus === "exempt") {
    if (current?.status === "exempt" && current.score === null) {
      return { kind: "ignore" };
    }

    return { kind: "save", status: "exempt", score: null };
  }

  if (specialStatus === "nhi") {
    if (current?.status === "nhi" && current.score === null) {
      return { kind: "ignore" };
    }

    return { kind: "save", status: "nhi", score: null };
  }

  const score = Number(trimmed);

  if (!Number.isFinite(score)) {
    return { kind: "invalid" };
  }

  if (current?.status === "exempt" && current.score !== null) {
    if (current.score === score) {
      return { kind: "ignore" };
    }

    return { kind: "save", status: "exempt", score };
  }

  if (current?.status === "counted" && current.score === score) {
    return { kind: "ignore" };
  }

  return { kind: "save", status: "counted", score };
}

export function editorMarkSave(
  status: "counted" | "exempt" | "nhi",
  score: number | null,
): { status: "counted" | "exempt" | "nhi"; score: number | null } | null {
  if (status === "nhi") {
    return { status: "nhi", score: null };
  }

  if (status === "exempt") {
    return { status: "exempt", score };
  }

  if (score === null) {
    return null;
  }

  return { status: "counted", score };
}

export function nhiClearsExistingMark(savedScore: number | null, field: string): boolean {
  if (savedScore !== null && Number.isFinite(savedScore)) {
    return true;
  }

  const trimmed = field.trim();

  if (trimmed === "") {
    return false;
  }

  return Number.isFinite(Number(trimmed));
}
