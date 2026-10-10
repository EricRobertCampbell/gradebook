# Plan

Status: Implementing

Approved and implementation started on 2026-10-10. Automated checks passed the same day. The remaining UI flows are listed in `verification.md` for manual review. The important issues in `plan-review.md` are incorporated below.

## Objective

Show a raincloud beside every existing score histogram, using the same countable marks, student highlight, goal, and pass cutoff. Add the class-data student field that makes that highlight possible there. Do not draw a separate average on the raincloud.

## Scope

- A raincloud under each histogram that `GradeDistributionPanel` already shows: class data, work data, and every course, category, sub-category, and work chart on student class data.
- The raincloud contains a density cloud, one Tukey boxplot, and one point per countable mark. No mean marker.
- Pair labels `Histogram` and `Raincloud` on every pair.
- One annotation description used by both charts: highlighted student, goal, cutoff, and below-cutoff colour.
- A student field on class data, matching work data, including `None`.
- A short README current-status update so class data and the charts are described accurately.

Requirements coverage:

| Requirement                                                   | Where this plan meets it                                                                                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Raincloud beside the histogram; histogram and summary stay | Panel renders both, summary once above them                                                                                                           |
| 2. Cloud, boxplot, one point                                  | Raincloud series described below                                                                                                                      |
| 3. No separate average                                        | Box type has no mean; no mean series or mark                                                                                                          |
| 4. Highlight the same student, or nobody                      | Shared highlight id; point at that student's percent                                                                                                  |
| 5. Same goal, or none                                         | Shared reference lines                                                                                                                                |
| 6. Same cutoff                                                | Shared reference lines at 60%                                                                                                                         |
| 7. One annotation description                                 | Shared pure annotations plus one renderer style helper; histogram refactored onto them                                                                |
| 8. Pair labels, including stacked student scopes              | `h3` labels inside the shared panel                                                                                                                   |
| 9. Class-data student field                                   | Copy the work-data select                                                                                                                             |
| 10. Point colours and highlight treatment                     | Same `cutoffItemStyle` as the bars                                                                                                                    |
| 11. 0–100 scale; outside marks still plotted                  | Value axis stays 0–100. In-range points use `percent * 100`. An out-of-range symbol sits on the 0 or 100 edge, and the tooltip keeps the true percent |
| 12. Same mean and median sentence                             | Existing `distributionSummary`, unchanged inputs                                                                                                      |
| 13. Point inspection names the student                        | Scatter tooltip reuses `markTooltipLine`                                                                                                              |
| 14. Accessible name and visible labels                        | `role="img"` aria-label plus visible `h3`s                                                                                                            |
| 15. Empty sample shows neither chart                          | Existing `sampleSize === 0` branch                                                                                                                    |
| 16. Work and student changes update both                      | Both charts receive the same distribution and annotation props; class data keeps the student id across work changes                                   |

## Out of scope

- Removing the histogram or its density curve.
- A mean line, mean dot, or other average marker on the raincloud.
- The individual report.
- Changing countable-mark rules, the 60% cutoff, bin edges, or goal storage.
- Another chart type, export, or print.
- A control that hides either chart.
- Fixing the existing double `h2` on class data.

## Architectural approach

All of this stays in the renderer and in pure shared helpers. Pages already hold a `ClassGradebook`. No IPC, schema, or main-process work.

Extend the current split. `src/shared/grade-distribution.ts` already turns marks into bins, mean, median, and density. Add the boxplot numbers and the annotation values there (or in a sibling shared module if `grade-distribution.ts` would mix chart-annotation concerns too heavily; prefer a sibling `src/shared/distribution-annotations.ts` for the annotation object and the below-cutoff predicate, and keep the boxplot next to `workDistribution` because it is a summary of the same percents). The renderer keeps ECharts and CSS colours.

Refactor the histogram onto the shared helpers before drawing the raincloud, so the second chart cannot invent its own cutoff, goal, or highlight colours.

Layout, decided in `decisions.md`: stack the labelled histogram above the labelled raincloud. The raincloud uses the same 0–100 percent x-axis. Its y-axis is only layout (cloud band, box band, rain band), with no student-count scale and no axis title.

## Affected systems

- Renderer distribution panel and charts.
- Shared grade-distribution maths.
- Class data page.
- README current status.

No database, preload, or IPC system changes.

## Affected files and modules

- `src/shared/grade-distribution.ts` and `src/shared/grade-distribution.test.ts` — boxplot summary from the same percents, using `distribution.median`, plus `raincloudAxisPercent`.
- `src/shared/distribution-annotations.ts` and `src/shared/distribution-annotations.test.ts` — cutoff percent, clamped goal, highlighted student, `markIsBelowCutoff`.
- `src/renderer/distribution-mark-style.ts` and `src/renderer/distribution-mark-style.test.ts` — `cutoffItemStyle` and `referenceMarkLines`, taken from the histogram.
- `src/renderer/components/WorkDistributionChart.tsx` — call those helpers. Keep bins, density, tooltips, and aria-label.
- `src/renderer/components/RaincloudChart.tsx` and `RaincloudChart.css` — new chart.
- `src/renderer/components/WorkDistributionPanel.tsx` and `WorkDistributionPanel.css` — summary, then labelled histogram card, then labelled raincloud card.
- `src/renderer/work-distribution-tooltip.ts` — reuse `markTooltipLine` for a rain point. Add a box tooltip sentence (median and quartiles, not mean) if it stays a pure function here.
- `src/renderer/ClassDataPage.tsx` — student field and the same highlight and goal props as work data.
- `README.md` — current-status sentences for the distribution views.

Unchanged call sites that pick up the raincloud because they already use the panel: `WorkDataPage.tsx`, `StudentClassDataPage.tsx`, `StudentCategoryDataSection.tsx`.

## Data changes

None.

## IPC / contract changes

None.

## Renderer changes

`GradeDistributionPanel` keeps the empty branch. When there are marks:

1. The existing muted summary sentence.
2. An `h3` `Histogram`, then the existing chart card.
3. An `h3` `Raincloud`, then a second card of the same size (`20rem` chart height).

Both charts receive the same distribution, highlighted student id, and goal mark.

Raincloud series, top to bottom:

- **Cloud.** Filled shape from `distribution.density`, coloured with `colours.density`. Scale the density counts into a fixed band above the box so they do not share an axis with the points. If `density` is empty (fewer than two distinct percents, or the estimator failed), omit the cloud. Still draw the box and the points. That matches the histogram, which already drops the density line in that case.
- **Box.** One horizontal box on the percent axis: whisker low, lower quartile, median, upper quartile, whisker high. The summary stores those edges as mark ratios. Multiply each edge by 100 before drawing, the same conversion as a point. A ratio of `0.6` is 60 on the axis. Colour the box with `colours.text` (`--ink`), so it is distinct from the accent cloud and the success/error points. No mean marker. A custom series draws it. Do not use ECharts' category `boxplot` series. The box median is `distribution.median`, not a second quantile.
- **Rain.** One scatter point per mark at `raincloudAxisPercent`. A percent below 0 is drawn at 0, and a percent above 100 is drawn at 100, so the symbol stays inside the chart card. The tooltip still shows the true percent. Y is a deterministic offset inside the rain band, grouped by that drawn position and ordered by `studentId`. A lone position sits on the band centre. `cutoffItemStyle` colours the point. The highlighted point uses the highlight fill, a border, a larger symbol, and a higher `z` so it stays visible when several points share a percent.
- **Reference lines.** `referenceMarkLines` draws dashed `Cutoff` and, when present, solid `Goal`, with the same colours and labels as the histogram.

The y-axis is hidden: no labels, title, or grid lines. x-axis matches the histogram (0–100, percent labels). Do not rely on `clip: false` to show a mark outside that range. The axis does not grow to fit it.

Point tooltip: that student's `markTooltipLine` only. Box tooltip: median, lower quartile, and upper quartile, formatted with `formatGradePercent`. Do not say "mean" or "average" in the tooltip. The sentence above the charts remains the only place the mean is stated.

Aria-label, parallel to the histogram: a raincloud of scores, this student's point highlighted when a student is highlighted, and the goal percent when a goal is shown.

Class data: show the work-data student `SelectField` under the work field whenever the class has loaded, including when it has no work. Pass `highlightedStudentId` and `workGoalMark` for the selected work. Changing the work does not clear the student. `None` passes no highlight and no goal. A class with no students gets the disabled `No students in this class` option. A class with no work still shows no chart.

`ClassDataPage` stays mounted when `:classId` changes. After a successful load, keep the selected student only when that id is enrolled in the loaded gradebook. Clear the selection when it is not. Also clear it after a failed load. Do not clear it inside the work `onChange`.

## Main-process and database changes

None.

## Testing strategy

Pure tests only. There is no ECharts component harness.

- Boxplot: quartiles match `simple-statistics` `quantile`; the median equals `workDistribution(...).median` for an even count; whiskers follow the 1.5 IQR rule in `decisions.md`; a single mark and a zero-spread sample produce a degenerate box at that percent; an empty sample returns no box; the result has no mean field; percents outside 0–1 are kept on the summary.
- Axis scale: a mark of `0.6` and a box edge of `0.6` both become 60. A mark below 0 is stored unchanged and drawn at 0. A mark above 1 is stored unchanged and drawn at 100.
- Annotations: cutoff percent is `cutoff * 100`; goal uses `goalMarkAxisPercent`; a missing goal is null; `markIsBelowCutoff(0.6)` is false and `markIsBelowCutoff(0.599)` is true; highlight is true only for the selected id.
- Mark style: highlighted and plain points, below and above cutoff, match the histogram colours and border width. Reference lines always include cutoff and include goal only when the goal percent is non-null.
- Jitter: equal percents get distinct offsets in student-id order; unequal percents get the centre offset; repeated calls return the same offsets.
- Tooltip: a highlighted rain point includes `· highlighted`; the box sentence does not include the mean.
- Existing `grade-distribution` and `grades` tests stay green.

`npm run check` after the code changes.

Then verify in the running app (`npm run dev`; the WSL and browser fallback is enough where Electron cannot open):

- Class data: both labelled charts; `None` has no highlight and no goal; choosing a student highlights the bin and the point and shows that work's goal when one is stored; changing work keeps the student and updates both charts.
- Work data: the same highlight and goal behaviour as today, now on both charts; `None` clears both.
- Student class data: course, category, sub-category, and work pairs are labelled, highlighted, and show the scope goal when stored.
- Empty marks: the existing message, no chart.
- One mark, a tie, a mark below 60%, and a mark at 60%.
- A percent outside 0–100%: the symbol sits on the 0 or 100 edge, and the tooltip shows the true percent.
- Open another class that does not enrol the selected student: the student field clears. Changing work in the same class keeps the student.

## Migration and backwards compatibility

No stored data changes. Existing pages gain a chart and, on class data, a student field. The histogram's marks, bins, and summary stay.

## Security considerations

Student names and scores are already shown on the histogram tooltip. The rain tooltip shows one of those same marks. No new IPC, file access, or network path. The renderer still does not touch SQLite.

## Relevant architecture docs and ADRs

`README.md` Architecture, Databases, and Stack. No `readme/adr/` or `readme/architecture/` documents. Renderer-only change fits that architecture: the chart never becomes a database or IPC feature.

## Open questions

None. The requirements file's questions were resolved before planning.

## Assumptions

- Vertical stacking is the arrangement the requirements left open. Side by side is worse in the 48rem column, especially on student class data.
- A Tukey box (median and quartiles) is the average the teacher asked the boxplot to show. The mean stays in the summary sentence only.
- When the existing density series is empty, omitting the cloud is correct. The histogram already omits its density line for the same input.
- Visible labels are the words `Histogram` and `Raincloud`.
- "One shared description" is the pure annotation object plus `cutoffItemStyle` and `referenceMarkLines`. It is not a shared ECharts option object. The two charts have different series.
