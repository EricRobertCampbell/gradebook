import { describe, expect, it } from "vitest";
import {
  boxplotTooltipLines,
  escapeHtml,
  markTooltipLine,
  readNumber,
  readProperty,
  readString,
} from "./work-distribution-tooltip";

describe("markTooltipLine", () => {
  it("tags the highlighted student", () => {
    const mark = { studentId: 2, name: "Blair", percent: 0.8 };

    expect(markTooltipLine(mark, 2)).toBe("Blair (80.0%) · highlighted");
    expect(markTooltipLine(mark, 1)).toBe("Blair (80.0%)");
  });
});

describe("boxplotTooltipLines", () => {
  it("names the median and quartiles without the mean", () => {
    const lines = boxplotTooltipLines({
      low: 0.1,
      q1: 0.4,
      median: 0.55,
      q3: 0.7,
      high: 0.9,
    });
    const text = lines.join(" ").toLowerCase();

    expect(lines).toEqual(["Median 55.0%", "Lower quartile 40.0%", "Upper quartile 70.0%"]);
    expect(text).not.toContain("mean");
    expect(text).not.toContain("average");
  });
});

describe("escapeHtml", () => {
  it("escapes characters that would change tooltip markup", () => {
    expect(escapeHtml(`A & B <C> "D"`)).toBe("A &amp; B &lt;C&gt; &quot;D&quot;");
  });
});

describe("tooltip record readers", () => {
  it("reads string and number properties and ignores other shapes", () => {
    const record = { seriesName: "Students", dataIndex: 2, ignored: true };

    expect(readString(record, "seriesName")).toBe("Students");
    expect(readString(record, "dataIndex")).toBeNull();
    expect(readNumber(record, "dataIndex")).toBe(2);
    expect(readNumber(record, "seriesName")).toBeNull();
    expect(readProperty(null, "seriesName")).toBeNull();
    expect(readString({ seriesName: "Students" }, "missing")).toBeNull();
  });
});
