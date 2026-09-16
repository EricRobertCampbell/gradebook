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
  if (status === "exempt") {
    return "E";
  }

  if (status === "nhi") {
    return "NHI";
  }

  return null;
}

export function formatWeightPercent(weight: number): string {
  if (!Number.isFinite(weight)) {
    return "—";
  }

  return `${weight}%`;
}
