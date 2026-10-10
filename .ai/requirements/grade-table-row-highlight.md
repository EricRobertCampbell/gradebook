# Requirements

Source: [GitHub issue 37](https://github.com/EricRobertCampbell/gradebook/issues/37) — Highlight row and student when cell selected.

## Objective

When a teacher is entering a mark in the class grade table, highlight that student’s whole row, including the student’s name, so the active student stays obvious.

## Background

The teacher records marks on a class page, in the grade table. Each enrolled student is one row: the name (with links to the student, class data, and individual report), a mark cell and percent for each visible piece of work, category and subcategory summaries, the course total, and any goal-mark cells that are shown.

Mark entry is the text field in a work’s mark cell. Clicking it, or moving to it with Enter or the arrow keys, selects that field. Today only that field shows a focus outline. Nothing else in the row changes, including the name.

The name column stays pinned on the left while the table scrolls sideways, and the course total (and course goal, when shown) stays pinned on the right. Those pinned cells paint their own background. Exempt and not-handed-in cells, summary cells, and the course total also use their own background colours. A class-average row sits above the students and has no mark fields.

This behaviour is only on the class grade table. Student reports, the assessment editor, and other pages do not use this mark grid.

## Functional Requirements

1. **Requested.** When a work-mark field in a student row is selected, that entire row is highlighted.
2. **Requested.** The highlight includes the student’s name cell.
3. **Implied.** The highlight covers every cell in that row: work marks and percents, summaries, the course total, and any goal cells shown on the row.
4. **Implied.** Moving the selection to another student’s mark field, including with Enter or the arrow keys, moves the highlight to that student’s row.
5. **Implied.** At most one student row is highlighted. The class-average row is never highlighted.
6. **Implied.** When the work-mark field loses selection, the row highlight is removed.
7. **Implied.** The name stays highlighted while the table is scrolled sideways and the name column remains pinned. Pinned course total and course goal cells on that row stay highlighted too.
8. **Implied.** The selected mark field stays identifiable within the highlighted row.
9. **Implied.** Exempt, not-handed-in, summary, and course-total colouring stays recognisable on a highlighted row, and the text stays readable.

## Non-functional Requirements

- The highlight is visible in the existing grade table without hiding marks, names, or status colours.
- Pointer selection and keyboard selection behave the same way.
- The highlight does not change which mark is saved, or how navigation between mark fields works.

## Business Rules

- A selected cell means the work-mark field for one student and one piece of work has focus.
- The class average is not a student and cannot be selected for mark entry.
- Special marks (exempt and not handed in) keep their status meaning while the row is highlighted.

## Acceptance Criteria

- Focusing a student’s work-mark field highlights that student’s whole row, including the name.
- Focusing a different student’s work-mark field, by click, Enter, or arrow key, highlights only the new row.
- After the mark field blurs, no student row remains highlighted.
- With the table scrolled sideways, the pinned name of the selected student is still highlighted.
- An exempt or not-handed-in cell on the highlighted row can still be told apart from an ordinary mark cell.
- The class-average row does not pick up the highlight.

## Edge Cases

- A class with one student still highlights that row while a mark field is selected.
- Collapsed categories shorten the row; the visible cells, including the name and course total, are still highlighted.
- A mark field stays highlighted while its value is invalid, empty, or mid-save.
- Arrow or Enter movement that leaves the mark grid removes the highlight.
- Sideways scroll keeps the pinned name, course total, and course goal on the selected row in the highlighted state.
- Status, summary, and total backgrounds remain distinguishable under the highlight.

## Out of Scope

- Highlighting rows on the student report, work data page, or in the assessment editor.
- Changing mark values, navigation keys, or what counts as a saved mark.
- Pinning the table header while scrolling vertically.
- Highlighting the class-average row.

## Suggested Improvements

- **User experience.** Also highlight the selected piece of work’s column, or its header. Enter moves down one assessment at a time, and the work name lives in a header that is not pinned, so a long class makes it easy to lose track of which assessment is being marked. The outcome is that the assessment stays identifiable while the row highlight shows the student.
- **User experience.** Use the same row highlight when a goal-mark field on that row is selected. Goal entry sits in the same table and uses a similar field, but it is separate from work marks. The outcome is that goal entry is as easy to follow across the row as mark entry.
- **Technical.** Keep exempt and not-handed-in colours distinct while a row is highlighted. Those statuses are currently communicated by cell colour. A flat row wash could hide them. The outcome is that the teacher can see both which student is selected and why a cell is marked exempt or not handed in.

## Open Questions

- Should selecting a goal-mark field highlight that student’s row, or only a work-mark field? This does not block planning the requested mark-entry behaviour. Accepting the goal-mark suggestion above would add it to the requirements.

## Assumptions

- “Cell selected” means the work-mark field has focus, whether the teacher clicked it or moved there with the keyboard. Hovering a row does not count.
- The assessment edit button beside a mark is not mark entry. Focusing it does not by itself highlight the row.
- No stakeholder implementation suggestion was attached to the issue. The colour and strength of the highlight are left open.
