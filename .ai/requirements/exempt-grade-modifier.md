# Requirements

Source: [GitHub issue 35](https://github.com/EricRobertCampbell/gradebook/issues/35), “Excused should be a modifier on the grade”.

## Objective

A teacher can mark an assessment exempt in two ways. Typing `E` in the grade table clears the grade and marks it exempt. In the assessment editor, an Exempt checkbox can sit alongside an entered score; that score and its percent stay visible as greyed-out numbers, on the same exempt background as a cleared `E`. Either way, the exempt mark still drops out of averages the way it does today.

In that same part of the assessment editor, an NHI checkbox marks the assessment not handed in. Exempt and NHI cannot both be on. Choosing NHI when a mark is present warns that the score will be cleared.

## Background

The teacher marks work on the class grade table, edits a single assessment in the assessment editor, and reads the same marks on the individual student report and in class averages and grade distributions.

An assessment already stores a score and a status. The status is one of `counted`, `exempt`, or `nhi` (not handed in). Exempt and not handed in are alternatives to a counted mark, not modifiers on it:

- On the grade table, an exempt assessment shows the code `E` in the score field and in the percent column. The cells use a warning-tinted background. Typing `E` (any case) sets the status to exempt and keeps the stored score, or stores `0` when the cell was empty. Typing a number saves that score and forces the status back to `counted`. Typing `NHI` sets not handed in, stores `0`, and shows `NHI`.
- In the assessment editor, Exempt and Not handed in are options in the status list. Choosing either disables the score field. Saving an exempt assessment still writes a score: the number left in the field, or `0` when it is empty. Saving not handed in writes `0`.
- The assessment’s own percent is still the adjusted score divided by the work maximum. That percent is not shown for an exempt assessment. It is left out of the student’s sub-category, category, and course weighted averages, out of the class average for that work, and out of grade-distribution samples.
- The individual student report shows `E` in both the score column and the percent column, with the same warning tint. Not handed in shows `NHI` and an error-tinted row.
- Not handed in counts as zero in averages and distributions.

Issue 35 says “excused”. That means the existing Exempt status (`exempt`, code `E`). The label stays Exempt.

## Functional Requirements

1. **Requested.** Typing `E` in the grade table, in any case, clears the grade and marks the assessment exempt. The table then shows the current exempt presentation (`E` in the score field and the percent column), not a number.
2. **Requested.** The assessment editor has a checkbox labelled Exempt. The teacher can enter a numerical score and check Exempt on the same assessment. Checking or unchecking Exempt does not change the score. Changing the score does not clear the checkbox.
3. **Requested.** When an exempt assessment has a stored score, the grade table and the individual student report show that score and its percent greyed out. They do not substitute `E` for either number. This includes an existing exempt row whose score was kept when the teacher previously typed `E`.
4. **Requested.** Exempt assessments use the same background whether or not they have a score. A greyed score and a cleared `E` share that background.
5. **Requested.** An exempt assessment contributes to marks as it does today. It is left out of the student’s sub-category, category, and course weighted averages, left out of the class average for that work, and left out of grade-distribution samples. Goal marks are unchanged.
6. **Requested.** The assessment editor has an NHI checkbox in the same place as the Exempt checkbox. An assessment can be exempt or not handed in, but not both. Only one of those checkboxes can be on at once. Turning one on turns the other off. Neither on means the assessment is counted.
7. **Requested.** If the assessment has an existing mark and the teacher turns on NHI, a modal warns that the score will be cleared. The score is cleared, Exempt is turned off, and the assessment becomes not handed in only if the teacher confirms. Dismissing the modal leaves the score, Exempt, and not-handed-in state as they were.
8. **Implied.** If the assessment has no existing mark, turning on NHI does not show that modal. It marks the assessment not handed in and turns Exempt off.
9. **Implied.** Not handed in still displays `NHI` and still counts as zero in averages and distributions. It does not show a greyed score. Confirming the warning clears the score; empty or zero both satisfy that cleared score.
10. **Implied.** An exempt assessment may have no entered score. That includes typing `E` and checking Exempt with the score left blank. Storing that missing score as empty or as zero both meet this requirement. With no stored score, the grade table and the individual report keep the current `E` presentation.
11. **Implied.** With a stored score, the shown percent is the same percent a counted assessment would show for that score, maximum, and adjustments. Adjustments remain visible on the grade table and the individual report.
12. **Implied.** The score field in the assessment editor stays editable while Exempt is checked. It does not stay editable in a way that keeps a score once NHI is confirmed.
13. **Implied.** Unchecking Exempt leaves the entered score in place and counted, so it is included in averages again and shown as an ordinary mark.
14. **Implied.** Typing a number into a grade-table cell that shows `E` saves a counted mark with that score, as it does today. Editing the number in a cell that already shows a greyed exempt score updates the score and leaves the assessment exempt.
15. **Implied.** Emptying the grade-table cell removes the assessment, including the score and the exempt status. That is separate from typing `E`, which keeps an exempt assessment with no grade.
16. **Implied.** Date, weight, and notes stay editable on an exempt or not-handed-in assessment and keep their current meaning. Weight on an exempt assessment is still ignored in roll-ups because the assessment is excluded. Weight on a not-handed-in assessment still applies to a zero, as it does today.
17. **Requested.** Unchecking NHI leaves a counted zero. That zero counts toward averages and is shown as an ordinary mark. It does not restore a score from before the warning.
18. **Requested.** Typing `NHI` in the grade table marks the assessment not handed in and clears the score without the editor’s warning modal, and it turns Exempt off.

## Non-functional Requirements

1. **Implied.** A greyed exempt mark remains visually distinct from a counted mark in the grade table and on the individual report, including when the report is printed.
2. **Implied.** A cleared exempt mark remains recognisable as exempt (`E`), as it is today, and uses the same background as a greyed exempt score.
3. **Implied.** Existing assessments stay valid. No teacher action is required to open a class that already has exempt or not-handed-in marks. An existing exempt score is shown greyed out rather than hidden behind `E`.

## Business Rules

1. Exempt means the assessment is left out of weighted averages, class work averages, and grade distributions, whether or not it has a score. A class whose only marks on a piece of work are exempt still has no average for that work. A student whose included marks do not produce a percent still has no course percent.
2. When an exempt assessment has a stored score, its result is still calculated from that score and its adjustments. That result is displayed greyed out and is not rolled up. When it has no stored score, no numerical result is shown.
3. Not handed in still counts as zero and still displays `NHI`. It never applies together with Exempt. Confirming NHI clears any existing score.
4. An assessment still belongs to one student and one piece of work. Its special state is counted, exempt, or not handed in.
5. A missing score on an exempt assessment has no mark value. Empty and zero are equivalent for that purpose. A stored score on an existing exempt assessment is a mark and is shown greyed out.

## Acceptance Criteria

1. Typing `E` or `e` in a grade-table cell marks the assessment exempt, clears the entered grade, and shows `E` in the score field and the percent column.
2. After that, the stored score is empty or zero, and the mark stays out of the student’s averages, the class average, and the grade distribution.
3. In the assessment editor, the teacher can save a score and check Exempt, in either order, and both facts remain stored.
4. Checking or unchecking Exempt does not change the score. Editing the score does not uncheck Exempt.
5. With Exempt checked and a score stored, the grade table and the individual report show that score and its percent as greyed-out numbers, not `E`.
6. An existing exempt assessment that still has a stored score shows that greyed score and percent, including when the score was kept only because typing `E` did not previously clear it.
7. A greyed exempt score and a cleared `E` use the same background.
8. With one counted mark and one exempt mark of equal weight, the student’s rolled-up percent matches the counted mark only, as it does today. This holds both when the exempt mark has a score and when it does not.
9. The class average and the grade distribution for that work omit the exempt mark, as they do today.
10. Adjustments on an exempt mark that has a score change the greyed percent and do not change the rolled-up percent.
11. Unchecking Exempt includes the same score in averages again and shows it as an ordinary counted mark.
12. Typing a number over a cell that shows `E` saves a counted mark with that score.
13. Editing the greyed score in the grade table keeps the assessment exempt and shows the new score greyed out.
14. Emptying the grade-table cell removes the assessment.
15. The assessment editor shows an Exempt checkbox and an NHI checkbox together. Checking one unchecks the other. The assessment is never both exempt and not handed in.
16. Turning on NHI when a mark is present opens a modal that warns the score will be cleared. Confirming clears the score, turns Exempt off, marks the assessment not handed in, and shows `NHI`. Dismissing leaves the mark unchanged.
17. Turning on NHI when no mark is present does not open that modal, and the assessment shows `NHI`.
18. A not-handed-in assessment still counts as zero in averages and distributions.
19. Unchecking NHI stores a counted zero, shows that zero as an ordinary mark, and includes it in averages.
20. Typing `NHI` in the grade table clears the score, turns Exempt off, shows `NHI`, and does not open the warning modal.

## Edge Cases

1. Typing `E` over a counted score, over a greyed exempt score, and into an empty cell. Each ends as exempt with no entered grade, shown as `E`, on the same background as a greyed exempt score.
2. An exempt assessment with no score stored as empty, and one stored as zero, when that zero means the grade was cleared. Both show `E` and both stay out of averages.
3. An entered exempt score of zero. It shows as a greyed zero and stays out of averages. A cleared exempt mark may also be stored as zero. Empty and zero are both acceptable for the cleared case, so those two displays can coincide when the stored value is zero.
4. An existing exempt row whose stored score is the mark from before the teacher typed `E`. That score and its percent are greyed, not shown as `E`.
5. Turning on NHI from a counted score, and from an exempt assessment that still has a score. Both warn before clearing. After confirmation, Exempt is off and the visible mark is `NHI`.
6. Turning on NHI from a cleared exempt mark (`E`, no score). No warning, and the visible mark becomes `NHI`.
7. Turning on Exempt while NHI is on. NHI turns off. The score stays cleared, so the assessment shows `E` and stays out of averages. No score-clearing warning is required, because the score is already gone.
8. An exempt assessment with adjustments, including a percent that would be above 100% or below 0 for a counted mark. When a score is stored, the greyed percent matches that calculated result and stays out of the roll-up. Adjustments on an exempt assessment with no score still do not create a rolled-up mark.
9. A piece of work, sub-category, category, or course whose every assessment is exempt. The rolled-up percent stays empty, as it does today.
10. Two students with the same score, one exempt and one counted. Only the counted mark appears in the class average and the distribution.
11. The individual report printed in greyscale. Greyed exempt numbers stay distinguishable from counted numbers, a cleared exempt mark still reads as `E`, and both exempt presentations share a background.

## Out of Scope

1. Changing how a not-handed-in mark counts or how `NHI` is shown on the grade table and the individual report.
2. Renaming Exempt to Excused.
3. Changing adjustment maths, category weights, goal marks, or the pass cutoff used by distributions.
4. Adding a new assessment status.
5. Distinguishing a placeholder zero from an entered zero beyond what the behaviour above already requires.
6. Keeping a visible score after the teacher confirms NHI.

## Suggested Improvements

1. **User experience.** Greying is easy to miss, and it can look like a disabled field. Give the exempt state a text cue that does not depend on colour, including for a screen reader and for a printed report. The teacher can then tell an exempt mark from an ordinary one when the numbers are the same.
2. **User experience.** Not handed in hides any score and stores `0`. The same “keep the entered number visible” idea would let a teacher see the score they had in mind while the mark still counts as zero. This was not accepted: confirming NHI clears the score after a warning, and the mark displays as `NHI`.
3. **Technical.** A cleared exempt mark and an entered zero may both be stored as zero. Distinguishing them would let a greyed `0` always mean the teacher entered zero, and `E` always mean the grade was cleared. This was not accepted: empty and zero are both acceptable for a cleared exempt mark.

## Open Questions

None.

## Assumptions

1. “Excused” in issue 35 means the existing Exempt status. The label in the checkbox and elsewhere stays Exempt. “Modifier” means the entered score and Exempt are independent when the teacher uses the checkbox. It does not choose a storage shape; score and status are already separate fields.
2. “Current behaviour” for typing `E` means the grade-table gesture and the `E` presentation that teachers see today. It does not keep a previously entered score. After this change, that gesture clears the grade. Empty or zero storage both satisfy the cleared grade. Scores already stored on exempt rows are shown greyed out.
3. “Contributions to the marks” means the current exclusion from student weighted averages, class work averages, and grade distributions. An exempt assessment with a stored score still has a calculated percent, and that percent is shown greyed out. An exempt assessment with no stored score shows `E`.
4. “The same background” means the exempt background does not depend on whether a score is stored. Not handed in keeps the separate background it has today.
5. Suggested improvements 2 and 3 are not requirements.
6. Clearing a cell still deletes the assessment. Removing Exempt with the checkbox returns the assessment to counted.

## Revision

10 October 2026. Recorded the answers to the three blocking questions. Typing `E` clears the grade and marks the assessment exempt. The assessment editor has an Exempt checkbox, which keeps an entered score and shows it greyed out. An exempt assessment may have no score, stored empty or as zero. The name is Exempt, not a rename to Excused. Earlier statements that marking exempt never clears the score, and that `E` is never shown, are replaced by these two paths. Suggested improvements were not accepted and remain proposals. The placeholder-zero improvement is annotated as not accepted.

10 October 2026. Recorded the follow-up answers. Existing exempt scores display as greyed numbers. Greyed exempt scores and a cleared `E` share one background. The assessment editor has an NHI checkbox beside Exempt; only one can be on. Turning on NHI while a mark exists warns that the score will be cleared, and confirming clears it. Not handed in still displays `NHI` and still counts as zero. Suggested improvement 2 was not accepted.

10 October 2026. Confirmed two assumptions before planning. Unchecking NHI leaves a counted zero. Typing `NHI` in the grade table clears the score immediately and does not open the warning modal.
