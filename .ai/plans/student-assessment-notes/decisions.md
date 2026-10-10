# Decisions

Choices for the student assessment note plan. The requirements file does not choose these mechanisms.

## Note-only rows use status `unmarked`

A note with no counted mark is the same assessment row, with `status` set to `unmarked` and `score` null. Date and weight stay on the row. A null score is not a mark. `0` remains a real counted or exempt score, so an unmarked row must not store it.

`unmarked` has no grade-table code, does not count toward averages, and produces a null percent. `assessmentCountsTowardAverage` stays false for it. A new helper, `assessmentHasVisibleMark`, is true only for `counted`, `exempt`, and `nhi`.

This needs no schema migration. `status` is unconstrained text, and existing rows keep their current status.

The assessment editor keeps the Exempt and Not handed in checkboxes. Neither box ticked means the mark is counted. An empty score in that state means there is no mark yet. The editor stores `unmarked` with a null score in that case. Reopening an `unmarked` row shows an empty score and neither box ticked, so the teacher can type a mark without learning a fourth status.

An unmarked upsert is rejected when its effective note is empty. The effective note is the supplied note when the caller sends one, otherwise the stored note. Omitting notes on an existing note-only row keeps that note.

## Emptying a counted mark is `clearAssessmentMark`

`deleteAssessment` still deletes the row. The grade table stops calling it.

`clearAssessmentMark` takes the work id, the student id, and optional note, date, and weight overrides. The result is `{ kept: boolean }`.

The note used for the empty check is the override when the caller sends `notes`, otherwise the stored note. Both are trimmed.

- When the stored status is `counted`, `exempt`, or `nhi`, it deletes that assessment’s adjustments. An empty note deletes the assessment. A note sets `unmarked`, stores a null score, and keeps the note, date, and weight.
- When the stored status is already `unmarked` and the note is empty, it deletes the assessment and its adjustments.
- When the stored status is already `unmarked` and the note is not empty, it updates the note, date, and weight, keeps the score null, and leaves adjustments in place.
- When no assessment exists, it throws “That assessment was not found.” It does not create a row.

When adjustments are removed, that delete and the assessment update or delete run in one transaction. If the assessment write fails, the adjustments stay with the mark.

The grade table calls it with no overrides when a counted, exempt, or not-handed-in cell is emptied. An empty cell whose assessment is already `unmarked` does not call clear on blur.

## The editor follows the checkboxes

Neither Exempt nor Not handed in means the mark is counted. Reopening an `unmarked` row shows an empty score and neither box ticked. Reopening an exempt row shows the stored score, including `0`, and Exempt ticked. An empty exempt score saves `exempt` with a null score, which clears a previously stored exempt score.

The score field is not HTML-required just because neither box is ticked. The browser must allow a note-only submit to reach the handler.

- Not handed in always saves `nhi` with a null score, even when the score box is empty. That save does not call `clearAssessmentMark`.
- Exempt saves `exempt` and keeps the score in the box. An empty box saves a null score. That save does not call `clearAssessmentMark`.
- A counted score saves `counted` and leaves adjustments in place.
- An empty counted score, no row, and a note creates `unmarked` with a null score.
- An empty counted score, no row, and no note is rejected with “Enter a mark.”
- An empty counted score and an existing row calls `clearAssessmentMark` with the form’s note, date, and weight. An empty note deletes the row.

## The note marker does not show the note text

The mark cell shows a marker when `notes.trim()` is non-empty. The marker is not the adjustment asterisk. Its accessible text is “Note for {work name}”. The mark input points at that text with `aria-describedby`. The note text stays in the assessment editor.

## Report and trimming

The individual report stops appending `assessment.notes`. Category notes, work notes, and adjustment details stay.

Upsert `notes`, when present, uses `z.string().trim()`. Omitted `notes` still means “keep the stored note” on update and `""` on insert. A whitespace-only note is stored as `""`. The grade-table marker uses the trimmed text, including notes saved before this change.
