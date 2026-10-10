# Checklist

Implement in this order. The histogram refactor comes before the raincloud so both charts call the same annotation helpers.

## Shared

- [x] Add `boxplotSummary` for the countable percents: lower whisker, lower quartile, median, upper quartile, upper whisker, using `simple-statistics` `quantile` and the 1.5 IQR whisker rule in `decisions.md`. Take the median from `workDistribution(...).median`. Return no box for an empty sample. Do not include a mean. Keep out-of-range ratios on the summary.
- [x] Add `raincloudAxisPercent`. Ratios from 0 to 1 map to 0–100. Ratios below 0 draw at 0, and ratios above 1 draw at 100.
- [x] Add a pure jitter helper: group by `raincloudAxisPercent`, order each group by `studentId`, and return a stable perpendicular offset. A unique drawn position gets the centre offset. Two out-of-range marks drawn on the same edge get distinct offsets.
- [x] Add `distributionAnnotations` and `markIsBelowCutoff`. Cutoff percent is the distribution cutoff times 100. Goal percent is `goalMarkAxisPercent`. A mark at the cutoff is not below it.
- [x] Cover the box, the whiskers, a single mark, zero spread, an empty sample, and out-of-range ratios kept on the summary. Assert an even-count box median equals `workDistribution(...).median`. Assert `raincloudAxisPercent(0.6)` is 60, a negative ratio draws at 0, and a ratio above 1 draws at 100. Cover jitter ties, the cutoff boundary, a missing goal, and highlight membership with Vitest.

## Renderer

- [x] Move the histogram's bar colour and cutoff/goal lines into `cutoffItemStyle` and `referenceMarkLines`. Point `WorkDistributionChart` at them without changing bins, the density line, tooltips, or the histogram aria-label.
- [x] Test the style helper: plain and highlighted colours below and above the cutoff, a cutoff line always, and a goal line only when a goal percent is present.
- [x] Add `RaincloudChart` with a 0–100 percent axis, a hidden layout y-axis, a density cloud in its own band (omitted when density is empty), one custom-series box, and one scatter point per mark. Multiply each box-edge ratio by 100. Place each point with `raincloudAxisPercent`. Colour the box with `colours.text` and the points with `cutoffItemStyle`. Draw cutoff and goal with `referenceMarkLines`. Do not draw a mean marker, and do not widen the axis for an out-of-range mark.
- [x] Point tooltip reuses `markTooltipLine`. Box tooltip states median and quartiles and does not state the mean. Give the chart an aria-label that distinguishes it from the histogram and mentions the highlighted student and goal when shown.
- [x] In `GradeDistributionPanel`, keep the summary sentence and the empty state. Under the sentence, label and render the histogram, then label and render the raincloud. Use visible `h3` text `Histogram` and `Raincloud`. Colocate the label and card styles.
- [x] On class data, show the work-data student field whenever the class has loaded, including when it has no work. Include `None` and the empty-class option. Pass the selected student and that student's goal for the selected work. Changing work must not clear the student. After a successful load, clear the selection when that id is not enrolled in the loaded gradebook.
- [x] Update the README current-status description of class data and the distribution charts.

## Verification

- [x] Run `npm run check`.
- [ ] In the running app, check class data, work data, and student class data against the acceptance criteria in the requirements: pair labels, shared highlight and goal, `None`, work changes keeping the student, empty marks, one mark, a tied percent, and marks below and at 60%. Class data with `None` was screenshotted; the rest is for manual review.
- [ ] Check a percent outside 0–100%: the symbol sits on the 0 or 100 edge, and the tooltip shows the true percent. Open another class that does not enrol the selected student and confirm the student field clears. The edge symbol was visible in the class-data screenshot. The tooltip text and the class change were not exercised.
