# Plan Review

Reviewed against `.ai/requirements/student-assessment-notes.md`, the plan directory, and the assessment, gradebook, grade-table, editor, and report code. The findings match that code. No application code was changed.

## Blocking Issues

None.

## Important Issues

### 1. The editor rules contradict each other

`decisions.md` says an empty score on a counted, exempt, or not-handed-in row calls `clearAssessmentMark`. The next paragraph says exempt and not-handed-in keep today’s save rules and do not call `clearAssessmentMark`. `plan.md` says those two statuses stay as they are.

The score box is cleared only while Counted is selected. Exempt and not-handed-in disable it. A teacher can clear the score, then switch the status to Exempt or Not handed in, and save. One reading of the decision turns that save into an unmarked note and deletes the adjustments. The other reading stores the selected mark.

Saving must follow the status selected in the form. `clearAssessmentMark` runs only when that status is Counted and the score is empty. Exempt and not-handed-in always save as those marks, including when the score box is empty.

### 2. Clearing the note on a note-only row leaves a row the grade table cannot remove

A note-only save creates `unmarked`. The editor rule for an already `unmarked` row updates the note and leaves adjustments in place, even when the new note is empty. The grade table then shows an empty mark and, on blur, does not call clear.

The teacher can remove the note and still have no way to remove the row. Adjustments added from the editor stay, so the percent cell can keep the adjustment marker on a cell with no mark and no note.

When a save leaves no visible mark and no note, delete the assessment. Adjustments then go with the row. Keep the row only when the trimmed note is non-empty.

## Generalization Opportunities

### Recommended

None. `assessmentHasVisibleMark` is already the right small helper. The grade table, the report, and `buildWorkGrade` all need the same answer, and `assessmentCountsTowardAverage` is the wrong one because exempt has a visible mark and still stays out of the average.

### Not Recommended

A nullable score would need a migration and a new null check on every reader. Status `unmarked` matches the existing text column and the existing status checks.

A fourth status in the editor dropdown, and a history of notes, are outside the requirements. The current row already stores one note.

## Questions

1. When the teacher clears the note on an assessment that has no mark, should that assessment be deleted? The suggested change above says yes, including its adjustments. Confirm or reject that before implementation.

## Suggested Changes

- In `decisions.md`, delete the bullet that sends an empty score on an exempt or not-handed-in row through `clearAssessmentMark`. State that the form status wins: only Counted plus an empty score clears a visible mark.
- In `decisions.md` and the `clearAssessmentMark` checklist item, delete an `unmarked` row when the trimmed note is empty. Do not leave adjustments behind on that row.
- In the assessment-editor checklist item, say the score field’s HTML `required` flag cannot stay on for every Counted save. `GradeAssessmentModal` currently sets `required` whenever the status is Counted, which blocks a note-only submit before the handler runs.
- In the verification checklist, include two manual checks: tabbing through a note-only cell leaves the note in place, and clearing the score in the editor on a marked assessment removes its adjustments and keeps the note.

## Missing Tests

- The gradebook tests cover `clearAssessmentMark`, and they can hide a wrong percent or a deleted note. They cannot see which command the editor chooses. A note-only save, a counted save, an exempt save with an empty score box, and a clear from a counted row should be covered by the database tests that those editor branches call. The manual editor check above covers the branch choice until a component test exists.
- Add a gradebook case for the empty-note `unmarked` row once the delete rule is confirmed: the assessment and its adjustments are gone, and the course percent is unchanged.
- The blur guard has no component test. The manual pass is what would catch a note-only cell being deleted on blur. That can hide a real regression, so it belongs in the verification list rather than a new test harness.

## Positive Findings

- The note stays on the existing one-row-per-student-per-work assessment. There is no new table and no migration.
- `deleteAssessment` stays a real delete. The grade table is the only screen that calls it today, and the plan stops using it for a clear that sometimes keeps the row.
- Placeholder score `0` does not become `0%`, because `buildWorkGrade` returns a null percent when there is no visible mark, and averages already go through `assessmentCountsTowardAverage`. Class distributions use that same helper, so an `unmarked` row stays out of them without a separate change.
- Trim matches the Zod `.trim()` already used for category, work, and adjustment notes. Omitted notes on update still keep the stored text, which is what the grade-table mark save relies on.
- The new channel is listed through the shared contract, preload, main handler, renderer caller, and the localhost development HTTP API.
- The report change removes only `assessment.notes`. Category notes, work notes, and adjustment details stay.
- The findings checked here match the code: the grade table deletes on an empty cell, counted saves require a score, `buildWorkGrade` only special-cases not-handed-in, and `reportScore` would show a stored `0`.

## Recommendation

Revise the plan. The approach can stay. Fix the editor contradiction and the empty note-only row, then the plan is ready to approve.
