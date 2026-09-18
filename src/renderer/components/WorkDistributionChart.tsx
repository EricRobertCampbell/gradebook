import { init, type ECharts, type EChartsOption } from "echarts";
import { useEffect, useRef } from "react";
import type { DistributionBin, WorkDistribution } from "../../shared/grade-distribution";
import { chartColours, type ChartColours } from "../chart-colours";
import {
  axisPercentLabel,
  binTooltipLines,
  densityTooltipLine,
} from "../work-distribution-tooltip";
import "./WorkDistributionChart.css";

export function WorkDistributionChart({
  distribution,
  highlightedStudentId,
}: {
  distribution: WorkDistribution;
  highlightedStudentId?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const chart = init(container);
    chartRef.current = chart;
    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(
      echartsOption(distribution, chartColours(), highlightedStudentId),
      true,
    );
  }, [distribution, highlightedStudentId]);

  return (
    <div
      ref={containerRef}
      className="work-distribution-chart"
      role="img"
      aria-label={chartAriaLabel(highlightedStudentId)}
    />
  );
}

function echartsOption(
  distribution: WorkDistribution,
  colours: ChartColours,
  highlightedStudentId?: number,
): EChartsOption {
  const cutoffPercent = distribution.cutoff * 100;

  return {
    color: [colours.density],
    textStyle: {
      color: colours.text,
      fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    },
    grid: {
      left: 8,
      right: 24,
      top: 28,
      bottom: 48,
      containLabel: true,
    },
    legend: {
      bottom: 0,
      data: ["Students", "Density"],
    },
    tooltip: {
      trigger: "item",
      backgroundColor: colours.tooltip,
      borderColor: colours.grid,
      textStyle: {
        color: colours.text,
        fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
      },
      formatter: (params) => tooltipHtml(params, distribution, highlightedStudentId),
    },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      interval: 10,
      name: "Percent",
      nameLocation: "middle",
      nameGap: 28,
      axisLabel: {
        formatter: axisPercentLabel,
      },
      splitLine: {
        lineStyle: {
          color: colours.grid,
        },
      },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      name: "Students",
      nameLocation: "middle",
      nameGap: 32,
      splitLine: {
        lineStyle: {
          color: colours.grid,
        },
      },
    },
    series: [
      {
        name: "Students",
        type: "bar",
        barWidth: 36,
        clip: false,
        data: distribution.bins.map((bin) => ({
          value: [bin.axisPercent, bin.count],
          itemStyle: barItemStyle(bin, colours, highlightedStudentId),
        })),
        markLine: {
          symbol: "none",
          silent: true,
          label: {
            color: colours.text,
            fontSize: 11,
            position: "insideEndTop",
          },
          data: verticalMarks(cutoffPercent, colours),
        },
      },
      {
        name: "Density",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2.5,
          color: colours.density,
        },
        data: distribution.density.map((point) => [point.axisPercent, point.count]),
      },
    ],
  };
}

function verticalMarks(
  cutoffPercent: number,
  colours: ChartColours,
): Array<{
  xAxis: number;
  name: string;
  label: { formatter: string };
  lineStyle: { color: string; type: "solid" | "dashed" | "dotted"; width: number };
}> {
  return [
    {
      xAxis: cutoffPercent,
      name: "Cutoff",
      label: { formatter: "Cutoff" },
      lineStyle: { color: colours.cutoff, type: "dashed" as const, width: 1.5 },
    },
  ];
}

function tooltipHtml(
  params: unknown,
  distribution: WorkDistribution,
  highlightedStudentId?: number,
): string {
  const items = Array.isArray(params) ? params : [params];
  const lines = items.flatMap((item) => tooltipLines(item, distribution, highlightedStudentId));

  if (lines.length === 0) {
    return "";
  }

  return lines.map(escapeHtml).join("<br/>");
}

function tooltipLines(
  params: unknown,
  distribution: WorkDistribution,
  highlightedStudentId?: number,
): Array<string> {
  const seriesName = readString(params, "seriesName");
  const axisPercent = tooltipAxisPercent(params);

  if (axisPercent === null) {
    return [];
  }

  if (seriesName === "Students") {
    const bin = distribution.bins.find((item) => item.axisPercent === axisPercent);
    return bin ? binTooltipLines(bin, highlightedStudentId) : [];
  }

  if (seriesName === "Density") {
    const point = distribution.density.find((item) => item.axisPercent === axisPercent);
    return point ? [densityTooltipLine(point)] : [];
  }

  return [];
}

function tooltipAxisPercent(params: unknown): number | null {
  const data = readProperty(params, "data");
  const fromData = firstPairNumber(data);

  if (fromData !== null) {
    return fromData;
  }

  if (typeof data === "object" && data !== null && "value" in data) {
    const fromNested = firstPairNumber(readProperty(data, "value"));

    if (fromNested !== null) {
      return fromNested;
    }
  }

  return firstPairNumber(readProperty(params, "value"));
}

function firstPairNumber(value: unknown): number | null {
  if (Array.isArray(value) && typeof value[0] === "number") {
    return value[0];
  }

  return null;
}

function readString(record: unknown, key: string): string | null {
  const value = readProperty(record, key);
  return typeof value === "string" ? value : null;
}

function readProperty(record: unknown, key: string): unknown {
  if (typeof record !== "object" || record === null || !(key in record)) {
    return null;
  }

  const properties: Record<string, unknown> = {};

  for (const [entryKey, entryValue] of Object.entries(record)) {
    properties[entryKey] = entryValue;
  }

  return properties[key];
}

function barItemStyle(
  bin: DistributionBin,
  colours: ChartColours,
  highlightedStudentId?: number,
): {
  color: string;
  borderColor: string;
  borderWidth: number;
} {
  const regular = bin.belowCutoff ? colours.belowCutoff : colours.atOrAboveCutoff;
  const highlighted = isHighlightedBin(bin, highlightedStudentId);

  return {
    color: highlighted
      ? bin.belowCutoff
        ? colours.belowCutoffHighlight
        : colours.atOrAboveCutoffHighlight
      : regular,
    borderColor: regular,
    borderWidth: highlighted ? 2 : 0,
  };
}

function isHighlightedBin(bin: DistributionBin, highlightedStudentId?: number): boolean {
  return (
    highlightedStudentId !== undefined &&
    bin.marks.some((mark) => mark.studentId === highlightedStudentId)
  );
}

function chartAriaLabel(highlightedStudentId?: number): string {
  if (highlightedStudentId === undefined) {
    return "Score distribution as a histogram with a density curve";
  }

  return "Score distribution as a histogram with a density curve, with this student's bin highlighted";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
