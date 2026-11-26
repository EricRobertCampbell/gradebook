# Requirements

## Objective

Give the teacher a point-cloud chart of one student’s marks in a class, with each point’s size showing that mark’s normalized weight toward the student’s course average.

Source: [GitHub issue 48](https://github.com/EricRobertCampbell/gradebook/issues/48).

## Background

The primary user is the teacher using the local desktop gradebook.

Today, charts show **class distributions** of countable marks: a histogram and a raincloud on class data (`#/<class-id>/data`), work data (`#/<class-id>/data/<work-id>`), and student class data (`#/<student-id>/<class-id>/data`). On student class data those charts still compare the selected student to the class; they do not plot that student’s own marks as a set of points sized by course weight.

Course averages are nested weighted averages: category weights feed the course; within a category, sub-category weights and category-level work assessment weights feed the category; within a sub-category, work assessment weights feed the sub-category. Only countable assessments (`counted` or `nhi`) enter those averages. Exempt and unmarked assessments are left out. Excusing a category or sub-category for a student drops the covered work out of that student’s averages. Not handed in counts as zero.

The individual report (`#/<student-id>/<class-id>/individualreport`) lists that student’s results and links to student class data. It does not draw distribution charts.

Issue 48 asks for a **new graph type** for an individual student: a point cloud of all of their marks, with point size equal to the normalized contribution of that score to the final course mark. The issue title names that size encoding as weight to the course.

## Functional Requirements

1. **Requested** — For one student in one class, the teacher can see a point-cloud chart of that student’s marks.
2. **Requested** — Each point is one of that student’s marks included in the chart.
3. **Requested** — The size of each point encodes that mark’s normalized contribution (weight) toward that student’s course average as a whole.
4. **Implied** — The chart is about that one student’s marks. It is not a class distribution of one piece of work.
5. **Implied** — Larger points mean a greater share of the course weight than smaller points on the same chart.
6. **Implied** — The teacher can tell which mark a point belongs to (work name and enough context to locate it in the grading structure).
7. **Implied** — The teacher can read the mark’s percent and its normalized course-weight share without leaving the chart (for example from a tooltip or equivalent inspection).
8. **Implied** — Marks that do not count toward the course average are not plotted.
9. **Implied** — When the student has no marks that count toward the course average, the chart is not drawn and an empty message is shown instead.
10. **Implied** — Changing that student’s countable marks, assessment weights, category or sub-category weights, or excuses updates the point cloud so sizes and membership stay consistent with the course average.
11. **Implied** — The existing histogram and raincloud behaviour is unchanged.

## Non-functional Requirements

- The chart uses scores and weights already on the teacher’s machine. It does not send data elsewhere.
- The chart remains readable on the student-facing gradebook pages where individual-student views already live.
- Point sizes stay distinguishable for typical class structures (several works with unequal weights) without depending on a legend that names every work.

## Business Rules

- Course, category, and sub-category percents stay the nested weighted averages already used by the gradebook. This chart does not change how averages are calculated.
- A mark counts toward averages only when the assessment status is `counted` or `nhi`, the work is not excused for that student through a category or sub-category excuse, and the assessment otherwise participates in averages as today.
- Not handed in remains a countable zero.
- Exempt and unmarked assessments stay out of averages and out of this chart.
- Normalized course weight for a plotted mark is that mark’s share of the course average’s weight among the marks plotted for that student, so the shares on the chart sum to the whole course weight represented by those marks.
- Assessment weight, sub-category weight, and category weight all participate in that share, matching the nested path used for the course average.

## Acceptance Criteria

- On the agreed individual-student surface, a student with at least one countable mark in the class sees a point-cloud chart with one point per countable mark.
- On that chart, a mark with a larger normalized course-weight share is drawn larger than a mark with a smaller share.
- Inspecting a point identifies the work (and category or sub-category context when needed), the mark percent, and the normalized course-weight share.
- A student with no countable marks in the class sees the empty message and no point cloud.
- Exempt marks, unmarked assessments, and work covered by an excuse for that student do not appear as points.
- A not-handed-in mark appears as a point at 0% when it counts toward the average, with size from its normalized course-weight share.
- Changing an assessment weight or a parent category or sub-category weight changes relative point sizes to match the new course-weight shares.
- Histogram and raincloud charts on class data, work data, and student class data still behave as they do today.

## Edge Cases

- A single countable mark: one point that carries the whole plotted course-weight share.
- Two marks with equal normalized course weight: equal point sizes.
- A mark with a very small share beside a dominant assessment: both remain visible; the small point is still inspectable.
- Nested structure with category-level works and sub-category works together: each countable assessment still gets one point and a share that matches its path into the course average.
- Missing siblings (some works unmarked or exempt): shares reflect only the marks that currently count, consistent with how the course average renormalises today.
- Percent outside 0–100% after adjustments: the mark is still plotted if it counts; how it sits on the percent axis follows the axis rules chosen in planning.
- Assessment or work with no usable date: the chart still includes the mark if the chosen axes do not require a date, or places it in a defined undated position if a time axis is chosen.
- Zero or non-positive weights on a path that already excludes the mark from averages: that mark is not plotted.

## Out of Scope

- Replacing or removing the histogram or raincloud.
- Class-wide or multi-student point clouds.
- Changing how course, category, or sub-category averages are calculated.
- Changing assessment statuses, excuses, or weight editing workflows.
- Exporting or printing the point cloud.
- New graph types beyond this point cloud.

## Suggested Improvements

1. **User experience** — Colour points by category (or sub-category) so the teacher can see structure at a glance while size shows course weight. Helps when many works sit near the same percent.
2. **User experience** — Draw the pass cutoff and, when stored, that student’s course goal on the percent axis, matching the language already used on distribution charts. Makes high-weight weak marks obvious.
3. **User experience** — Show the student’s course average as a reference on the same chart so large points below the average stand out against large points above it.
4. **Technical** — Put normalized course-weight shares in a pure shared helper covered by Vitest beside the existing grade maths. Nested weights and missing siblings are easy to get wrong in the renderer alone.
5. **User experience** — Prefer placing the chart on student class data, above or beside the course-average distribution pair, because that page is already the individual-student chart surface and links from the individual report. (Placement remains an open question until accepted.)

## Open Questions

1. **High** — Where should the chart appear: student class data only, the individual report, both, or another surface?
2. **High** — What are the two axes? The issue names point size but not position. Candidates include percent versus date, percent versus a stable work order with jitter, or another layout. Planning cannot choose this without a product decision.
3. **Medium** — Does “normalized contribution of that score” mean only the weight share (as the issue title’s “weight to the course” suggests), or the score multiplied by that share (how many course-average points that mark supplies)? This specification treats it as **weight share**; confirm or correct.
4. **Medium** — Should category-level aggregates (category or sub-category averages) ever appear as points, or only leaf assessments?
5. **Low** — Should the chart also offer a per-category mode (points sized by weight within one category), or is course-level weight only?

## Assumptions

- “Point cloud” means a scatter of one point per included mark, with size as the primary new encoding. Exact geometry and library choices are left to planning.
- “Normalized contribution” / “weight to the course” means each plotted mark’s share of course weight among that student’s currently countable marks, not a redesign of the average formula.
- Leaf assessments are the marks in “all of their marks,” not category or sub-category summary rows.
- Countable-mark rules match the distribution charts: `counted` and `nhi` only; exempt, unmarked, and excused coverage stay out.
- The chart is additive. It does not replace the histogram or raincloud.
- Stakeholder wording that suggests a surface (“for an individual student”) is a product outcome, not a mandate for a particular route. Suggested placement on student class data is non-binding until accepted.
