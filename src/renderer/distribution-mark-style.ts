import type { DistributionAnnotations } from "../shared/distribution-annotations";
import type { ChartColours } from "./chart-colours";

export interface MarkItemStyle {
  color: string;
  borderColor: string;
  borderWidth: number;
}

export interface ReferenceMarkLine {
  xAxis: number;
  name: string;
  label: { formatter: string };
  lineStyle: {
    color: string;
    type: "solid" | "dashed" | "dotted";
    width: number;
  };
}

export function cutoffItemStyle(
  belowCutoff: boolean,
  highlighted: boolean,
  colours: ChartColours,
): MarkItemStyle {
  const regular = belowCutoff ? colours.belowCutoff : colours.atOrAboveCutoff;

  return {
    color: highlighted
      ? belowCutoff
        ? colours.belowCutoffHighlight
        : colours.atOrAboveCutoffHighlight
      : regular,
    borderColor: regular,
    borderWidth: highlighted ? 2 : 0,
  };
}

export function referenceMarkLines(
  annotations: DistributionAnnotations,
  colours: ChartColours,
): Array<ReferenceMarkLine> {
  const cutoff: ReferenceMarkLine = {
    xAxis: annotations.cutoffPercent,
    name: "Cutoff",
    label: { formatter: "Cutoff" },
    lineStyle: { color: colours.cutoff, type: "dashed", width: 1.5 },
  };

  if (annotations.goalPercent === null) {
    return [cutoff];
  }

  return [
    cutoff,
    {
      xAxis: annotations.goalPercent,
      name: "Goal",
      label: { formatter: "Goal" },
      lineStyle: { color: colours.goal, type: "solid", width: 2 },
    },
  ];
}
