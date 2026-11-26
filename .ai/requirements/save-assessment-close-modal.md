# Requirements

Source: [GitHub issue 63](https://github.com/EricRobertCampbell/gradebook/issues/63) — “Save assessment -> close modal”.

## Objective

After a teacher successfully saves an assessment from the assessment editor, the editor closes and the teacher is back on the class grade table, which shows the result of that save.

## Background

The teacher marks work on the class grade table (`#/<school-year-id>/<class-id>`). Each cell is one student’s result on one piece of work. The pencil on that cell opens the assessment editor in a modal titled “Edit assessment”. The same editor is used whether or not an assessment row already exists. Its assessment form saves the score, date, weight, Exempt and NHI status, and notes. A separate form in the same modal adds or updates adjustments. A Close button, Escape, and the backdrop leave the editor without saving.

Today, a successful assessment save stores the assessment and refreshes the grade table, then leaves the modal open. The teacher has to close it to return to the grade view. Saving or adding an adjustment also leaves the modal open, so the teacher can see the adjustment list and add another.

The grading-structure editor on the grade table, and the assessment-setup editor on class settings, already close after a successful save. Those are different editors. Typing a mark straight into a grade-table cell saves without opening this modal.

## Functional Requirements

1. **Requested.** When the teacher successfully saves an assessment from the assessment editor, the editor closes.
2. **Requested.** The teacher is then on the class grade table that was behind the editor.
3. **Implied.** That grade table shows the result of the save: the mark, status, percent, note marker, and adjustment marker already defined for this cell.
4. **Implied.** Closing happens for every successful submit of the assessment form, including the Save assessment button and submitting that form from the keyboard. The editor uses that one action both to create an assessment and to update one.
5. **Implied.** A save that does not succeed leaves the editor open, keeps what the teacher entered, and shows the error.
6. **Implied.** This change does not alter what an assessment save stores. Score, date, weight, notes, Exempt, NHI, and clearing a mark stay as they are today.
7. **Implied.** Escape, the backdrop, and Close still leave the editor without saving the assessment form.
8. **Implied.** Adding an adjustment, or saving an adjustment the teacher is editing, does not close the editor.
9. **Implied.** The NHI “clear score” confirmation is not an assessment save. Confirming it or dismissing it leaves the editor open on the assessment form.
10. **Implied.** When the editor closes, keyboard focus returns to the grade-table control that opened it.

## Non-functional Requirements

- A successful assessment save does not ask for a further confirmation before the editor closes.
- The teacher can still dismiss the editor without saving, by keyboard and by pointer, as they can today.
- The closed editor does not leave a dialog in the way of the grade table.

## Business Rules

- The assessment editor belongs to one student and one piece of work, and it is opened from that student’s cell on the class grade table.
- “Save an assessment” means submitting the assessment form. It does not mean adding or saving an adjustment.
- The save succeeds only when the assessment has been stored, or the mark has been cleared, under the rules that form already uses, and the grade table can show that result.
- A failed save is not a close. The teacher’s entries in the assessment form remain so they can correct them.
- An adjustment the teacher has typed but not saved is not part of the assessment save. Closing the editor does not store it.

## Acceptance Criteria

- When the teacher changes the score, date, weight, Exempt, NHI, or notes and the assessment save succeeds, the editor is gone and the grade table shows that saved result on the same cell.
- When the teacher saves without changing any field and the save succeeds, the editor closes and the cell is unchanged apart from what that save already does today.
- When the teacher saves an assessment that did not exist yet and the save succeeds, the editor closes and the new result is on the grade table.
- When the assessment form is submitted from the keyboard and the save succeeds, the editor closes in the same way as Save assessment.
- When the save fails because a counted mark is required, or because the assessment could not be stored, the editor stays open, the entered values are still there, and the error is shown.
- When the teacher adds an adjustment, or saves an adjustment they are editing, the editor stays open and the adjustment list includes that adjustment.
- When the teacher closes the editor with Close, Escape, or the backdrop without saving, unsaved assessment changes are not stored and the editor is gone.
- When the teacher turns on NHI and the clear-score warning appears, confirming or dismissing that warning leaves the assessment editor open.
- After a successful assessment save, keyboard focus is on the control that opened the editor.

## Edge Cases

1. Exempt, NHI, a note with no counted mark, a counted score, and a save that clears the mark. Each successful save closes the editor. A save that the form already rejects stays open.
2. The teacher has started an adjustment, or is editing one, and then saves the assessment successfully. The assessment save is stored, the editor closes, and the unsaved adjustment is not stored.
3. The teacher submits the assessment form again while a save is in progress. The in-progress save is not applied twice, and the editor does not close before that save succeeds.
4. The assessment is stored, then the grade table cannot be refreshed. The editor stays open and shows the error, because the teacher has not been returned to a grade table that shows the save.
5. The clear-score warning or the delete-adjustment confirmation is open. Neither is an assessment save, so neither closes the assessment editor on its own.
6. The grade table is showing another student’s row or another piece of work only as context. Saving this assessment does not change those other cells, and only this editor closes.

## Out of Scope

1. Changing the values an assessment save stores, including Exempt, NHI, notes, adjustments, and clearing a mark.
2. Saving a mark by typing it into the grade-table cell. That path does not open this editor.
3. The grading-structure editor and the class assessment-setup editor. Those already close after a successful save.
4. Making Add adjustment or Save adjustment close the editor.
5. The NHI clear-score warning and the delete-adjustment confirmation, except that they must not be treated as the assessment save.
6. Reports, averages, distributions, and database import or export.
7. A separate success message after the editor closes. The updated grade table is the confirmation.

## Suggested Improvements

1. **User experience.** Keep an adjustment the teacher has started when they save the assessment. The adjustment form can already hold a description, a percent or raw change, and notes. Closing on assessment save drops that unfinished adjustment, so the teacher can lose work they meant to keep.

## Open Questions

None.

## Assumptions

1. “Save an assessment (when editing it)” means the assessment form in the assessment editor opened from a grade-table cell. The editor is titled “Edit assessment” and the button is “Save assessment” both when an assessment row already exists and when this save creates one. Both cases close on success.
2. “The grade view or whatever” means the class grade table behind that modal. This editor is not opened from another screen.
3. Adding or saving an adjustment stays on the editor. Issue 63 names the assessment save, and the adjustment form is there so the teacher can add more than one before leaving.
4. Suggested improvement 1 is not a requirement. Until it is accepted, a successful assessment save closes even when the adjustment form has unsaved text, and that text is not stored.
