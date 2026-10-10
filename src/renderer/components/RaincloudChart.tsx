import {
  init,
  type CustomSeriesRenderItem,
  type CustomSeriesRenderItemAPI,
  type ECharts,
  type EChartsOption,
} from "echarts";
import { useEffect, useRef } from "react";
import {
  distributionAnnotations,
  isHighlightedStudent,
  markIsBelowCutoff,
} from "../../shared/distribution-annotations";
import {
  boxplotSummary,
  raincloudAxisPercent,
  raincloudJitter,
  type BoxplotSummary,
  type DensityPoint,
  type WorkDistribution,
  type WorkMark,
} from "../../shared/grade-distribution";
import { goalMarkAxisPercent } from "../../shared/grades";
import { chartColours, type ChartColours } from "../chart-colours";
import { cutoffItemStyle, referenceMarkLines } from "../distribution-mark-style";
import {
  boxplotTooltipLines,
  escapeHtml,
  markTooltipLine,
  readNumber,
  readString,
} from "../work-distribution-tooltip";
import "./RaincloudChart.css";

export function RaincloudChart({
  distribution,
  highlightedStudentId,
  goalMark,
}: {
  distribution: WorkDistribution;
  highlightedStudentId?: number;
  goalMark?: number | null;
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
      echartsOption(distribution, chartColours(), highlightedStudentId, goalMark),
      true,
    );
  }, [distribution, highlightedStudentId, goalMark]);

  return (
    <div
      ref={containerRef}
      className="raincloud-chart"
      role="img"
      aria-label={chartAriaLabel(highlightedStudentId, goalMark)}
    />
  );
}

function echartsOption(
  distribution: WorkDistribution,
  colours: ChartColours,
  highlightedStudentId?: number,
  goalMark?: number | null,
): EChartsOption {
  const marks = distribution.bins.flatMap((bin) => bin.marks);
  const box = boxplotSummary(marks.map((mark) => mark.percent));
  const annotations = distributionAnnotations(distribution.cutoff, highlightedStudentId, goalMark);
  const arranged = arrangedMarks(
    marks,
    raincloudJitter(marks),
    highlightedStudentId,
    distribution.cutoff,
  );
  const cloud = cloudSamples(distribution.density);

  return {
    textStyle: {
      color: colours.text,
      fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    },
    grid: {
      left: 8,
      right: 24,
      top: 28,
      bottom: 36,
      containLabel: true,
    },
    tooltip: {
      trigger: "item",
      backgroundColor: colours.tooltip,
      borderColor: colours.grid,
      textStyle: {
        color: colours.text,
        fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
      },
      formatter: (params) => tooltipHtml(params, arranged, box),
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
        formatter: (value: number) => `${value}%`,
      },
      splitLine: {
        lineStyle: {
          color: colours.grid,
        },
      },
    },
    yAxis: {
      type: "value",
      min: Y_MIN,
      max: Y_MAX,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    series: [
      ...(cloud.length > 0
        ? [
            {
              name: "Cloud",
              type: "custom" as const,
              silent: true,
              z: 1,
              data: [0],
              renderItem: renderCloud(cloud, colours.density),
            },
          ]
        : []),
      ...(box
        ? [
            {
              name: "Box plot",
              type: "custom" as const,
              z: 2,
              data: [0],
              renderItem: renderBox(box, colours.text),
              tooltip: { show: true },
            },
          ]
        : []),
      {
        name: "Students",
        type: "scatter",
        z: 3,
        data: arranged.map((point) => ({
          value: [point.axis, point.y],
          symbolSize: point.highlighted ? 14 : 8,
          itemStyle: cutoffItemStyle(point.belowCutoff, point.highlighted, colours),
        })),
        markLine: {
          symbol: "none",
          silent: true,
          label: {
            color: colours.text,
            fontSize: 11,
            position: "insideEndTop",
          },
          data: referenceMarkLines(annotations, colours),
        },
      },
    ],
  };
}

function tooltipHtml(
  params: unknown,
  arranged: Array<ArrangedMark>,
  box: BoxplotSummary | null,
): string {
  const items = Array.isArray(params) ? params : [params];
  const lines = items.flatMap((item) => tooltipLines(item, arranged, box));

  if (lines.length === 0) {
    return "";
  }

  return lines.map(escapeHtml).join("<br/>");
}

function tooltipLines(
  params: unknown,
  arranged: Array<ArrangedMark>,
  box: BoxplotSummary | null,
): Array<string> {
  const seriesName = readString(params, "seriesName");

  if (seriesName === "Box plot") {
    return box ? boxplotTooltipLines(box) : [];
  }

  if (seriesName !== "Students") {
    return [];
  }

  const dataIndex = readNumber(params, "dataIndex");
  const point = dataIndex === null ? undefined : arranged[dataIndex];

  if (!point) {
    return [];
  }

  return [
    markTooltipLine(
      { studentId: point.studentId, name: point.name, percent: point.percent },
      point.highlighted ? point.studentId : undefined,
    ),
  ];
}

function arrangedMarks(
  marks: Array<WorkMark>,
  offsets: Array<number>,
  highlightedStudentId: number | undefined,
  cutoff: number,
): Array<ArrangedMark> {
  return marks
    .map((mark, index) => {
      const highlighted = isHighlightedStudent(mark.studentId, highlightedStudentId);

      return {
        studentId: mark.studentId,
        name: mark.name,
        percent: mark.percent,
        axis: raincloudAxisPercent(mark.percent),
        y: RAIN_CENTRE + (offsets[index] ?? 0) * RAIN_SPREAD,
        belowCutoff: markIsBelowCutoff(mark.percent, cutoff),
        highlighted,
      };
    })
    .sort((left, right) => Number(left.highlighted) - Number(right.highlighted));
}

function cloudSamples(density: Array<DensityPoint>): Array<[number, number]> {
  if (density.length === 0) {
    return [];
  }

  const maxCount = Math.max(...density.map((point) => point.count));
  const upper = density.map((point): [number, number] => [
    point.axisPercent,
    CLOUD_BASE + (maxCount > 0 ? (point.count / maxCount) * CLOUD_HEIGHT : 0),
  ]);
  const baseline = [...upper].reverse().map(([axis]): [number, number] => [axis, CLOUD_BASE]);

  return [...upper, ...baseline];
}

function renderCloud(samples: Array<[number, number]>, colour: string): CustomSeriesRenderItem {
  return (_params, api) => {
    const points: Array<Array<number>> = [];

    for (const [axis, band] of samples) {
      const converted = pixel(api, axis, band);

      if (!converted) {
        return null;
      }

      points.push([converted[0], converted[1]]);
    }

    return {
      type: "polygon",
      shape: { points },
      style: { fill: colour, opacity: 0.35 },
    };
  };
}

function renderBox(box: BoxplotSummary, colour: string): CustomSeriesRenderItem {
  return (_params, api) => {
    const low = pixel(api, raincloudAxisPercent(box.low), 0);
    const high = pixel(api, raincloudAxisPercent(box.high), 0);
    const quartileStart = pixel(api, raincloudAxisPercent(box.q1), BOX_HALF);
    const quartileEnd = pixel(api, raincloudAxisPercent(box.q3), -BOX_HALF);
    const medianTop = pixel(api, raincloudAxisPercent(box.median), BOX_HALF);
    const medianBottom = pixel(api, raincloudAxisPercent(box.median), -BOX_HALF);
    const lowCapTop = pixel(api, raincloudAxisPercent(box.low), WHISKER_CAP);
    const lowCapBottom = pixel(api, raincloudAxisPercent(box.low), -WHISKER_CAP);
    const highCapTop = pixel(api, raincloudAxisPercent(box.high), WHISKER_CAP);
    const highCapBottom = pixel(api, raincloudAxisPercent(box.high), -WHISKER_CAP);

    if (
      !low ||
      !high ||
      !quartileStart ||
      !quartileEnd ||
      !medianTop ||
      !medianBottom ||
      !lowCapTop ||
      !lowCapBottom ||
      !highCapTop ||
      !highCapBottom
    ) {
      return null;
    }

    const stroke = { stroke: colour, lineWidth: 1.5 };

    return {
      type: "group",
      children: [
        {
          type: "line",
          shape: { x1: low[0], y1: low[1], x2: quartileStart[0], y2: low[1] },
          style: stroke,
        },
        {
          type: "line",
          shape: { x1: quartileEnd[0], y1: high[1], x2: high[0], y2: high[1] },
          style: stroke,
        },
        {
          type: "line",
          shape: { x1: lowCapTop[0], y1: lowCapTop[1], x2: lowCapBottom[0], y2: lowCapBottom[1] },
          style: stroke,
        },
        {
          type: "line",
          shape: {
            x1: highCapTop[0],
            y1: highCapTop[1],
            x2: highCapBottom[0],
            y2: highCapBottom[1],
          },
          style: stroke,
        },
        {
          type: "rect",
          shape: {
            x: Math.min(quartileStart[0], quartileEnd[0]),
            y: Math.min(quartileStart[1], quartileEnd[1]),
            width: Math.abs(quartileEnd[0] - quartileStart[0]),
            height: Math.abs(quartileEnd[1] - quartileStart[1]),
          },
          style: { ...stroke, fill: "transparent" },
        },
        {
          type: "line",
          shape: {
            x1: medianTop[0],
            y1: medianTop[1],
            x2: medianBottom[0],
            y2: medianBottom[1],
          },
          style: { stroke: colour, lineWidth: 2.5 },
        },
      ],
    };
  };
}

function pixel(
  api: CustomSeriesRenderItemAPI,
  axis: number,
  band: number,
): [number, number] | null {
  const converted = api.coord([axis, band]);

  if (converted.length < 2) {
    return null;
  }

  const x = converted[0];
  const y = converted[1];

  if (x === undefined || y === undefined) {
    return null;
  }

  return [x, y];
}

function chartAriaLabel(highlightedStudentId?: number, goalMark?: number | null): string {
  const goal = goalMarkAxisPercent(goalMark);
  const goalText = goal === null ? "" : `, with a goal line at ${goal}%`;

  if (highlightedStudentId === undefined) {
    return `Score distribution as a raincloud plot${goalText}`;
  }

  return `Score distribution as a raincloud plot, with this student's point highlighted${goalText}`;
}

interface ArrangedMark {
  studentId: number;
  name: string;
  percent: number;
  axis: number;
  y: number;
  belowCutoff: boolean;
  highlighted: boolean;
}

const BOX_HALF = 0.26;
const WHISKER_CAP = 0.12;
const CLOUD_BASE = 0.48;
const CLOUD_HEIGHT = 1.05;
const RAIN_CENTRE = -0.95;
const RAIN_SPREAD = 0.32;
const Y_MIN = -1.5;
const Y_MAX = 1.7;
