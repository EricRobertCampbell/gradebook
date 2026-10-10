# Findings

Research for the student assessment note work in [the requirements](../../requirements/student-assessment-notes.md). No application code was changed.

## What already works

One assessment row already exists per student per piece of work (`assessments_work_student_unique` in `src/main/database/schema.ts`). `assessments.notes` is required text. The assessment editor (`src/renderer/components/GradeAssessmentModal.tsx`) saves that field with the score, date, weight, and status. On update, `upsertAssessment` in `src/main/database/assessments.ts` keeps the stored note when `notes` is omitted. Typing a mark in the grade table calls `upsertAssessment` without `notes`, so an existing note survives a mark edit.

A database export copies the SQLite file, so a saved note is already included. Deleting the work or the student cascades to the assessment and its note.

Category, work, student, parent, class, and adjustment notes are separate fields. This work does not change those editors.

## Relevant files

| Path                                                                                                          | Role                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main/database/schema.ts`                                                                                 | `assessments.notes`, `score`, `status`; `adjustments.assessmentId` cascades on assessment delete                                                                             |
| `src/main/database/assessments.ts`                                                                            | `upsertAssessment`, `deleteAssessment`, adjustment create/update/delete                                                                                                      |
| `src/main/database/gradebook.ts`                                                                              | Builds each `StudentWorkGrade` percent. Not-handed-in is `0`. Every other status uses `assessmentPercent`, including a stored score of `0`                                   |
| `src/shared/grades.ts`                                                                                        | `assessmentCountsTowardAverage` is true for `counted` and `nhi`, false for `exempt`. `assessmentStatusCode` shows `E` and `NHI`                                              |
| `src/shared/ipc.ts`                                                                                           | `assessmentStatusSchema` is `counted`, `exempt`, `nhi`. Upsert `notes` is `z.string().optional()` and is not trimmed. Adjustment and structure notes use `z.string().trim()` |
| `src/shared/preload-api.ts`, `src/preload/preload.ts`, `src/main/main.ts`, `src/main/grading-api-handlers.ts` | Assessment upsert and delete are wired IPC and development-API handlers                                                                                                      |
| `src/main/grading-development-api.ts`                                                                         | `PUT` and `DELETE` `.../students/:studentId/assessment`. `readAssessmentFields` requires a score and rejects any status other than the three above                           |
| `src/renderer/grading.ts`                                                                                     | Renderer caller. Parses with the shared Zod schema, then preload or the development HTTP API                                                                                 |
| `src/renderer/components/ClassGradeTable.tsx`                                                                 | Mark cell. Emptying a cell calls `deleteAssessment`. Adjustment `*` sits on the percent. `markInputValue` shows the status code or the numeric score                         |
| `src/renderer/components/ClassGradeTable.css`                                                                 | `.grade-adjusted-mark` is the adjustment marker                                                                                                                              |
| `src/renderer/components/GradeAssessmentModal.tsx`                                                            | Counted status requires a score. Exempt and not-handed-in omit it. Notes are a textarea on the same save                                                                     |
| `src/renderer/StudentClassReportPage.tsx`                                                                     | `workDetails` appends the work note, then `assessment.notes`, then each adjustment. `reportScore` prints the status code or the numeric score                                |
| `src/shared/grade-distribution.ts`                                                                            | Countable marks require `assessmentCountsTowardAverage` and a finite percent                                                                                                 |
| `src/main/database/gradebook.test.ts`                                                                         | Covers counted, exempt, not-handed-in, adjustments, and delete-clears-the-mark                                                                                               |
| `src/shared/grades.test.ts`, `src/shared/ipc.test.ts`                                                         | Status helpers and trimming of other note fields. No assessment-note trim test                                                                                               |
| `README.md`                                                                                                   | Databases section says an assessment is `counted` or `exempt`. Next steps still say emptying a cell deletes the assessment                                                   |

There is no `readme/adr/` or `readme/architecture/` directory. There is no `assessments.test.ts`. Renderer pages are not mounted in Vitest. `src/renderer/grade-mark-navigation.test.ts` covers keyboard movement only.

## Mark and percent behaviour

Statuses today:

| Status    | Grade-table mark | Counts toward averages | Percent                                        |
| --------- | ---------------- | ---------------------- | ---------------------------------------------- |
| `counted` | The score        | Yes                    | Score divided by the maximum, then adjustments |
| `exempt`  | `E`              | No                     | Calculated, then hidden behind `E`             |
| `nhi`     | `NHI`            | Yes                    | Forced to `0`                                  |

`score`, `date`, `weight`, and `notes` are all `NOT NULL`. Not-handed-in stores score `0`. There is no database check constraint on `status`, so a new status value does not need a generated migration.

`buildWorkGrade` only special-cases `nhi`. A row with status `counted` and score `0` produces `0%` and enters the course average. A note-only row cannot reuse that shape.

Emptying the grade-table cell deletes the assessment. Adjustments cascade with it. That is the right outcome when the note is empty. It deletes the note when one exists.

Leaving the mark cell when the draft is already empty returns early only when there is no assessment. A note-only row that still has an assessment would be deleted on blur unless that path changes.

## Editor behaviour

`GradeAssessmentModal` will not submit a counted assessment without a parsed score. Exempt and not-handed-in can be saved with a note and without a counted score. That is a mark (`E` or `NHI`), and not-handed-in still produces `0%`.

The notes control is on that same form. Saving a note before any mark has to come from this form, because the grade table has no notes field.

## Report behaviour

`StudentClassReportPage` `workDetails` pushes `workGrade.assessment.notes` between the class-wide work note and the adjustment descriptions. Category notes render on the category row. Adjustment notes render inside `adjustmentDetail`. The requirements keep those three and remove only the assessment note.

`reportScore` would print `0` for an unmarked row whose stored score is `0`, because `unmarked` has no status code. The percent cell would also print `0.0%` unless `buildWorkGrade` returns a null percent.

## IPC and process boundary

The renderer reaches the database only through `window.gradebook` or, in the WSL browser fallback, the development HTTP API on `127.0.0.1`. A new operation has to be added in `src/shared/ipc.ts`, `src/shared/preload-api.ts`, `src/preload/preload.ts`, `src/main/main.ts`, `src/main/grading-api-handlers.ts`, `src/renderer/grading.ts`, and `src/main/grading-development-api.ts`.

`deleteAssessment` remains a true delete. Overloading it to sometimes keep the row would make the existing channel mean two different things. The grade table is the only caller.

## Patterns to reuse

- Zod `.trim()` on note inputs, as category, work, student, and adjustment notes already do. Output schemas stay untrimmed strings because the stored value is already trimmed.
- `assessmentCountsTowardAverage` for averages, column means, and `countableMarksForWork`. A status that returns false is left out of those calculations.
- The adjustment marker in `ClassGradeTable` shows that something exists on a cell without opening the editor. The note marker should be separate from `*`, and it should sit on the mark cell so it is visible when the percent is `—`.
- Conditional render with `condition ? <Node /> : null`.
- Colocated CSS in `ClassGradeTable.css`. `.visually-hidden` already exists in `src/renderer/styles.css`.
- In-memory SQLite tests beside `gradebook.ts` and the shared modules.

## Gaps against the requirements

1. The grade table does not show that an assessment note exists.
2. A counted save requires a score, so a note cannot be stored with no mark and no percent.
3. Emptying the mark cell deletes the assessment, the note, and the adjustments together.
4. The individual report prints the assessment note.
5. Assessment notes are not trimmed on save.

## Constraints

- No generic SQL API, and no renderer access to Node or SQLite.
- Do not hand-write a Drizzle migration. This change does not need one if `status` stays unconstrained text and the score column stays non-null.
- Tests must use in-memory or temporary SQLite.
- British English in copy we control.
- `Array<T>` in type positions. No `as` assertions except `as const`.
- One note per student per assessment stays the existing column. No note history table.

## Risks

- Storing score `0` for a note-only row will display and average as `0%` unless every visible-mark and percent path treats that status as having no mark. `buildWorkGrade`, `markInputValue`, and `reportScore` are the three display paths.
- Blur on an empty note-only cell must not call the clear operation again, or a later edit could wipe adjustments that belong to a note-only row.
- The development HTTP parser rejects unknown statuses. Forgetting it would let Electron work and break the WSL browser fallback.
- Clearing a mark from the editor and from the grade table must both remove adjustments when a visible mark is removed, or the two screens will disagree.
