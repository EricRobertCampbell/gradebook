import { describe, expect, it } from "vitest";
import { distributionAnnotations } from "../shared/distribution-annotations";
import type { ChartColours } from "./chart-colours";
import { cutoffItemStyle, referenceMarkLines } from "./distribution-mark-style";

const colours: ChartColours = {
  belowCutoff: "below",
  atOrAboveCutoff: "above",
  belowCutoffHighlight: "below-highlight",
  atOrAboveCutoffHighlight: "above-highlight",
  density: "density",
  cutoff: "cutoff",
  goal: "goal",
  text: "text",
  grid: "grid",
  tooltip: "tooltip",
};

describe("cutoffItemStyle", () => {
  it("uses the plain cutoff colours and adds a border only when highlighted", () => {
    expect(cutoffItemStyle(true, false, colours)).toEqual({
      color: "below",
      borderColor: "below",
      borderWidth: 0,
    });
    expect(cutoffItemStyle(false, false, colours)).toEqual({
      color: "above",
      borderColor: "above",
      borderWidth: 0,
    });
    expect(cutoffItemStyle(true, true, colours)).toEqual({
      color: "below-highlight",
      borderColor: "below",
      borderWidth: 2,
    });
    expect(cutoffItemStyle(false, true, colours)).toEqual({
      color: "above-highlight",
      borderColor: "above",
      borderWidth: 2,
    });
  });
});

describe("referenceMarkLines", () => {
  it("always draws the cutoff and adds the goal only when a goal percent is present", () => {
    const cutoffOnly = referenceMarkLines(distributionAnnotations(0.6, undefined, null), colours);
    const withGoal = referenceMarkLines(distributionAnnotations(0.6, 3, 0.8), colours);

    expect(cutoffOnly.map((line) => line.name)).toEqual(["Cutoff"]);
    expect(cutoffOnly[0]?.lineStyle).toEqual({ color: "cutoff", type: "dashed", width: 1.5 });
    expect(withGoal.map((line) => line.name)).toEqual(["Cutoff", "Goal"]);
    expect(withGoal[1]?.xAxis).toBe(80);
    expect(withGoal[1]?.lineStyle.type).toBe("solid");
  });
});
