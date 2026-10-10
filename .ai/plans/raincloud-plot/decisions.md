# Decisions

Choices that are not fixed by the requirements. Reverse these only with a reason.

## Stack the charts

The histogram card stays first. The raincloud card follows. Each has a visible `h3`: `Histogram`, then `Raincloud`. The summary sentence stays once, above both.

Class data and work data are a 48rem column. Student class data already stacks several distributions. Side-by-side charts would shrink both. A toggle is out of scope.

## Percent on x, layout on y

The raincloud x-axis matches the histogram: 0 to 100, step 10, percent labels. Cutoff and goal stay vertical lines so the shared `referenceMarkLines` helper can draw both charts.

The y-axis is not a student count. It is three fixed bands:

1. Cloud, above the box.
2. Box, between the cloud and the rain.
3. Rain, below the box.

Hide the y-axis labels, title, and split lines. Scale density counts into the cloud band. Do not plot density and points on one data scale.

## Boxplot

Use a Tukey box of the mark ratios:

- Lower quartile `quantile(percents, 0.25)` and upper quartile `quantile(percents, 0.75)` from `simple-statistics`.
- Median is `distribution.median` from `workDistribution`, not a second `quantile(percents, 0.5)`.
- Interquartile range is the upper quartile minus the lower quartile.
- Whisker low is the smallest percent at or above `q1 - 1.5 * IQR`. Whisker high is the largest percent at or below `q3 + 1.5 * IQR`.
- If the interquartile range is 0, both whiskers sit on that percent.
- One mark, or every mark equal, still returns a box on that percent.
- An empty sample returns no box. The panel does not render charts in that case anyway.

Points outside the whiskers remain rain points. They are not removed and they are not a separate outlier series.

The box object is `low`, `q1`, `median`, `q3`, `high` only, in mark ratios. No mean. Multiply each edge by 100 when drawing. A ratio of `0.6` is drawn at 60, on the same position as a point for a mark of `0.6`. The chart draws no mean dot and no mean line. The box tooltip names the median and the quartiles. It does not call the median the mean.

Draw the box with a custom series on the value axis. ECharts' `boxplot` series wants a category axis and would split the percent axis away from the cloud and the points.

Colour the box with `colours.text`, which is already `--ink`. The cloud uses the density accent. Points use success and error. Those three colours are how a teacher tells the parts apart.

## Point position and colour

`raincloudAxisPercent(percent)` converts a mark ratio for the 0–100 axis. From 0 to 1 inclusive, that is `percent * 100`. Below 0, the symbol is drawn at 0. Above 1, the symbol is drawn at 100. The stored mark is not clamped, and the tooltip uses `formatGradePercent` on the stored ratio.

The axis stays 0–100. Do not widen it, and do not rely on `clip: false`. A symbol past the canvas is not visible; the histogram only shows these marks because `binIndex` folds them into the end bins.

A point is below cutoff when `percent < cutoff`. Exactly 0.6 uses the at-or-above colour. That agrees with the histogram bin that contains 0.6. Bin colour itself stays `bin.start < cutoff` and is not recomputed from the marks.

Jitter does not change the drawn x. Group by `raincloudAxisPercent`, so marks that share an edge or an exact percent spread apart. Sort each group by `studentId`. A group of one sits on the band centre. The same inputs always produce the same offsets. Do not use random jitter.

The highlighted point uses `cutoffItemStyle`, a larger symbol, and a higher `z`.

## Shared annotations

`distributionAnnotations` holds the cutoff percent, the clamped goal percent or null, and the highlighted student id or none.

`cutoffItemStyle(belowCutoff, highlighted, colours)` is the histogram's current `barItemStyle` colours and border.

`referenceMarkLines` is the histogram's current dashed cutoff line and optional solid goal line, including the labels `Cutoff` and `Goal`.

Both charts call these. Neither chart builds its own goal, cutoff, or highlight colours.

## Cloud when density is empty

`workDistribution` already returns no density points when there are fewer than two distinct percents, or when the kernel estimator fails. Omit the cloud then. Still show the box and the points, so a single countable mark still has both charts.
