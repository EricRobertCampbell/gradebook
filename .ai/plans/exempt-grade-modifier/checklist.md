# Checklist

Schema and the shared contract come before the main process. The display helper comes before the grade table and the report. The editor can follow the contract without waiting for the table.

## Main process / database

- [x] Make `assessments.score` nullable in `src/main/database/schema.ts` and generate the migration with `npm run db:generate`.
- [x] Persist a null score from `upsertAssessment`, and reject a null score when the status that will be stored is `counted`, including when the payload omits status.
- [x] Store `null` when the saved status is `nhi`, even if the payload included a number.
- [x] In `buildWorkGrade`, keep NHI at percent `0`, calculate a percent for an exempt or counted score, and leave percent `null` when the score is null.
- [x] Accept a null score in the development HTTP assessment parser, with the same counted-score rule as IPC.

## Shared contracts

- [x] Allow `null` on assessment score in the Zod output and upsert input.
- [x] Add a helper in `src/shared/grades.ts` that chooses `E`, `NHI`, or the numeric score from status and score.
- [x] Add a grade-table commit helper: typing `E` on an exempt row that still has a score clears it; an unchanged greyed score stays exempt; typing `NHI` clears; a number over `E` or `NHI` is counted; an empty cell deletes.
- [x] Cover the display helper: exempt `0` is numeric, exempt `null` is `E`, NHI is `NHI`, and exempt still does not count toward an average.
- [x] Cover the commit helper, including the two guards above.

## Renderer

- [x] Grade table: typing `E` saves exempt and a null score and shows `E`, including when the row is already exempt and still has a score. Typing `NHI` saves not handed in and a null score, with no warning, and shows `NHI`.
- [x] Grade table: typing a number over `E` or `NHI` saves a counted mark; editing a greyed exempt number keeps exempt; blurring an unchanged greyed score does not save counted; emptying the cell deletes the assessment.
- [x] Grade table and individual report: a stored exempt score and its percent are greyed, on the existing exempt background; `E` uses that same background; the adjustment mark stays visible for both; NHI is unchanged.
- [x] Assessment editor: replace the status dropdown with Exempt and NHI checkboxes that cannot both be on. The score stays editable while Exempt is on.
- [x] Assessment editor: checking NHI when the saved score is a number, or the field parses as a number including `0`, opens a confirm/cancel warning on `Modal`. Confirm clears the score and selects NHI. Dismiss changes nothing. A blank field with a null saved score does not open the warning.
- [x] Assessment editor: checking Exempt while NHI is on leaves the score blank. Unchecking NHI, with Exempt left off, sets a counted zero.
- [x] Save writes exempt plus the score or `null`, NHI plus `null`, or counted plus a required score. Date, weight, and notes stay as they are.

## Documentation

- [x] Update the `README.md` grading paragraph so an exempt mark can carry a score, is left out of averages, and not handed in counts as zero.

## Verification

- [x] Gradebook tests: an exempt score is excluded while its own percent is calculated; an exempt null score has no percent; NHI still contributes zero; a counted zero left by clearing NHI contributes zero.
- [x] Upsert tests: counted plus `null` fails; exempt `null` and exempt `0` persist; NHI persists `null`.
- [x] Distribution test: an exempt mark with a percent is still omitted.
- [x] Run `npm run check`.
