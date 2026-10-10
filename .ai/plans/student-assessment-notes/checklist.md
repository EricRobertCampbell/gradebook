# Checklist

Tasks are in dependency order inside each group. Shared status and trim rules come before the clear command. The clear command comes before the screens that call it.

## Shared contracts

- [x] Add `unmarked` to `assessmentStatusSchema`.
- [x] Add `assessmentHasVisibleMark` in `src/shared/grades.ts`. It is true for `counted`, `exempt`, and `nhi`.
- [x] Keep `assessmentCountsTowardAverage` false for `unmarked` and `exempt`, and true for `counted` and `nhi`.
- [x] Leave `assessmentStatusCode("unmarked")` null.
- [x] Trim `assessmentUpsertInputSchema.notes` when the field is present.
- [x] Add `assessment:clear-mark` with lookup input plus optional trimmed notes, date, and weight, and output `{ kept: boolean }`.
- [x] Cover the new status helpers in `src/shared/grades.test.ts` and the note trim in `src/shared/ipc.test.ts`.

## Main process / database

- [x] In `buildWorkGrade`, return a null percent when the assessment has no visible mark. Keep not-handed-in at `0`.
- [x] Store trimmed notes in `upsertAssessment`. On update, omitted notes still keep the stored text.
- [x] Add `clearAssessmentMark`. From a visible mark, delete that assessment’s adjustments, then delete the row when the note is empty, or set `unmarked` and a null score when the note is not empty. On an already `unmarked` row, delete the row when the note is empty; otherwise update the note, date, and weight and leave adjustments in place.
- [x] Wire `clearAssessmentMark` through `grading-api-handlers.ts`, `main.ts`, and the development HTTP API. Accept `unmarked` in `readAssessmentFields`.
- [x] Add gradebook tests for a note-only save, a later counted mark, clear with a note, clear without a note, clear of exempt and not-handed-in, adjustment removal, and a mark save that omits notes.

## Renderer

- [x] Add `clearAssessmentMark` to `src/shared/preload-api.ts`, `src/preload/preload.ts`, and `src/renderer/grading.ts`.
- [x] Show an empty mark for `unmarked`. Do not call clear when that empty cell blurs.
- [x] Call `clearAssessmentMark` when the teacher empties a counted, exempt, or not-handed-in mark.
- [x] Show a note marker on the mark cell when the trimmed note is non-empty, with accessible text `Note for {work name}`, styled in `ClassGradeTable.css`.
- [x] In the assessment editor, follow the Exempt and Not handed in checkboxes. Those marks save even when the score box is empty. An empty exempt score saves null. Neither box, with an empty score, creates or clears via `clearAssessmentMark`, and an empty note on that path deletes the row. Do not leave the score field HTML-required for every counted save.
- [x] Remove the assessment note from the individual report detail list. Show an em dash for an `unmarked` score. Keep category notes, work notes, and adjustment details.
- [x] Add a colocated test that the report detail list includes the work note and adjustment details and excludes the assessment note.

## Documentation

- [x] Update the Databases grading paragraph in `README.md` so an assessment can be unmarked, and an unmarked note stays out of the average.
- [x] Update the next-step sentence that says emptying a cell always deletes the assessment. Emptying a cell deletes the assessment when the note is empty, and otherwise removes the mark and the adjustments and keeps the note.

## Review follow-up

- [x] Test the editor empty-score choice: exempt and not handed in stay those marks, a counted score saves, a note with no row is unmarked, an existing empty counted score clears, and no score with no note and no row is rejected.
- [x] Clear a visible mark inside one transaction, so a failed assessment write keeps the mark and its adjustments.
- [x] Reject `clearAssessmentMark` when no assessment exists.
- [x] Point the mark input’s `aria-describedby` at “Note for {work name}”.

## Verification

- [x] Run `npm run check`.
- [x] Exercise the grade table marker, a note saved with no mark, clearing a mark that has adjustments, and the individual report. Also tab through a note-only cell and confirm the note stays, and clear the score in the editor on a marked assessment and confirm the adjustments are removed and the note stays. Record what could not be opened. The data rules were checked through Vitest and the development HTTP API. The grade table was opened, but those clicks were not completed; see `verification.md`.
