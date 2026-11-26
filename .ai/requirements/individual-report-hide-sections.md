# Requirements

Source: [GitHub issue 49](https://github.com/EricRobertCampbell/gradebook/issues/49) — “Individual student report - hide certain sections”.

## Objective

A teacher can leave selected grading sections off the individual student report when viewing and printing it, so unfinished units (and similar sections) do not appear on the printed page.

## Background

The teacher uses a local desktop gradebook. Grading is organised as class → category (unit) → sub-category → work. The individual report (`#/<student-id>/<class-id>/individualreport`) shows one enrolled student’s results for one class. The teacher opens it from the class grade table, the student page, or the student class data page.

Today the report is a single table with columns Assessment, Weight, Score, Maximum, and Percent. It always lists every category for the class, then each category’s sub-categories and work, then a Course total row with that student’s course percent. Category notes can appear under the category name; work rows can show work notes and adjustment details. Assessment notes, goals, excused state, and charts are not on this report.

Screen-only controls are the Graph link to student class data, **Print report** (`window.print()`), and back links. Print styles hide those controls; they do not change which rows print. There is no way to omit a category, sub-category, or work from the report.

On the class grade table, categories and sub-categories with more than one child can be collapsed so child work columns are hidden for that session. That collapse does not change the individual report or any stored grading structure.

The issue asks for the ability to hide “certain sections”, and gives “units that we haven't started” as the example. In this product, units are categories.

## Functional Requirements

1. **Requested.** On the individual student report, the teacher can hide one or more sections so those sections do not appear on the report.
2. **Requested.** A category (unit) is a section the teacher can hide. Hiding a category removes that category’s header row and all of its nested sub-category and work rows from the report.
3. **Implied.** The teacher can show a previously hidden section again before printing or leaving the page.
4. **Implied.** Hiding or showing sections does not change stored marks, weights, notes, enrolment, or the class grading structure.
5. **Implied.** The on-screen report and the printed report show the same set of sections after the teacher’s hide and show choices. What the teacher sees is what Print report produces.
6. **Implied.** The Course total row remains on the report when at least one category section is still visible.
7. **Implied.** Section hide and show controls are for the teacher preparing the report. They do not appear on the printed page.
8. **Implied.** Choosing which sections are hidden is local to the individual report the teacher is looking at. It does not change the class grade table, student class data, or another student’s report until the teacher sets that report’s sections.

## Non-functional Requirements

- Hide and show choices stay on the teacher’s machine with the rest of the local gradebook workflow. They do not require a network service.
- Preparing a report for print remains usable offline.

## Business Rules

- Categories are the primary “sections” on the individual report. The issue’s “units” map to categories.
- Hiding a section only changes what the individual report shows and prints. Stored averages, the grade table, and student class data are unchanged.
- The Course percent shown on the report remains the student’s full course percent from the class gradebook, including categories that are hidden on the report, unless a later accepted requirement says otherwise.
- Collapsing columns on the class grade table is separate from hiding sections on the individual report.

## Acceptance Criteria

- Given an individual report for a class with at least two categories, when the teacher hides one category, that category’s name, weight, percent, notes, sub-categories, and work rows are absent from the on-screen report.
- When the teacher then chooses Print report, the printed page also omits that hidden category and its nested rows.
- When the teacher shows that category again, its rows return on screen and on a subsequent print.
- Hiding every category except one leaves that remaining category’s content and the Course row visible.
- After hiding a category on the report, the class grade table still shows that category’s columns, and stored marks for that category are unchanged.
- Section hide and show controls do not appear on the printed page.
- The Course percent on the report still matches the student’s full course percent from the gradebook when a category is hidden on the report.

## Edge Cases

- A class with only one category: the teacher can still hide it; the report then has no category blocks. Whether the Course row remains alone is covered by the open question on an empty report body.
- A hidden category that has no work yet, only a name and weight: it stays off the report until shown again.
- A category with sub-categories and work: hiding the category removes the whole block in one action.
- The teacher opens another student’s individual report for the same class: that report does not inherit the previous student’s hide choices unless persistence is later accepted as a requirement.
- The teacher refreshes or leaves and returns to the same report: hide choices are lost unless persistence is later accepted as a requirement.
- Print with all categories still visible matches today’s full report layout.

## Out of Scope

- Changing how course, category, or work percents are calculated in the gradebook.
- Hiding sections on the class grade table, class data, or student class data pages.
- Removing or archiving categories from the grading structure.
- Auto-detecting “units we haven't started” and hiding them without a teacher choice.
- Changing which note types appear on the individual report.
- Batch-printing every student in a class from one control.

## Suggested Improvements

1. **User experience.** Remember the last hide/show set for a class while the teacher prints several students in that class. Today each report would otherwise be set up again from scratch, which is slow for parent conferences or report packages.
2. **User experience.** Let the teacher hide a sub-category without hiding the rest of its parent category. The issue only names units, but some courses nest unfinished work under a sub-category while other parts of the unit are underway.
3. **User experience.** When any category is hidden, show a short on-screen cue that the Course percent is still the full-course figure. Otherwise a parent reading the printout can assume the total is only over the visible units.
4. **Technical.** Offer a single control to hide every category that has no countable marks for that student (or for the class). That speeds the “units we haven't started” case without inventing a new grading-structure state.
5. **User experience.** Persist hide choices per class across sessions (local only), so the usual mid-term print set does not need redoing after the app is closed.

## Open Questions

1. **High.** Should the teacher be able to hide sub-categories or individual work rows, or only whole categories (units)? The issue’s example is units; sub-category and work hiding are not stated.
2. **High.** When categories are hidden, should the printed Course percent stay the full-course value (as assumed above), or be recalculated from only the visible sections? Recalculation would change the meaning of the total on the printout.
3. **Medium.** Should hide choices persist for the class (or for the teacher session) across students and revisits, or reset each time the report is opened?
4. **Medium.** If the teacher hides every category, should the report still show a Course-only table, an empty state message, or refuse to hide the last visible category?
5. **Low.** Should “Print report” warn when one or more sections are hidden, so the teacher does not print a partial report by mistake?

## Assumptions

- “Sections” in the issue means blocks on the individual report that correspond to the grading structure, with categories (units) as the required level.
- The feature is for the individual report only, including its print output, not for other gradebook pages.
- Hide/show is an explicit teacher action; the product does not infer unfinished units on its own unless a suggested improvement is accepted.
- The Course percent assumption (full-course value while sections are hidden) is provisional and depends on Open Question 2.
- Stakeholder wording that something “would be good” is treated as a requested outcome for section hiding on the printed individual report, not as a design for how controls are built.
