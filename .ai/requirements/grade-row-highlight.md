# Requirements

GitHub issue: [#37 — Highlight row and student when cell selected](https://github.com/EricRobertCampbell/gradebook/issues/37)

## Objective

When a teacher is entering a mark in the class grade table, highlight that student’s whole row, including the student’s name, so the active student stays obvious.

## Background

The teacher enters marks on the class page (`#/<school-year-id>/<class-id>`), in the Grades table. Each enrolled student is one row. The row starts with the student’s display name (preferred or first name) and links to that student’s page, class data, and individual report. Across the row are raw mark fields, computed percents, optional goal fields, category and sub-category summaries, and the course total.

The student name stays pinned to the left while the table scrolls horizontally. The course total, and the course goal when shown, stay pinned to the right. Those pinned cells, summary cells, the class-average row, and exempt or NHI mark cells each paint their own background. A background on the row element alone does not show through them.

Today, choosing a mark field outlines that field only. The rest of the row, including the pinned student name, looks the same as every other row. On a wide table the teacher can be editing a mark far from the name column and still needs the name itself to show which student is active. Arrow keys and Enter already move between mark fields.

This applies only to the class grade table. No other screen has these mark fields.

## Functional Requirements

1. **Requested.** While a raw mark field in a student row has focus, that entire student row is highlighted.
2. **Requested.** The highlight includes the student name cell, not only the mark and percent cells.
3. **Implied.** The highlight also covers every other cell in that row: percents, summaries, goal fields that are visible, and the course total.
4. **Implied.** The highlight is visible on the pinned student name when the table is scrolled horizontally, and on the pinned course total and course goal.
5. **Implied.** The highlight follows focus. Moving to another mark field with the pointer, Tab, Enter, or the arrow keys highlights the row that contains the newly focused mark field. Moving left or right along the same student keeps that row highlighted.
6. **Implied.** When no raw mark field has focus, no student row is highlighted.
7. **Implied.** At most one student row is highlighted.
8. **Implied.** The focused mark field stays identifiable within the highlighted row. The row highlight does not replace the current field outline.
9. **Implied.** Exempt and NHI marks remain visually distinguishable on a highlighted row. Summary cells and the course total remain recognisable as summaries.
10. **Implied.** The highlight is visual only. It does not block the student name, class-data link, report link, mark field, assessment edit button, or goal field.
11. **Implied.** The class-average row is never highlighted by this behaviour.

## Non-functional Requirements

1. The highlight uses the existing light-theme palette. Text on a highlighted row stays readable.
2. The highlight appears and moves with focus, including keyboard movement between mark fields, without a separate confirmation step.
3. Mark values, averages, and navigation behaviour stay as they are.

## Business Rules

1. A row is highlighted only for the student whose raw mark field currently has focus.
2. The class average is a summary row, not a student, and is not highlighted.
3. Existing mark status still has meaning on a highlighted row: exempt and NHI must not be flattened into the same appearance as an ordinary mark.

## Acceptance Criteria

1. Focusing a raw mark field highlights that student’s whole row, and the student name cell is visibly part of the highlight.
2. With the table scrolled so the mark field is away from the name column, the pinned student name still shows the highlight.
3. Focusing a mark field in a different row moves the highlight to that row and removes it from the previous row.
4. Moving left or right between mark fields for the same student leaves that row highlighted.
5. Clicking or tabbing away so that no raw mark field has focus removes the highlight.
6. The focused mark field can still be told apart from the other cells in its row.
7. An exempt or NHI mark on the highlighted row can still be told apart from an ordinary mark on that row.
8. The class-average row stays unhighlighted while a student mark field is focused.
9. Name, data, and report links in the highlighted name cell still activate.

## Edge Cases

1. A row with collapsed categories or sub-categories highlights only the cells that are currently shown.
2. A row with goal columns visible includes those goal cells in the highlight.
3. A row whose marks are exempt or NHI, or whose summary cells use the summary tint, still shows the row highlight on those cells.
4. The pinned course total and course goal show the highlight, including when a goal column is open and the total is inset from the right edge.
5. An empty class, or a class with categories but no mark fields yet, has nothing to highlight.
6. Leaving a mark field to open the assessment editor removes the row highlight, because the mark field no longer has focus. See Assumptions.
7. Focusing a goal field does not highlight the row. See Assumptions.

## Out of Scope

1. Highlighting a work column, column header, or the class-average row.
2. Changing how marks are saved, validated, cleared, or how Enter and the arrow keys move between fields.
3. Mark entry on any screen other than the class grade table.
4. Keeping the grade-table header pinned while scrolling vertically.

## Suggested Improvements

1. **User experience.** Also mark the active piece of work, or keep its column header in view, while a mark field is focused. The row highlight shows the student; on a long class the work name can scroll away, so the teacher can still lose the column they are editing.
2. **User experience.** Include the student in the mark field’s accessible name. The field is currently labelled with the work name only, so the selected student is shown by the highlight and not announced with the field.
3. **User experience.** Keep the row highlighted while focus remains anywhere in that student row, including the assessment edit button and goal fields. As specified, the highlight disappears as soon as the teacher tabs from the mark field to the pencil beside it.
4. **User experience.** If the row highlight makes the existing field outline hard to see, give the active mark cell a stronger cue than the rest of the row. The active cell must stay identifiable; this only matters if the outline is no longer enough once the row is tinted.

## Open Questions

None that block planning. Assumptions below are the defaults.

## Assumptions

1. “A cell is selected (i.e. entering marks)” means a raw mark field in the class grade table has focus. It does not mean a goal field, the assessment edit button, a column header, or the assessment modal.
2. The highlight tracks that focus and clears when the mark field blurs, including when the assessment modal opens.
3. No stakeholder suggested an implementation. Colour and mechanism are left for planning, provided the acceptance criteria are met.
