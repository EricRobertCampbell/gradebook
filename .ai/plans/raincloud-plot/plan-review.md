# Plan Review

## Blocking Issues

None.

## Important Issues

### Box edges are ratios, and the drawing steps never scale them

`decisions.md` defines the box from mark ratios (`0.6` is 60%). The renderer section says to draw that box on the 0–100 axis, but only the rain points are given an explicit `percent * 100` conversion. An implementer who plots `low`, `q1`, `median`, `q3`, and `high` in ratio units will place the whole box in the first hundredth of the axis.

The plan should say the chart multiplies every box edge by 100 before drawing, and that a test asserts a mark of `0.6` and a box edge of `0.6` land on the same axis position, 60.

### `clip: false` does not keep a far-out percent on screen

The histogram stays inside the card by putting percents outside 0–1 into the end bins (`binIndex` in `src/shared/grade-distribution.ts`). The raincloud instead plots the raw percent. `clip: false` only lets a symbol paint outside the grid, still inside the chart canvas. `WorkDistributionChart.css` gives that canvas a fixed box. A mark at 150% or −20% is outside the canvas and is not visible.

The edge case in the requirements says a percent outside 0–100% is still plotted. The plan should say how that point stays inside the card without changing the 0–100 scale. Place the symbol on the 0 or 100 edge, keep the true percent in the tooltip, and do not clamp the stored mark.

### A class change can keep another class's student selected

`ClassDataPage` stays mounted when `:classId` changes. The plan copies work data and clears `studentId` only after a failed load. Work data can get away with that because a work change stays in one class. A class change does not. Student ids are global, so a selected id from the previous class can remain the select value when that student is not enrolled, and the control then shows no matching option.

On a successful class load, clear the selection when that id is not in the loaded gradebook. Keep it when the student is enrolled in the new class.

## Generalization Opportunities

### Recommended

The class-data student field is the work-data field again: `SelectField`, `None`, the empty-class option, `personDisplayName`, and `parseRouteId`. Those two pages are the whole set of callers. A small renderer component for that select is as easy to follow as a pasted copy, matches `SelectField`, and avoids two parsers drifting. The highlight and goal props stay with each page, because class data uses the selected work and work data already has its work.

### Not Recommended

Do not introduce a chart-type registry or a shared ECharts option builder for the histogram and the raincloud. The series are different. The shared annotation helpers are the reuse this change needs.

Do not switch the box to ECharts' `boxplot` series. That series wants a category axis, and the rain points need a continuous offset. The custom series on the value axis is the right fit.

## Questions

None. The three important issues have a single sensible fix each, recorded above.

## Suggested Changes

- Export `markTooltipLine` from `src/renderer/work-distribution-tooltip.ts`. The plan reuses it, and it is currently private to that file.
- Build the box median from `distribution.median`, not a second `quantile(percents, 0.5)`. The summary sentence already uses that median. Quartiles can still come from `quantile`.
- Leave the same top grid gap the histogram uses (`top: 28`) so the `Cutoff` and `Goal` labels are not covered by the cloud. Attach `referenceMarkLines` to a series that supports `markLine`, and keep the lines `silent`, as the histogram does.
- Show the class-data student field whenever the class has loaded, including when it has no work. The plan currently says the field "may" render in that case.
- Use `colours.text` for the box. That value is already `--ink` from `chartColours`. Do not read the token a second time.
- For the custom series, import ECharts' render-item types. Do not introduce an `as` assertion to satisfy `renderItem`.
- Add the no-mark student to the manual check: classmates have marks, the selected student does not, no point is highlighted, and a stored goal is still drawn. The requirements list that edge case. The checklist does not.

## Missing Tests

- A pure test that box edges and point positions share the percent axis, including a mark of `0.6` at 60 and a mark outside 0–1 kept as a value while its symbol sits on the corresponding edge. Without it, the scale mistake above can ship with every other box test green.
- A pure test that the box median equals `workDistribution(...).median` for an even count. Two median implementations can disagree, and the acceptance criterion says the summary sentence matches both charts.

No ECharts DOM harness is required. The repo has none, and the drawing bugs above are testable as numbers.

## Positive Findings

- The findings match the code that was checked: one panel owns every histogram, density is omitted when the sample has no spread, goals are clamped by `goalMarkAxisPercent`, bin colour is based on bin start, and work data is the student-field pattern to copy.
- Keeping the work in the renderer and in pure helpers matches `README.md`. There is no new IPC, schema, or migration.
- Refactoring the histogram onto `cutoffItemStyle` and `referenceMarkLines` before adding the raincloud is what makes the shared annotation requirement real.
- Stacking the charts, using a Tukey box with no mean marker, and jittering only perpendicular to percent are consistent with the requirements and with the 48rem column.
- Empty samples stay on the existing message-only branch. One shared panel covers class data, work data, and every student-class scope.

## Recommendation

Revise the plan. The approach is sound, and implementation should wait until the three important issues are written into `plan.md`, `decisions.md`, and `checklist.md`. Do not re-run `/plan-feature`. After that revision, the plan can be approved.

## Resolution

The three important issues are now written into the plan, the decisions, the checklist, and the findings. Box edges are multiplied by 100, out-of-range symbols sit on the 0 or 100 edge, and a class load clears a student who is not enrolled. The plan is ready for approval.
