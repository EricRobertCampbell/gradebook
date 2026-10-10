# Plan

Status: Done

Approved 10 October 2026 after the plan review was folded in. Implemented the same day. `npm run check` passed (27 files, 151 tests). The grade table, editor, and report were not exercised in a running window.

## Objective

A teacher can keep a numerical mark and mark it exempt, seeing that mark greyed out and excluded from averages. Typing `E` still clears the grade and shows `E`. In the assessment editor, Exempt and NHI are mutually exclusive checkboxes, and turning on NHI warns before clearing an existing score.

## Scope

- Nullable assessment score, with counted marks still required to have a number.
- Grade-table entry for `E`, `NHI`, numbers, and a cleared cell.
- Assessment editor checkboxes and the NHI warning.
- Greyed exempt numbers on the grade table and the individual report, sharing the current exempt background.
- Existing roll-up, class-average, and distribution behaviour for exempt and not handed in.
- The grading sentence in `README.md`.

## Out of scope

- A new assessment status, or renaming Exempt to Excused.
- Changing how NHI counts or how the code `NHI` is drawn, beyond switching it with Exempt.
- A non-colour exempt cue, keeping a visible score after NHI, or distinguishing a historical zero from an entered zero. Those remain suggested improvements in the requirements.
- Goal marks, adjustment maths, weights, and the distribution pass cutoff.
- A warning when the teacher types `NHI` in the grade table or empties a cell.

## Architectural approach

The status column already expresses counted, exempt, and not handed in. The checkboxes are that field in the editor. What changes is that exempt may carry a score, and “no score” has to be different from the number zero so a greyed `0` and a cleared `E` can both exist.

Make `assessments.score` nullable. `null` means the grade was cleared. Any stored number, including `0`, is an entered mark. Generate the migration with Drizzle Kit. Do not rewrite existing scores: they stay numbers and display greyed when the status is exempt.

Add a pure helper in `src/shared/grades.ts` that, given status and score, says whether to show `E`, `NHI`, or the number. The grade table and the individual report use it for the score cell, the percent cell, and the grey-text class. Percent calculation stays in `buildWorkGrade`: NHI is `0`, exempt or counted with a score uses `assessmentPercent`, and a null score has percent `null`. `assessmentCountsTowardAverage` stays as it is, so exempt still drops out of student averages, class work averages, and distributions, while NHI still counts as zero.

The editor removes the status dropdown. Two checkboxes write one status. The NHI checkbox opens a confirm/cancel `Modal` when a mark exists: the saved score is a number, or the score field parses as a number, including `0`. A blank field with a null saved score does not open it. The grade table does not open that modal.

`src/shared/grades.ts` also decides the grade-table commit. Given the current status and score and the trimmed cell text, it returns delete, unchanged, or the status and score to save. Typing `E` still saves when the row is already exempt and the score is not null. Blurring an unchanged greyed score is unchanged, not a rewrite to counted. The editor uses the same status-and-score result after its own warning: exempt may keep a number, `E` and NHI store null, and unchecking NHI while Exempt stays off stores a counted `0`. Checking Exempt while NHI is on keeps the score null.

No new IPC channel. `assessmentUpsert` learns a nullable score. The main process rejects `counted` with a null score.

## Affected systems

- SQLite schema and the generated migration applied on startup.
- Shared Zod contracts and grade display helpers.
- Assessment upsert in the main process and the development HTTP parser.
- Class grade table, assessment editor, and individual student report.

## Affected files and modules

- `src/main/database/schema.ts` and the generated files under `drizzle/`.
- `src/shared/ipc.ts`, `src/shared/grades.ts`, `src/shared/grades.test.ts`.
- `src/main/database/assessments.ts`, `src/main/database/gradebook.ts`, `src/main/database/gradebook.test.ts`.
- `src/main/grading-development-api.ts` and `src/main/development-api.test.ts` if the fixture score type changes.
- `src/renderer/components/ClassGradeTable.tsx` and `ClassGradeTable.css`.
- `src/renderer/components/GradeAssessmentModal.tsx` and `GradeAssessmentModal.css`.
- `src/renderer/StudentClassReportPage.tsx` and `StudentClassReportPage.css`.
- `src/shared/grade-distribution.test.ts` only if fixtures need a nullable score.
- `README.md` grading paragraph.

Preload and `src/main/main.ts` stay as they are: they already pass the upsert payload through the shared contract.

## Data changes

`assessments.score` becomes nullable. Cleared exempt and not-handed-in rows store `null`. Counted rows, and exempt rows with an entered mark, store a finite number. Existing numbers are left in place. Status values do not change.

## IPC / contract changes

`assessmentSchema.score` and `assessmentUpsertInputSchema.score` accept `null`. Upsert validation uses the status that will be stored, including when the payload omits status and the existing row supplies it:

- `counted` requires a finite score. Omitted status plus a null score is rejected when that stored status is `counted`.
- `exempt` allows a finite score or `null`.
- `nhi` allows `null`. A numeric score on NHI is stored as `null` on write, so a confirm cannot leave a hidden number behind.

The development HTTP reader accepts a null score and uses the same rule. No channel is added.

## Renderer changes

Grade table:

- `E` saves `status: "exempt"` and `score: null`, then shows `E` on the exempt background. This still saves when the row is already exempt and the score is not null. The existing `current.status === specialStatus` return must not skip that clear.
- `NHI` saves `status: "nhi"` and `score: null` with no modal, then shows `NHI`.
- A number typed over `E` or `NHI` saves `counted` and that score.
- A number edited on a greyed exempt mark saves `exempt` and that score. Blurring that cell without a change does not save `counted`. The existing early return only matches `counted`; the commit helper must treat an unchanged exempt score as unchanged.
- An empty cell still deletes the assessment.
- A stored exempt score shows in the input and the percent column, greyed, on the exempt background. Adjustments still show the asterisk, including when the percent cell shows `E`.

Assessment editor:

- Remove the status select.
- Add Exempt and NHI checkboxes in its place. Checking one unchecks the other.
- The score field stays editable while Exempt is on, including when the field is blank.
- Checking NHI opens the warning when the saved score is a number or the field parses as a number, including `0`. Confirm clears the field, checks NHI, and unchecks Exempt. Dismiss leaves both checkboxes and the score unchanged.
- Checking NHI with a blank field and a null saved score does not open the modal.
- Checking Exempt while NHI is on switches to Exempt without a warning. The score stays blank, so the saved mark shows `E`. That gesture must not first write a counted zero.
- Unchecking NHI, and only that uncheck while Exempt stays off, sets the score field to `0` and leaves both checkboxes off, so save writes a counted zero.
- Save writes `exempt` plus the entered score or `null`, `nhi` plus `null`, or `counted` plus a required score.

Individual report:

- Exempt with a score: greyed score and greyed percent, exempt row background.
- Exempt with no score: `E` in both columns, same background.
- NHI: unchanged `NHI` presentation and background.

## Main-process and database changes

`upsertAssessment` persists a null score. `buildWorkGrade` treats a null score as no percent unless the status is `nhi`, which remains percent `0`. Roll-up helpers do not need a new exclusion rule.

## Testing strategy

Extend the existing Vitest suites. Do not add a browser harness; the grade table and report have no component tests, so the display decision lives in `grades.ts` where it can be asserted directly.

- Helper: exempt plus a number, including `0`, is a numeric mark; exempt plus `null` is `E`; NHI is `NHI`; counted is numeric. Exempt does not count toward averages; NHI does.
- Grade-table commit: typing `E` on an exempt row that still has a score clears it; blurring an unchanged greyed score stays exempt; typing `NHI` clears without a warning; a number over `E` or `NHI` is counted; an empty cell deletes.
- Gradebook: an exempt score is excluded from the sub-category percent while its own percent matches the score and adjustments. An exempt `null` score has percent `null` and is excluded. NHI still contributes `0` after the score is cleared. Unchecking NHI is a counted `0` and contributes `0`.
- Upsert: `counted` with `null` is rejected. `exempt` with `null` and with `0` both persist. `nhi` persists `null`.
- Distribution: an exempt mark with a real percent is still omitted.

`npm run check` is the verification command.

## Migration and backwards compatibility

Drizzle Kit generates the migration from the schema edit. Startup applies it. Existing scores stay. An existing exempt number, including `0`, displays greyed. An existing NHI row that still holds a number still displays `NHI` and counts as zero; the next NHI save clears that number. No teacher action is required.

## Security considerations

The nullable score is still validated by the shared Zod schema in the main process. `counted` cannot be saved without a finite score. The development HTTP parser must not accept a counted mark with no score either. No new IPC surface and no change to database import checks.

## Relevant architecture docs and ADRs

`README.md` Architecture, Databases, and Stack. The Databases paragraph is the grading description this work changes. There are no ADRs or `readme/architecture/` docs.

## Open questions

None.

## Revisions

10 October 2026. Folded in the plan review before implementation. The grade-table commit is a shared helper so typing `E` on an exempt score still clears it, and blurring an unchanged greyed score does not force counted. The NHI warning treats a saved number as an existing mark. The counted-score check uses the status that will be stored. The approach, scope, and architecture are unchanged.

## Assumptions

- A blank score field and a null saved score are “no existing mark”. A saved number, or a score field that parses as a number including `0`, is an existing mark and triggers the NHI warning.
- The warning copy states that the score will be cleared. The buttons confirm or dismiss. Exact wording can follow nearby modal copy, in British English.
- Suggested improvements in the requirements stay out of scope.
