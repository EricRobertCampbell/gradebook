# Verification

## Automated

`npm run check` on 2026-10-10 passed: typecheck, lint, and 152 Vitest tests.

Covered there: boxplot quartiles and 1.5 IQR whiskers, the shared median, a single mark, zero spread, an empty sample, out-of-range ratios kept on the summary, `raincloudAxisPercent` (including 0.6 → 60 and both edges), jitter for ties and a shared edge, cutoff and goal annotations, highlight membership, cutoff colours, reference lines, the highlighted point tooltip, and a box tooltip that states the median and quartiles without the mean.

## One class-data screenshot

Biology class data, student `None`, Essay selected (marks at 70%, 70%, and 110%). Both charts were labelled. The summary sentence was visible. Both charts drew the cutoff and no goal. The raincloud showed two stacked points at 70% and one point on the 100% edge. The histogram still showed its bars and density curve.

## Not exercised

Left for a manual pass:

- Choosing a student, and the goal appearing on both charts.
- Changing work and keeping that student.
- Empty marks showing the message and neither chart.
- Work data: select a student, then `None`.
- Student class data: every stacked pair, with that student’s highlight and goal.
- Hovering the out-of-range point and reading the true percent in the tooltip.
- Opening a class that does not enrol the selected student, and seeing the field clear.

The wiring for those cases is in `GradeDistributionPanel`, `ClassDataPage`, and `RaincloudChart` (the tooltip uses the stored percent, not the pinned axis position). It has not been clicked through.
