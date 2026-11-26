# Requirements

GitHub issue: [#62 — Entering grades: notification on unusually high / low marks](https://github.com/EricRobertCampbell/gradebook/issues/62)

## Objective

When a teacher enters a mark that is unusually low or unusually high, the gradebook notifies them so they can catch typos and odd results before moving on.

## Background

The primary user is the teacher using the local desktop gradebook. Mark entry happens on the class page (`#/<school-year-id>/<class-id>`), in the Grades table. Each enrolled student is one row. Across the row are raw mark fields for each piece of work, computed percents, optional goals, and category and course summaries.

A raw mark is typed into a cell and saved when the field blurs (pointer leave, Tab, Enter, or arrow-key move). Emptying a cell clears the mark. Special values `E` (exempt) and `NHI` (not handed in) are also valid. The pencil beside the mark opens the assessment editor, where the same score can be set with date, weight, notes, status, and adjustments.

Today the grade table reports invalid input and save failures through an inline error on the table. There is no check that a counted score is inside the work’s maximum, and any finite number can be stored. Computed percents can therefore sit above 100% or below 0%. Class data, work data, and student class data already show the distribution of countable marks (histogram and raincloud) with a fixed 60% pass cutoff; those views are separate from mark entry and do not warn the teacher while typing.

The issue asks for “maybe some sort of notification” when a mark is unusually low or high, and states that how unusualness is determined is still to be decided. That determination, and whether the notice blocks saving, are open; they are not fixed by this specification.

## Functional Requirements

1. **Requested.** When the teacher enters a mark that is unusually low for that piece of work, the gradebook notifies them.
2. **Requested.** When the teacher enters a mark that is unusually high for that piece of work, the gradebook notifies them.
3. **Implied.** The notification happens in the mark-entry workflow on the class grade table, where raw marks are typed and saved.
4. **Implied.** Unusually low and unusually high are distinct cases: the teacher can tell which kind of unusual mark they entered.
5. **Implied.** Ordinary marks that are not unusually low or high do not trigger this notification.
6. **Implied.** The notification is about an unusual mark value, not about invalid input. Non-numeric values that are not `E` or `NHI` stay invalid as they are today.
7. **Implied.** Special marks that carry no numeric score (`E` with no stored score, and `NHI`) do not count as unusually high or low numeric marks.
8. **Implied.** The rule that decides whether a mark is unusual is the same idea for every class and piece of work; only the data for that work’s marks changes what counts as unusual.
9. **Implied.** After the teacher is notified, they can still keep the mark or change it. The notification does not silently discard the value they typed.

## Non-functional Requirements

1. The notification appears as part of entering marks on the class grade table and does not require leaving that table to understand that the mark is unusual.
2. Mark entry for ordinary marks stays as fast as it is today: saving a typical mark does not add an extra confirmation step.
3. The behaviour uses only data already on the teacher’s machine. It does not send marks elsewhere.

## Business Rules

1. A mark is assessed for unusualness only when it is a numeric score the teacher has just entered (or re-entered) for a student on a piece of work.
2. What counts as “unusually low” or “unusually high” is defined by a single product rule for this feature. That rule is not yet chosen; see Open Questions.
3. Invalid mark text is still rejected. This feature does not replace existing validation.
4. Exempt and NHI semantics stay as they are: they are special statuses, not ordinary counted scores, except where an exempt assessment still stores a greyed numeric score for display.

## Acceptance Criteria

1. Entering an unusually low numeric mark on the class grade table produces a notification that the mark is unusually low.
2. Entering an unusually high numeric mark on the class grade table produces a notification that the mark is unusually high.
3. Entering a mark that is not unusual produces no unusual-mark notification.
4. Entering `E` (with no score) or `NHI` produces no unusual-mark notification.
5. Entering invalid mark text still shows the existing invalid-input behaviour and does not show an unusual-mark notification instead.
6. After an unusual-mark notification, the teacher can leave the value as entered or change it to another value.
7. The teacher can tell from the notification whether the mark was flagged as low or as high.

## Edge Cases

1. First counted mark on a piece of work: with no other students’ marks yet, “unusual relative to the class” may be undefined. Behaviour for a thin sample is an open question.
2. Every student has the same mark: nothing may be statistically unusual. Behaviour when the class has no spread is an open question.
3. A score above the work’s maximum (for example 15 when the work is out of 10) produces a percent above 100%. Whether that alone is “unusually high” is an open question.
4. A negative score produces a percent below 0%. Whether that alone is “unusually low” is an open question.
5. Re-entering the same unusual mark after it is already saved: whether the notification fires again is an open question.
6. Editing the score in the assessment editor rather than the grade-table cell: whether the same notification applies is an open question.
7. An exempt assessment with a stored greyed score: whether changing that greyed number can trigger the notification is an open question.
8. Clearing a mark (emptying the cell) is not entering an unusually high or low mark and does not use this notification.
9. Very small classes (for example two or three countable marks) may make peer-based unusualness noisy or meaningless. Thresholds for a usable sample are an open question.

## Out of Scope

1. Choosing the concrete statistical or threshold rule for “unusual” until the open questions are answered (the issue leaves that TBD).
2. Changing how marks are stored, how percents and averages are calculated, or how `E` and `NHI` work.
3. Replacing or redesigning the class data / work data / student class data distribution charts.
4. A general toast or notification system for unrelated events.
5. Confirming before clearing a mark (separate backlog item in the product README).
6. Blocking invalid marks beyond the validation that already exists.
7. Parent- or student-facing alerts; this product is teacher-local only.

## Suggested Improvements

1. **User experience.** Treat a raw score above the work’s maximum, or below zero, as always worth a notice, even before a peer-based unusualness rule exists. Those values are common typo shapes (extra digit, wrong column) and already produce odd percents; a clear maximum-based cue would catch many mistakes without waiting on class statistics.
2. **User experience.** Keep the notice advisory: save the mark and warn, rather than forcing a confirm dialog on every unusual value. Grade-table entry is keyboard-driven and already blurs to save; a blocking step would slow ordinary marking more than a non-blocking cue.
3. **User experience.** Show the cue on or beside the cell that was just edited, distinct from the table’s existing error display, so an unusual mark is not mistaken for a failed save.
4. **Technical.** If peer-based unusualness is chosen later, reuse the same countable-mark set the distribution views already use (`counted` and `NHI`, excluding exempt and missing). That keeps “unusual on entry” aligned with what the teacher already sees on class data.
5. **Technical.** If a spread-based rule is chosen, the raincloud already uses quartile fences (1.5×IQR style) for whiskers. Aligning “unusual” with that idea would match an existing product notion of extreme marks, instead of inventing a second scale.
6. **User experience.** Apply the same notice when the score is saved from the assessment editor, so editing via the pencil cannot bypass the cue the grade table would have shown.
7. **User experience.** Once a peer-based rule exists, say briefly why the mark was flagged (for example relative to the class for that work, or above the maximum), so the teacher can judge whether to keep it.

## Open Questions

1. **High.** How is “unusually low” / “unusually high” determined? Options include (non-exhaustive): fixed percent bands; distance from the class mean or median; Tukey-style fences on that work’s marks; always flagging scores outside 0…maximum; or a combination. The issue leaves this TBD and planning cannot pick a rule without an answer.
2. **High.** Is the notification advisory (mark saves, teacher is warned) or interrupting (teacher must confirm or change the value before it sticks)?
3. **Medium.** Does the same behaviour apply when the score is saved from the assessment editor, or only from the grade-table cell?
4. **Medium.** What happens when there are too few countable marks on that work to judge unusualness (including the first mark)?
5. **Medium.** Should a score outside 0…maximum always notify, independently of any peer-based rule?
6. **Low.** If the teacher re-focuses and blurs an already-saved unusual mark without changing it, does the notification fire again?
7. **Low.** Should an exempt greyed score be eligible for the unusual-mark notification?

## Assumptions

1. “Entering grades” means the class grade table mark-entry workflow. That is the only place raw marks are typed in bulk today.
2. The stakeholder’s “maybe some sort of notification” is a soft product ask for a teacher-visible cue, not a mandate for a particular UI widget (toast, modal, inline banner, or cell state). The form is left for planning once the High open questions are answered.
3. “Unusually” refers to the mark on that piece of work in that class, not to the student’s course average or to marks in other classes.
4. This is not a bug fix; there is no incorrect behaviour to reproduce—only a missing cue during mark entry.
5. Suggested improvements above are non-binding until accepted. None of them are functional requirements yet.
