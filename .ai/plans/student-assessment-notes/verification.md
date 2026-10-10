# Verification

Date: 2026-10-10

## Commands

`npm run check` passed: TypeScript, ESLint, and Vitest. 28 files, 144 tests.

A later review follow-up added `planAssessmentSave` tests, a rollback test for a failed clear, and a missing-assessment rejection. `npm run check` passed again: TypeScript, ESLint, and Vitest. 29 files, 150 tests.

After rebasing onto the nullable-score change, an unmarked note stores a null score, and an exempt score of `0` stays `0`. `npm run check` passed: TypeScript, ESLint, and Vitest. 29 files, 167 tests. The earlier HTTP checks below were run before that rebase, when an unmarked row still stored score `0`.

A later review added a request-level test for the development clear-mark route. A failed clear now asks the teacher to refresh the gradebook and try again. `npm run check` passed: TypeScript, ESLint, and Vitest. 29 files, 168 tests.

After rebasing onto category excuses and the score raincloud, `npm run check` passed: TypeScript, ESLint, and Vitest. 33 files, 202 tests.

An unmarked save with an empty effective note is now rejected, and omitting notes on an existing note-only row still keeps that note. `npm run check` passed: TypeScript, ESLint, and Vitest. 33 files, 203 tests.

The development HTTP API on `127.0.0.1:8787` was then exercised against the running development database:

- A note-only save trimmed `  Still out  ` to `Still out`, stored score `0` and status `unmarked`, and left the course percent null.
- A counted save trimmed `  Late  ` to `Late`. A later save that omitted notes kept `Late`.
- An adjustment changed the counted percent. Clearing that mark removed the adjustment, kept the note, set `unmarked` with score `0`, and left the percent null.
- Updating an already unmarked note trimmed `Still late` and kept the row.
- Clearing an exempt mark and a not-handed-in mark kept each note and left no percent. Not-handed-in was `0` before the clear.
- A whitespace note (`   `) deleted the assessment.
- A whitespace note on a counted save was stored as `""`.

## Not clicked in the app

The class grade table was opened once in the browser at `http://127.0.0.1:5173/#/1/1`. It showed Science 9, Ada, and empty Quiz and Lab cells. The note marker, a note saved with no mark, clearing a mark, tabbing through a note-only cell, clearing a score in the editor, and the individual report were not clicked through. There is no page-level test harness. Those screens use the same main-process rules covered above, plus the renderer branches in `ClassGradeTable.tsx`, `GradeAssessmentModal.tsx`, and `StudentClassReportPage.tsx`.
