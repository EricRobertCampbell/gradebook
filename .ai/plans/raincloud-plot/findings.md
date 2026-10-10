# Findings

Research for the raincloud plot. Requirements: `.ai/requirements/raincloud-plot.md`. No ADRs or `readme/architecture/` docs exist. Architecture and stack notes are in `README.md`.

## What the teacher sees today

Every score chart is one ECharts histogram. `GradeDistributionPanel` in `src/renderer/components/WorkDistributionPanel.tsx` builds a `WorkDistribution` with `workDistribution` and, when `sampleSize > 0`, renders one `WorkDistributionChart`. The summary sentence above the chart comes from `distributionSummary` in `src/renderer/work-distribution-tooltip.ts`: student count, mean, and median. An empty sample renders `emptyMessage` and no chart.

Call sites, all of which must gain a raincloud because they all go through that panel:

| View | Route | Component | Highlight and goal |
| --- | --- | --- | --- |
| Class data | `/<class-id>/data` | `ClassDataPage` → `WorkDistributionPanel` | Neither. No student field. |
| Work data | `/<class-id>/data/<work-id>` | `WorkDataPage` → `WorkDistributionPanel` | Optional student. `workGoalMark` for that student and work. `""` option label is `None`. |
| Student class data | `/<student-id>/<class-id>/data` | `StudentClassDataPage` → `GradeDistributionPanel` for the course, then `StudentCategoryDataSection` | Always that student. Course, category, sub-category, and work goals via `src/shared/goal-marks.ts`. |

`StudentCategoryDataSection` renders a category panel, then either a work panel or a sub-category panel plus a work panel. Several histograms already stack on this page. Adding a second chart per panel multiplies that stack. The requirements accept that and ask for pair labels.

`StudentClassReportPage` links to student class data and does not render a distribution chart. Leave it alone.

The class page (`max-width: 48rem` on class data and work data) is a single column. Side-by-side charts would be about 20rem each before padding. A vertical pair fits the existing column.

## Histogram behaviour to preserve

`src/renderer/components/WorkDistributionChart.tsx`:

- ECharts `init` on a div, `ResizeObserver`, `setOption(..., true)` when data changes. `role="img"` plus an aria-label that mentions the histogram, the highlighted student, and the goal percent.
- X axis 0–100, interval 10, labelled percent. Y axis is student count.
- Bar series `Students`, `barWidth: 36`, `clip: false`. Bar centre is `bin.axisPercent` (the bin midpoint), not each student's percent.
- Density series `Density`, smooth line, no symbols, colour `colours.density` (`--accent`).
- `markLine` on the bar series: dashed `Cutoff` at `distribution.cutoff * 100` (always 60), solid `Goal` only when `goalMarkAxisPercent(goalMark)` is non-null. Goals outside 0–100% are clamped in `goalMarkAxisPercent`.
- `barItemStyle`: below-cutoff bins use `--error`, other bins use `--success`. A highlighted bin uses the lighter mixed colour and a 2px border in the regular colour. Highlight is `bin.marks` containing `highlightedStudentId`. There is no highlight when the id is omitted.
- Tooltip for a bar lists the bin label, the count, and each student as `Name (percent)` with ` · highlighted` on the selected student (`markTooltipLine`). Density tooltip is a separate sentence. There is no chart test; the tooltip copy is a pure helper.

Bin colour is not the same predicate as a single mark. `emptyBins` sets `belowCutoff` when the bin start is below 0.6. The 50–60% bin is below cutoff. The 60–70% bin is not, so a mark of exactly 0.6 is at or above cutoff. Point colours on the raincloud must use the mark (`percent < cutoff`), which matches those bins for the mark's own value.

`clip: false` matters because bar centres sit inside 0–100 even when a raw percent does not. `binIndex` puts percents below 0 in the first bin and percents at or above 1 in the last bin. The chart canvas is the fixed card in `WorkDistributionChart.css`, so a coordinate past that canvas is not visible. The raincloud keeps the 0–100 axis and draws an out-of-range symbol on the nearest edge. See `decisions.md`.

## Distribution data

`src/shared/grade-distribution.ts` is the pure model. `WorkMark` is `{ studentId, name, percent }` with `percent` as a ratio, not 0–100. `WorkDistribution` holds `sampleSize`, `mean`, `median`, `cutoff` (default `GRADE_PASS_CUTOFF` = 0.6), ten bins, and a density series.

Countable marks:

- Work: `countableMarksForWork` keeps finite percents whose assessment status counts toward the average (`counted` or `nhi`). Exempt and missing marks are dropped.
- Course, category, and sub-category: `countableCourseMarks`, `countableMarksForCategory`, `countableMarksForSubcategory` keep finite percents only. They do not re-check assessment status. Do not change these filters.

Density (`densityCounts`):

- `simple-statistics` `kernelDensityEstimation`.
- Returns `[]` when there are fewer than two percents or every percent is equal (`hasSpread`). The estimator is also swallowed if it throws.
- Forty-one samples from 0% to 100% of the ratio axis. `count` is `estimated * n * 0.1`, described in the tooltip as students per 10%.
- The histogram already omits the density line when this array is empty. A one-mark or zero-spread raincloud has no cloud shape to draw. The box and the points still have to appear.

`simple-statistics` 7.12 is already a dependency (`quantile`, `median`, `min`, `max`). Use it for the box. Do not add a statistics library.

Mean and median are already on `WorkDistribution` and in the summary sentence. The raincloud must not recompute them and must not draw a mean marker.

## Goals

`goalMarkAxisPercent` in `src/shared/grades.ts` clamps a finite goal onto 0–100 and returns null for null or non-finite input. The chart already depends on this. `workGoalMark`, `courseGoalMark`, `categoryGoalMark`, and `subcategoryGoalMark` read the stored goal for one student and scope. They return null when none is stored. A stored goal is independent of whether that student has a countable mark, and the histogram draws the goal line whenever the prop is non-null. Keep that split: no highlighted point, goal line still possible.

## Class data student field

`WorkDataPage` is the pattern to copy, not a new control:

- `useState<number | null>(null)`.
- `SelectField` labelled `Student`.
- Disabled, with `No students in this class`, when `gradebook.students.length === 0`.
- Otherwise a `None` option (`value=""`) plus one option per `gradebook.students` row, label `personDisplayName`.
- `parseRouteId` turns the value into an id. `""` becomes null.
- Props: `highlightedStudentId={studentId ?? undefined}` and `goalMark={studentId === null ? null : workGoalMark(gradebook, studentId, work.id)}`.

`listStudentsForClass` orders by last name, then first name. The gradebook rows keep that order. Work data does not sort again. Class data should use `gradebook.students` the same way.

Class data already keeps `workId` across renders. The new student id must survive a work change. Do not clear it inside the work `onChange`. `ClassDataPage` stays mounted when `:classId` changes, and student ids are global, so a successful load must drop a selected id that is not enrolled in the new gradebook. Work data only clears the id after a failed load; do not copy that part. The route change is a class change here, not a work change inside one class.

`ClassDataPage.css` already spaces `.field` by 1rem. `SelectField` renders that class. No new page layout is required for the control.

There is no renderer test for either page. Page behaviour is covered by wiring the existing props, not by a new page harness.

## Colour and chart conventions

`chartColours` in `src/renderer/chart-colours.ts` reads tokens from the document: error, success, their lighter mixes, accent density, error cutoff, warning goal, ink text, paper grid and tooltip. Both charts must keep using this. Do not add a second palette.

The histogram inlines `barItemStyle` and `verticalMarks`. Those two functions are the annotation description the requirements say must be shared. They are not shared yet. Colours cannot move into `src/shared/` because they read CSS at runtime. The numeric annotation (cutoff percent, clamped goal, highlighted id, below-cutoff predicate) can live in `src/shared/`. The colour application stays in the renderer and is called by both charts.

ECharts 6.1 is already imported by the histogram. No new chart dependency. The built-in `boxplot` series expects a category axis and one box per category. The raincloud also needs a value percent axis, a density shape, and free-floating points. Putting the box on a category axis fights the cloud and the points. A custom series (or graphic) for the box and the cloud, plus a scatter series for the points, keeps one value x-axis.

Renderer rules that apply: named exports, `Array<T>`, no `as` except `as const`, conditional render with `? : null`, colocated CSS, helpers below the component that uses them, British English in copy (`Raincloud`, not a new American spelling). The histogram already avoids `as` by narrowing ECharts tooltip params with `readProperty`. Follow that when the rain tooltip reads a scatter datum.

## Tests that exist

`src/shared/grade-distribution.test.ts` covers work listing, countable marks, bin membership, the 60% boundary, mean, median, and density bounds. There is no chart render test and no component test runner beyond Vitest node tests. `src/shared/grades.test.ts` covers `goalMarkAxisPercent`. New behaviour should be tested as pure functions beside those modules. Do not introduce a DOM chart harness.

## Constraints

- Renderer stays off Node, SQLite, and IPC. This feature reads `ClassGradebook` the pages already load.
- No schema, migration, or contract change.
- Do not change which marks count, the cutoff, goal storage, or the histogram's bins and density curve.
- Empty samples stay message-only. One sample still shows both charts.
- Overlapping percents need distinct rain positions without moving a point off its percent. Jitter belongs on the axis perpendicular to percent, and it must be deterministic (student id order). Random jitter would move the highlighted point between renders.
- Student class data may mount many ECharts instances. Doubling them is acceptable for a class-sized page. Do not add a show/hide control. The requirements reject hiding either chart.
- The panel's section heading is an `h2` (the work or category name). Class data also has an outer `h2` ("Work distribution"), so heading levels are already imperfect. Chart labels should be `h3` under the panel heading rather than more `h2`s. Do not restack the page headings in this change.
