# Requirements

GitHub issue: [#45 — Display goal mark (when present) on the individual student report](https://github.com/EricRobertCampbell/gradebook/issues/45)

## Objective

On the individual student report for a class, show that student’s stored goal mark wherever one exists, so the teacher can read goals alongside the student’s marks and averages without leaving the report.

## Background

The teacher is the only user. They set goal marks on the class grade table for an enrolled student at one or more of four scopes: the whole course, a category, a sub-category, or a piece of work. A goal is optional. Clearing it removes the stored value. Goals are already loaded with the class gradebook and already appear on the distribution charts when a goal is stored for that student and scope.

The individual report (`#/<student-id>/<class-id>/individualreport`) is opened from the class grade table or the student page. It shows one enrolled student’s marks for one class: assessment name, weight, score, maximum, and percent for each work row, with category, sub-category, and course summary rows. The same table is what Print report prints. It does not show goal marks today, even when the gradebook row for that student already carries them.

## Functional Requirements

1. **Requested.** When a goal mark is stored for the student and the course on this report, the course summary shows that goal.
2. **Requested.** When a goal mark is stored for the student and a category on this report, that category’s summary shows that goal.
3. **Requested.** When a goal mark is stored for the student and a sub-category on this report, that sub-category’s summary shows that goal.
4. **Requested.** When a goal mark is stored for the student and a piece of work on this report, that work’s row shows that goal.
5. **Implied.** When no goal is stored for a given scope, that scope does not present a goal value on the report.
6. **Implied.** The goal shown for a scope is the same stored goal the grade table and distribution charts use for that student and scope. The report does not invent or recompute a goal.
7. **Implied.** Goals on the report are read-only. Setting or clearing a goal stays on the class grade table.
8. **Implied.** Printed output of the individual report includes the same goal values that appear on screen.
9. **Implied.** Exempt, not-handed-in, missing, and ordinary mark presentation stay as they are. Showing a goal does not change how the score or percent for that row is displayed.

## Non-functional Requirements

1. Goal values on the report must be readable as percents in the same way other percents on the report are read.
2. Adding goals must not make the on-screen or printed report hard to scan for marks and averages.
3. All data stays on the teacher’s machine. The report does not send goal marks elsewhere.

## Business Rules

1. A goal exists for a student and scope only when one is stored. Absence of a goal is not the same as a goal of zero.
2. Goals may exist independently at course, category, sub-category, and work scope. Showing one does not require or imply the others.
3. The report covers one student in one class. Goals for other students or other classes do not appear.

## Acceptance Criteria

1. With a course goal stored for the student, the course row on the individual report shows that goal; with none stored, the course row shows no goal value.
2. With a category, sub-category, or work goal stored for the student, the matching row on the individual report shows that goal; with none stored, that row shows no goal value.
3. A report that has goals at more than one scope shows each of those goals on its own row.
4. Print report includes every goal that is visible on screen for that report.
5. Changing a goal on the class grade table and reopening (or reloading) the individual report shows the updated goal, or no goal after it was cleared.
6. Score, maximum, percent, weight, exempt, and NHI presentation on the report are unchanged aside from the addition of goals where present.

## Edge Cases

- Only a work goal is stored: that work row shows a goal; category, sub-category, and course rows show none.
- Only a course goal is stored: the course row shows a goal; other rows show none.
- Every visible scope has a goal: each of those rows shows its own goal.
- The student has marks but no goals: the report looks as it does today with respect to goals (no goal values).
- The student has a goal on a scope whose percent is still empty (no countable mark yet): the goal still appears for that scope.
- A goal outside the usual 0–100% range remains the stored value shown for that scope; the report does not invent a different goal.

## Out of Scope

- Editing, adding, or clearing goals from the individual report.
- Showing classmates’ goals, class averages of goals, or goal progress charts on the report.
- Changing how goals are entered on the class grade table.
- Changing distribution-chart goal lines.
- New goal scopes beyond course, category, sub-category, and work.
- Parent-facing or exported report formats beyond the existing on-screen report and its print output.

## Suggested Improvements

1. **User experience.** Add a dedicated Goal column on the report table (empty when no goal), so goals line up under one heading and print cleanly beside Percent. This addresses scanning and print layout without mixing goal text into the assessment name or notes.
2. **User experience.** When a goal and a percent both exist for the same scope, make it easy to tell whether the student is at, above, or below the goal (for example by placement or a quiet comparison cue). This helps the report answer “are they on track?” without opening class data.
3. **Technical.** Keep using the goal fields already returned on the class gradebook student row for this report, rather than a separate fetch. That avoids a second source of truth for the same stored goals.

## Open Questions

1. **Medium.** Should the report always reserve a Goal column (blank when absent), or only surface a goal cell/label on rows that have a stored goal? The issue says “when present,” which allows either layout.
2. **Low.** Should a goal outside 0–100% be shown as stored, or clamped for display the way the chart axis clamps the goal line? Charts clamp for the axis only; the grade table stores and edits the entered percent. Prefer matching the grade table’s stored value unless you say otherwise.
3. **Low.** Is any visual comparison of goal versus actual percent in scope for this issue, or should that wait as the suggested improvement above?

## Assumptions

1. “The individual student report” means `StudentClassReportPage` at `#/<student-id>/<class-id>/individualreport`, including Print report.
2. “Goal mark (when present)” means any stored goal for this student at course, category, sub-category, or work scope on that class—not only the course goal.
3. The issue title’s singular “goal mark” is about showing each stored goal where it applies, not about supporting only one goal on the whole report.
4. No change to goal storage, IPC, or entry UI is required for the requested outcome if the report already receives those values with the gradebook (Assumption / non-binding suggestion aligned with Suggested Improvement 3).
