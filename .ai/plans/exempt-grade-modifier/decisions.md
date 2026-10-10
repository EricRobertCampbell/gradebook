# Decisions

## Cleared marks store a null score

Requirements allow a cleared grade to be stored empty or as zero, and they also require an entered exempt zero to appear greyed out. Those two displays can be told apart only when “no score” is not the number zero.

`assessments.score` becomes nullable. Typing `E`, confirming NHI, and saving Exempt with a blank score write `null`. An entered number, including `0`, stays that number. Existing rows already have a non-null score, so they show greyed numbers without a data rewrite. A historical exempt `0` therefore shows as a greyed zero; that matches the requirement that stored exempt scores are shown.

Counted marks still require a finite score. Unchecking NHI, so that neither checkbox is on, writes status `counted` and score `0`. Checking Exempt while NHI is on is a different gesture: NHI turns off, the score stays `null`, and the mark shows `E`.

## Status stays a single enum

Exempt and NHI remain `exempt` and `nhi` on `assessments.status`. The editor checkboxes map onto that field: Exempt on, NHI on, or neither (`counted`). The database cannot store both. The status dropdown in the assessment editor is removed so it cannot disagree with the checkboxes.

## The warning is confirm/cancel, not type-to-confirm

`ConfirmDeleteModal` asks the teacher to type a name. This warning only needs a confirm and a dismiss. Build it on the existing `Modal`. Confirming clears the score and selects NHI. Dismissing, including Escape, leaves the form as it was.

## Grey text is separate from the exempt background

`grade-cell--exempt` and `individual-report-work--exempt` stay the background for both a greyed score and `E`. A second class greys the score and percent text only when a number is shown. `E` and `NHI` keep their current text treatment. NHI keeps `grade-cell--nhi` and `individual-report-work--nhi`.

## One display helper

`src/shared/grades.ts` decides whether a surface shows `E`, `NHI`, or a number. The grade table and the individual report both call it. The same module decides the grade-table commit so the existing early returns cannot skip a clear or force a greyed score back to counted. The editor uses that status-and-score result after its own warning.
