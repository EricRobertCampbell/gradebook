# Requirements

## Objective

Wherever the gradebook already shows a score histogram, also show a raincloud plot of the same scores, and highlight the selected student, goal, and pass cutoff in the same situations as the histogram.

Source: [GitHub issue 38](https://github.com/EricRobertCampbell/gradebook/issues/38), including the raincloud description in [Cédric Scherer’s article](https://www.cedricscherer.com/2021/06/06/visualizing-distributions-with-raincloud-plots-and-how-to-create-them-with-ggplot2/).

## Background

The teacher uses three distribution views. Each one draws the same histogram: ten percent bins, a density curve, and a sentence giving the student count, mean, and median.

- Class data (`/<class-id>/data`), opened from the class page, shows one work at a time. It has no student field, so no bin is highlighted and no goal line is drawn.
- Work data (`/<class-id>/data/<work-id>`), opened from a work column, has a student field. Choosing a student highlights that student’s bin and draws that student’s goal for the work when one is stored. “None” clears both.
- Student class data (`/<student-id>/<class-id>/data`), opened from the student page, the grade table, or the individual report, always concerns that student. It shows the course average, each category, the selected work or sub-category, and, for a sub-category, the selected work. Each histogram highlights that student and draws the goal for that scope when one is stored.

Histogram behaviour the raincloud has to stay consistent with:

- A bin is coloured as below the pass cutoff when its range starts below 60%, and as at or above the cutoff otherwise. A mark of exactly 60% sits in an at-or-above bin.
- The highlighted student’s bin uses a lighter fill and a border. The tooltip lists students in the bin and tags the highlighted student.
- A dashed line labelled “Cutoff” is always drawn at 60%. A solid line labelled “Goal” is drawn only when a goal exists. A goal outside 0–100% is clamped onto that scale for the line.
- Countable marks are finite percents whose assessment counts toward the average (`counted` or `nhi`). Exempt and missing marks are omitted. Percents outside 0–100% stay in the end bins.
- With no countable marks, the panel shows an empty message and no chart.

The individual report links to student class data and does not draw this histogram.

A raincloud plot, as described in the linked article, combines three views of one sample: a density shape (the cloud), a boxplot, and one point per observation (the rain).

## Functional Requirements

1. **Requested** — Every place that shows the histogram also shows a raincloud plot of the same countable marks. The histogram, its density curve, and its summary sentence remain.
2. **Requested** — The raincloud shows a density cloud, a boxplot, and one point per countable mark, matching the three-part raincloud in the linked article.
3. **Requested** — The raincloud does not draw a separate average marker. The boxplot is the only average shown on the diagram. The summary sentence above the charts still states the mean and median.
4. **Requested** — When the histogram highlights a student, the raincloud highlights that student’s point at that student’s percent. When the histogram highlights nobody, the raincloud highlights nobody.
5. **Requested** — When the histogram draws a goal line, the raincloud marks the same goal. When the histogram draws no goal, the raincloud marks none.
6. **Requested** — The raincloud shows the same pass cutoff as the histogram.
7. **Requested** — The histogram and the raincloud use one shared description of the highlighted student, the goal, the cutoff, and the below-cutoff colour. Those annotations cannot diverge between the two charts.
8. **Requested** — Each histogram and its raincloud are labelled so the raincloud is identifiable as the pair of that histogram. This includes every scope on student class data, where several pairs are stacked.
9. **Requested** — Class data has a student field matching work data. It lists the students in the class and includes “None”. Choosing a student highlights that student on both charts and shows that student’s goal for the selected work when one is stored. “None” clears the highlight and the goal.
10. **Implied** — Raincloud points use the histogram’s below-cutoff and at-or-above-cutoff colours. The highlighted point uses the histogram’s highlight treatment.
11. **Implied** — The raincloud shares the histogram’s 0–100 percent scale so the two views can be compared. Marks outside that range are still included.
12. **Implied** — The count, mean, and median sentence stays the summary for both views. The raincloud does not calculate a different mean or median.
13. **Implied** — Inspecting a rain point identifies that student and their percent, and says when that student is the highlighted one.
14. **Implied** — The raincloud has an accessible name that distinguishes it from the histogram and mentions the highlighted student and the goal when those are shown. The visible pair labels are available to assistive technology.
15. **Implied** — With no countable marks, neither chart is shown and the existing empty message remains.
16. **Implied** — Changing the selected work, sub-category, or student updates the raincloud together with the histogram. On class data, changing the work keeps the selected student and updates both charts for that work.

## Non-functional Requirements

- The plot uses scores already on the machine. It does not send data elsewhere.
- Both charts fit the existing distribution views on class data, work data, and student class data, and remain readable there.
- A teacher can tell the cloud, the boxplot, and the points apart without reading the linked article.

## Business Rules

- Which marks are countable does not change: a finite percent on an assessment that counts toward the average (`counted` or `nhi`). Exempt and missing marks stay out.
- The pass cutoff stays 60%. A mark at 60% is at or above the cutoff.
- A goal is the goal already stored for that student and that scope (course, category, sub-category, or work). No stored goal means no goal mark.
- Class data and work data highlight a point and show a goal only for the student chosen in the student field. “None” highlights nobody and shows no goal.
- Student class data always uses the student whose page is open.

## Acceptance Criteria

- On class data, a work with countable marks shows a labelled histogram and a labelled raincloud. “None” highlights no point and shows no goal. Choosing a student highlights that student’s histogram bin and raincloud point, and shows that student’s goal for the selected work on both charts when a goal is stored. Changing the work keeps that student and updates both charts.
- On work data, choosing a student highlights that student’s histogram bin and that student’s raincloud point, and shows that student’s work goal on both when a goal is stored. Choosing none removes the highlight and the goal from both.
- On student class data, the course distribution and each visible category, sub-category, and work distribution show a labelled pair of charts, highlight that student, and show the goal for that scope when one is stored.
- A distribution with no countable marks shows the current empty message and neither chart.
- The mean and median in the summary sentence match the marks drawn on both charts.
- The raincloud includes a boxplot and does not add a separate average line or marker.
- A mark below 60% and a mark at or above 60% are visually distinguished on the raincloud in the same way the histogram distinguishes them.
- For any distribution, the two charts agree on who is highlighted, whether a goal is shown, where the cutoff is, and which marks are below the cutoff.

## Edge Cases

- A single countable mark still shows both charts, and that point can be highlighted.
- Several students with the same percent each have a point, and the highlighted student can still be identified.
- The highlighted student has no countable mark while classmates do: no point is highlighted.
- A goal outside 0–100% is clamped the same way as the histogram’s goal line.
- A percent outside 0–100% is still plotted.
- A class with no work, or a sub-category with no work, still shows no distribution chart.
- A class with no students still offers no student to highlight. The student field shows that the class has no students, as work data does today.

## Out of Scope

- Removing or replacing the histogram or its density curve.
- A separate average marker on the raincloud diagram.
- The individual report, which does not show a distribution chart.
- Changing which marks count, the pass cutoff, or how goals are stored or calculated.
- Any further graph type.
- Exporting or printing charts.

## Suggested Improvements

None. The three proposals from the first draft were accepted and moved into Functional Requirements.

## Open Questions

None.

## Assumptions

- “Also display” means both charts are visible for the same distribution. It does not mean replacing the histogram, and it does not mean a control that hides one of them. How the pair is arranged is left to planning.
- The linked article defines the requested plot. It does not choose a library, orientation, or geometry.
- “The individual student’s point” is that student’s exact percent. That is the raincloud counterpart of highlighting the histogram bin that contains them.
- The visible pair label names the chart kind, such as histogram and raincloud. The exact wording is left to planning.

## Changes

- Confirmed that the raincloud draws no separate average. The boxplot is the only average on the diagram. Removed the open question about plotting the mean.
- Accepted the shared annotation description, the pair labels, and the class-data student field. Moved all three into Functional Requirements as **Requested**, and updated the business rules, acceptance criteria, and edge cases to match. Suggested Improvements is now empty.
