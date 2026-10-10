# Plan

Status: Done

Approved on 2026-10-10, including the two plan-review corrections in Revisions. Implemented on 2026-10-10.

Requirements: [student-assessment-notes](../../requirements/student-assessment-notes.md).

## Objective

A teacher can keep one plain-text note on a student’s assessment, see on the grade table that the note exists, save it before there is a mark, and keep it when the mark is cleared. Clearing the mark removes that assessment’s adjustments. The individual report does not show the assessment note. Saved notes are trimmed like the other note fields.

## Scope

- Status `unmarked` for an assessment that has a note and no visible mark.
- Grade-table marker for a non-empty note.
- Assessment editor save when the counted score is empty.
- `clearAssessmentMark` for emptying a visible mark, including exempt and not-handed-in.
- Stop printing the assessment note on the individual report.
- Trim assessment notes on save.
- Tests for the percent, clear, trim, and report-detail behaviour.
- Update the grading description in `README.md`.

## Out of scope

- Student, parent, class, category, work, and adjustment note editors.
- Showing the assessment note, or any extra note history, on the individual report.
- Rich text, attachments, or several notes over time.
- A confirmation dialog before clearing a mark. The README next step about that dialog stays as a separate idea.
- A new Drizzle migration. `status` has no check constraint. The score column is already nullable, so an unmarked note stores null rather than a placeholder.
- Changing database export. A saved copy already includes the assessment row.

## Architectural approach

Keep the note on the existing assessment row. Represent “no mark” as `status: "unmarked"` with a null score. Percent calculation and mark display treat that status as having no mark. A stored `0` stays a counted mark or a greyed exempt score.

Put the clear-mark rule in the main process as `clearAssessmentMark`, and call it from the grade table and from the editor when a visible mark is saved away. `deleteAssessment` stays a real delete and is what clear uses when the note is empty.

The choices are recorded in [decisions.md](decisions.md).

## Affected systems

- Shared grade helpers and the Zod assessment contract.
- Main-process assessment commands, class gradebook percent, IPC, and the WSL development HTTP API.
- Class grade table, assessment editor, and individual report.
- `README.md` grading paragraph and the next-step sentence that says emptying a cell always deletes the assessment.

## Affected files and modules

- `src/shared/grades.ts` and `src/shared/grades.test.ts`
- `src/shared/ipc.ts` and `src/shared/ipc.test.ts`
- `src/shared/preload-api.ts`
- `src/preload/preload.ts`
- `src/main/database/assessments.ts`
- `src/main/database/gradebook.ts` and `src/main/database/gradebook.test.ts`
- `src/main/grading-api-handlers.ts`
- `src/main/grading-development-api.ts` and `src/main/development-api.test.ts`
- `src/main/main.ts`
- `src/renderer/grading.ts`
- `src/renderer/components/ClassGradeTable.tsx` and `ClassGradeTable.css`
- `src/renderer/components/GradeAssessmentModal.tsx`
- `src/renderer/StudentClassReportPage.tsx` and a colocated test for the report detail list
- `README.md`

## Data changes

No table, column, or migration change.

New rows and cleared marks may store `status = 'unmarked'` and `score = null`. Existing counted, exempt, and not-handed-in rows stay as they are until a teacher edits them. An unmarked save with an empty effective note is rejected.

## IPC / contract changes

- Add `unmarked` to `assessmentStatusSchema`.
- Trim upsert `notes` with `z.string().trim().optional()`.
- Add `assessment:clear-mark`. Input is the work id, student id, and optional note, date, and weight. Output is `{ kept: boolean }`.
- Wire the channel through the preload API, `preload.ts`, `main.ts`, `grading-api-handlers.ts`, and `src/renderer/grading.ts`.
- Add the same operation to the development HTTP API, and accept `unmarked` in `readAssessmentFields`.

`assessment:delete` stays a full delete.

## Renderer changes

Grade table:

- Show an empty mark for `unmarked`, and do not clear again when that empty cell blurs.
- Show a note marker on the mark cell when the trimmed note is non-empty. Accessible text: “Note for {work name}”. Do not render the note text in the cell.
- Call `clearAssessmentMark` when a visible mark is emptied.

Assessment editor:

- Allow an empty counted score when the result is a note-only save or a clear.
- Follow the empty-score rules in [decisions.md](decisions.md).
- Keep the score required for a counted save that has a mark. Exempt and not-handed-in stay as they are.

Individual report:

- Remove the assessment note from the work detail list.
- Show an em dash for an `unmarked` score, using the same visible-mark rule as the grade table.

## Main-process and database changes

- `upsertAssessment` stores trimmed notes. Omitted notes still preserve the stored value on update.
- `clearAssessmentMark` implements the keep-or-delete rule and deletes adjustments only when leaving a visible mark.
- `buildWorkGrade` returns a null percent when the assessment has no visible mark. Not-handed-in stays `0`. Exempt still calculates a percent and still shows `E`.
- Averages keep using `assessmentCountsTowardAverage`, which is false for `unmarked` and `exempt`.

## Testing strategy

- `grades.test.ts`: `unmarked` does not count and has no status code. `assessmentHasVisibleMark` is false only for `unmarked`.
- `ipc.test.ts`: assessment note input `"  Late  "` parses as `"Late"`, and `"   "` parses as `""`.
- `gradebook.test.ts`: a note-only save leaves the course percent null and does not copy the note to another student; entering a counted mark afterwards keeps the note and creates a percent; clearing a counted, exempt, or not-handed-in mark with a note removes adjustments, keeps the note, and leaves no percent; clearing a mark with an empty note deletes the assessment; an inline score save that omits notes keeps the note.
- A colocated report test for the detail list: work notes and adjustment details remain, and the assessment note is absent.
- `npm run check` before the work is called ready.
- Exercise the grade table, editor, and individual report in the running app when a browser or Electron window is available. If it is not, say which screen was not exercised. There is no existing page-level test harness.

## Migration and backwards compatibility

No migration. Older databases open unchanged. A note saved before this change still displays; its surrounding spaces disappear the next time it is saved. The marker treats a whitespace-only stored note as empty.

The desktop app and the development HTTP API ship together, so adding `unmarked` and `assessment:clear-mark` does not support an older renderer talking to a newer main process.

## Security considerations

The note is student data and stays in the local database with the other notes. The new IPC input is validated with the shared Zod schema, and the handler parses output the same way as the existing assessment channels. The development route stays on the existing localhost-only API. Error messages should not need to include the note text.

## Relevant architecture docs and ADRs

`README.md` Architecture, Databases, and Stack. There are no ADRs or architecture docs under `readme/`. The grading paragraph in Databases is the invariant this change updates: an assessment may be counted, exempt, not handed in, or unmarked, and an unmarked note does not enter the average.

## Open questions

None. The mechanism choices are in [decisions.md](decisions.md).

## Revisions

### 2026-10-10

The plan review’s two corrections are accepted.

- The assessment editor follows the selected status. Exempt and not-handed-in save as those marks even when the score box is empty. `clearAssessmentMark` runs only when Counted is selected and the score is empty.
- An unmarked assessment whose note is cleared is deleted, and its adjustments go with it.
- The score field is not HTML-required for every Counted save, so a note-only submit can reach the handler.

### 2026-10-10 review follow-up

- The editor’s empty-score choice lives in `planAssessmentSave`, with tests for exempt, not handed in, counted, note-only, and clear.
- `clearAssessmentMark` writes the adjustment delete and the assessment change in one transaction.
- A clear with no assessment throws “That assessment was not found.”
- The mark input describes the note with `aria-describedby`.

### 2026-10-10 rebase

Main made `assessments.score` nullable and replaced the status dropdown with Exempt and Not handed in checkboxes. An unmarked note stores a null score. An empty exempt score saves null, and a stored exempt score, including `0`, is kept when the box still shows it.

## Assumptions

- The grade-table indication is a marker. The note text remains in the editor, as the requirements assume.
- One note column remains enough.
- A null score on `unmarked` is not a mark. Exempt and not-handed-in rows may also store a null score, and only a visible mark is shown.
