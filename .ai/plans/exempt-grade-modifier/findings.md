# Findings

Research for the exempt-grade modifier. Requirements: [`.ai/requirements/exempt-grade-modifier.md`](../../requirements/exempt-grade-modifier.md).

## How a mark is stored

An assessment is one row per student per piece of work (`assessments_work_student_unique`).

`src/main/database/schema.ts` defines `assessments.score` as `real("score").notNull()` and `status` as `text("status").notNull()`. There is no separate exempt flag. The status values used in code are `counted`, `exempt`, and `nhi`.

`src/shared/ipc.ts` mirrors that:

- `assessmentStatusSchema` is `z.enum(["counted", "exempt", "nhi"])`.
- `assessmentSchema.score` is `z.number()`.
- `assessmentUpsertInputSchema.score` is `z.number().finite()`. Status is optional on upsert.

`src/main/database/assessments.ts` `upsertAssessment` updates score, date, weight, notes, and status. Omitted date, weight, notes, and status keep the existing values. A new row defaults status to `counted`, date to today, weight to the work’s weight, and notes to `""`. `parseStoredAssessment` rejects an unknown status string. It does not interpret the score.

`src/main/grading-development-api.ts` `readAssessmentFields` requires a numeric score and accepts the same three statuses. That is the WSL browser-fallback HTTP path. It must accept the same payloads as IPC.

`src/renderer/grading.ts` parses the upsert payload with the shared Zod schema before calling preload. `src/preload/preload.ts` forwards the payload and does not parse it. `src/main/ipc/register.ts` parses the input and the output. `upsertAssessment` parses the input again.

Whole-file SQLite export and import copy the database as it is. A generated migration that makes `score` nullable is enough for existing files; import does not need a special case.

## How a mark contributes

`src/main/database/gradebook.ts` `buildWorkGrade`:

- No assessment: percent `null`.
- Status `nhi`: percent `0`, whatever score is stored. The NHI test stores score `8` and still expects percent `0`.
- Any other status, including `exempt`: `assessmentPercent(score, maximum, adjustments)`.

`countableWorkAverage` drops a work when `assessmentCountsTowardAverage` is false. That helper in `src/shared/grades.ts` returns true only for `counted` and `nhi`. Exempt work is therefore omitted from sub-category, category, and course weighted averages. The exempt test stores score `0` and expects the other work’s 100% to be the sub-category percent.

Class averages in `src/renderer/components/ClassGradeTable.tsx` `classAverages` use the same helper, so an exempt work percent is not included in the class work average. Sub-category, category, and course class averages are means of the student percents, which already exclude exempt work.

`src/shared/grade-distribution.ts` `countableMarksForWork` also uses `assessmentCountsTowardAverage`, so exempt marks are omitted from distribution samples. NHI contributes the zero percent.

Adjustments stay on the assessment. They change `assessmentPercent` and do not change the exempt exclusion.

Goal marks are a different table and are not read from assessment status.

## How a mark is entered and shown

### Grade table

`MarkCells` in `src/renderer/components/ClassGradeTable.tsx`:

- `markInputValue` shows `assessmentStatusCode` (`E` or `NHI`) or the numeric score.
- The percent cell shows that same code, or `formatGradePercent`.
- `grade-cell--exempt` and `grade-cell--nhi` in `ClassGradeTable.css` set the warning and error backgrounds. They do not grey the text.
- Typing `E` / `e` calls `parseSpecialMark`, then `upsertAssessment` with `status: "exempt"` and `score: current?.score ?? 0`. The previous score is kept. An empty cell stores `0`. If the status is already `exempt`, the function returns before that save, so a later clear would not run.
- Typing `NHI` stores score `0` and status `nhi`. The same already-matching-status return skips a second `NHI`.
- Typing a number always saves `status: "counted"`, which clears exempt or NHI. The unchanged-score return only matches `counted`, so blurring a greyed exempt score would be rewritten as counted.
- Emptying a cell calls `deleteAssessment`.

`src/shared/grades.ts` `SPECIAL_MARKS` is `{ code: "E", status: "exempt" }` and `{ code: "NHI", status: "nhi" }`. `parseSpecialMark` trims and compares case-insensitively with `en-GB`.

### Assessment editor

`src/renderer/components/GradeAssessmentModal.tsx` uses a `SelectField` labelled Status with Counted, Exempt, and Not handed in. `statusOmitsScore` disables the score field for both `exempt` and `nhi`. Save writes `0` for NHI, and for exempt writes the leftover score or `0`. There is no checkbox in the renderer today.

The modal already uses `Modal` and `ConfirmDeleteModal`. `ConfirmDeleteModal` makes the teacher type a name before confirming a delete. That is the wrong pattern for a warning that the score will be cleared. `Modal` itself is a dialog with a title, Escape to close, and focus restore. A confirm/cancel warning can be built on it.

`TextField` / `FieldFrame` are the labelled controls. A checkbox can follow that label pattern. There is no shared checkbox component.

### Individual report

`src/renderer/StudentClassReportPage.tsx` `reportScore` and the percent cell both prefer `assessmentStatusCode` over the number. `individual-report-work--exempt` and `--nhi` in `StudentClassReportPage.css` set the same warning and error backgrounds as the grade table, including `print-color-adjust: exact`.

## What the requirements change

From [`.ai/requirements/exempt-grade-modifier.md`](../../requirements/exempt-grade-modifier.md):

- Typing `E` clears the grade and shows `E`. It must no longer keep the previous score.
- The editor’s Exempt checkbox keeps the score. A stored exempt score, including one already in the database, is shown greyed out on the grade table and the report. `E` is only the presentation when no score is stored.
- Greyed numbers and `E` share the exempt background. NHI keeps its own background and still displays `NHI`.
- Exempt still does not roll up. A stored exempt score still has a calculated percent, shown greyed, including adjustments.
- The editor shows Exempt and NHI checkboxes together. Only one can be on. Neither on means counted.
- Turning NHI on while a mark exists opens a warning. Confirming clears the score and turns Exempt off. Dismissing changes nothing. No warning when there is no mark.
- Unchecking NHI leaves a counted zero.
- Typing `NHI` in the grade table clears the score immediately, turns Exempt off, and does not open the warning.
- Typing a number over `E` saves a counted mark. Editing a greyed exempt number keeps exempt.
- Emptying the cell still deletes the assessment.
- Not handed in still counts as zero. Suggested improvements (a non-colour exempt cue, keeping a visible NHI score, distinguishing placeholder zero from entered zero) are not requirements.

## Constraints

- Renderer code calls `window.gradebook` only. No new SQL API.
- Schema edits go in `schema.ts`, then `npm run db:generate`. Do not hand-write the migration.
- British English in UI copy. Named exports. `Array<T>`. No `as` except `as const`. Conditional render with `condition ? node : null`. Colocated CSS. Tokens stay in `src/renderer/styles.css`.
- `README.md` Databases says an assessment is `counted` or `exempt` and that exempt assessments are left out of averages. It does not mention not handed in or an exempt score that is still displayed. That paragraph has to match the new behaviour.
- No ADRs under `readme/adr/` and no architecture docs under `readme/architecture/`.
- Tests use temporary or in-memory SQLite. Relevant suites: `src/shared/grades.test.ts`, `src/main/database/gradebook.test.ts`, `src/shared/grade-distribution.test.ts`, `src/main/database/client.test.ts`, `src/main/development-api.test.ts`. There is no component test for the grade table or the assessment modal. `src/renderer/grade-mark-navigation.test.ts` covers keyboard movement only.

## Reuse

- Keep the status enum. The checkboxes are a view of that one field.
- Keep `assessmentCountsTowardAverage`, `parseSpecialMark`, and `assessmentStatusCode`.
- Keep `upsertAssessment` / `deleteAssessment`. Extend the score contract; do not add a channel.
- Keep `grade-cell--exempt` and `individual-report-work--exempt` as the shared background. Add a modifier only for grey text when a number is shown.
- Put the “code versus greyed number” decision in `src/shared/grades.ts` so the grade table and the report do not drift.
