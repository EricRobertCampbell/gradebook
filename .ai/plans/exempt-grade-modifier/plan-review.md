# Plan Review

## Blocking Issues

### Grade-table save returns before the new exempt rules run

`MarkCells` in `src/renderer/components/ClassGradeTable.tsx` leaves the cell unchanged when the typed code already matches the stored status, and any numeric save that does run forces `counted`:

- If the cell is already exempt and the teacher types `E`, the function returns at the `current.status === specialStatus` check. The score is not cleared. That is the current guard, and neither `findings.md` nor the grade-table section of the plan mentions it. After this feature, that cell is often a greyed score with status `exempt`, which is exactly the case acceptance requires to become `E` with no score.
- If the teacher tabs through a greyed exempt score without changing it, the numeric path does not return. The early return only matches `counted`. The following save sets `status: "counted"`, so leaving the cell removes Exempt.

The plan states the intended results, but the obvious edit (pass `score: null` for `E`, and keep `exempt` when a number changes) never runs for these two inputs. The planned tests cover a display helper and `buildWorkGrade`. They do not execute this function, so the guards would survive `npm run check`.

The plan should say that typing `E` still saves when the row is already exempt and the score is not null, and that blurring an unchanged greyed score must not rewrite it as counted.

## Important Issues

### The NHI warning follows the field, not the saved mark

The plan treats a blank score field as “no existing mark”, so checking NHI does not warn. The saved assessment can still hold a number: the teacher can clear the box, or an existing not-handed-in row can still store the score this schema requires today. Save then writes `null` and the score is gone without the warning the requirements ask for when a mark exists.

Warn when the saved score is a number or the field parses as a number, including `0`. A blank field with a null saved score still skips the modal.

### A null score can land on a counted row

Upsert keeps the existing status when the payload omits it (`parsed.status ?? existing.status` in `src/main/database/assessments.ts`). The plan applies the “counted requires a score” rule to the status in the payload. A payload of `{ score: null }` with no status, against a counted row, would store a counted null. `buildWorkGrade` would then skip `assessmentPercent` and that counted mark would drop out of the average.

Apply the rule to the status that will be stored. Omitted status plus a null score is rejected when that status is `counted`.

## Generalization Opportunities

### Recommended

Put the grade-table commit next to the display helper in `src/shared/grades.ts`: given the current status and score, and the trimmed cell text, return “delete”, “unchanged”, or the status and score to save. The component already has one function that both interprets `E` / `NHI` and writes the assessment. The new display helper does not cover that write, and the table and the tests would otherwise each reimplement the null-versus-zero rules. A pure function is the same shape as `parseSpecialMark`, and the two blocking inputs become ordinary Vitest cases. The editor can use the same status-and-score result after its own warning; it should not grow a second copy of “exempt may keep a number, NHI and `E` store null, leaving NHI for counted stores `0`”.

### Not Recommended

A form-state framework, a third status column, or a shared “special mark” editor for future codes. Exempt and NHI are the whole set, and the status enum already stores them.

## Questions

None. The blocking and important items follow the requirements; they do not need a new product decision.

## Suggested Changes

- In the grade-table section and the checklist, state the two guards: `E` on an exempt row that still has a score clears it, and an unchanged greyed score stays exempt.
- Define the NHI warning from the saved score as well as the field, as in the important issue above.
- In the IPC section, state that the counted-score check uses the stored status, including when the payload omits status.
- Keep the adjustment asterisk on a cleared `E` cell. The percent cell in `ClassGradeTable.tsx` shows it beside either the code or the percent; the plan only mentions it for a greyed score. The report already lists adjustments in the work notes.
- Set the counted zero only when the teacher unchecks NHI and Exempt stays off. Do not do it whenever NHI turns off, or checking Exempt while NHI is on would save a greyed `0` instead of `E`.
- `findings.md` says the preload script validates IPC payloads. `src/preload/preload.ts` only forwards them. Validation is in `src/renderer/grading.ts`, `src/main/ipc/register.ts`, and `upsertAssessment`. The plan is right that preload does not need a new method.

## Missing Tests

- The grade-table commit described above. Without it, tabbing off a greyed mark and typing `E` on that mark can ship broken while `npm run check` passes. This is the sort of gap that hides a regression. The recommended pure function is enough; a component test is not required.
- The editor’s confirm and dismiss. The plan tests that NHI persists as null, not that dismiss leaves the score in place. The same function can represent “NHI requested while a score exists” separately from “NHI confirmed”.

`classAverages` already skips exempt via `assessmentCountsTowardAverage`, and this plan does not change that function. It does not need a new test unless the implementation edits it.

## Positive Findings

- Nullable score is the right storage choice. Cleared `E` and an entered exempt `0` cannot both display correctly if both are stored as `0`. Leaving existing numbers in place matches the requirement that those rows show greyed.
- Status stays the current enum. The checkboxes replace the dropdown that would disagree with them. No new IPC channel.
- Exempt still drops out of roll-ups, class averages, and distributions through `assessmentCountsTowardAverage`. NHI still forces percent `0` in `buildWorkGrade`.
- The warning reuses `Modal`. `ConfirmDeleteModal` would make the teacher type a name, which this warning does not need.
- Import already bootstraps the file and runs migrations, so an imported database picks up the nullable column without a special import path.
- `numberInputValue` already turns null into an empty string, so the editor can show a blank score for a cleared mark.

## Recommendation

Revise the plan. The approach can stay. The grade-table guards, the NHI warning, and the counted-score check should be written into the plan before implementation.
