# Requirements

Source: [GitHub issue 52](https://github.com/EricRobertCampbell/gradebook/issues/52) — “Edit individual work: default the date to the date created”.

## Objective

When a teacher adds or edits a piece of work and the date field is empty, show today’s date as a suggestion. Leaving the field untouched keeps the saved date blank; focusing the field adopts today’s date as the entered value.

## Background

The teacher uses a local desktop gradebook. A piece of work is one graded item under a category or sub-category. Teachers create and edit work from two places that share the same fields: class assessment setup (`#/<school-year-id>/<class-id>/settings`) and the grade-table structure editor opened from a work column header on `#/<school-year-id>/<class-id>`.

The work form includes an optional Date field labelled `Date (YYYY-MM-DD)`. Today that field starts empty for a new work, and empty or with the stored date when editing. The visible placeholder is the format hint `YYYY-MM-DD`. Saving with an empty date stores no work date. The work date, when set, appears next to the work name in assessment setup and in the grade-table work header.

Separately, each student’s assessment has its own date. Opening the assessment editor for a mark already fills that assessment date with today when none is stored. That assessment date is required for a counted mark and is not the subject of this request.

## Functional Requirements

1. **Requested.** When the teacher opens the work form and the date field has no stored value, today’s date is shown as a suggestion (placeholder), not as the field’s entered value.
2. **Requested.** If the teacher saves without interacting with the date field, the work is saved with a blank date.
3. **Requested.** If the teacher focuses the date field while it is still empty, the field’s value becomes today’s date (YYYY-MM-DD).
4. **Implied.** After that focus fills the value, saving without further edits stores that date on the work.
5. **Implied.** The teacher can still clear the date, type a different date, or leave the suggested value, and save that choice.
6. **Implied.** When the work already has a stored date, the form shows that date as the value. Today’s date is not shown as a suggestion in place of it.
7. **Implied.** The same date suggestion behaviour applies wherever the teacher adds or edits a piece of work (class assessment setup and the grade-table structure editor).
8. **Implied.** A blank work date remains optional. Percent calculations and marks do not require a work date.

## Non-functional Requirements

- The suggestion is visible in the empty date field without requiring the teacher to open help or documentation.
- Focusing the empty field and adopting today’s date works with keyboard focus as well as pointer focus, so keyboard-only teachers get the same outcome.
- Work date storage stays local with the rest of the gradebook data.

## Business Rules

- A work date is optional. Empty means no date on that piece of work.
- Empty string and null both mean no work date after save.
- The assessment date on a student’s mark is separate from the work date and is unchanged by this behaviour.
- “Today” is the calendar date on the teacher’s machine when the empty field receives focus (or when the suggestion is shown, for the placeholder text).

## Acceptance Criteria

- Given the teacher opens Add work with an empty date field, the field shows today’s date as a suggestion and the entered value is still empty.
- When the teacher fills name, maximum score, and weight, leaves the date field untouched, and saves, the new work has no date.
- When the teacher opens Add work, focuses the empty date field, then saves without changing that value, the work’s date is today’s date in YYYY-MM-DD form.
- When the teacher edits a work that already has a date, that stored date is shown as the value; focusing the field does not replace it with today.
- When the teacher edits a work with no date, the empty-field suggestion and focus-to-fill behaviour match Add work.
- The behaviour is the same from class assessment setup and from the grade-table structure editor.
- After a focus fill, the teacher can clear the date and save; the work then has no date.

## Edge Cases

- The teacher focuses the empty date field, then clears it before saving: the work is saved with no date.
- The teacher focuses the empty date field, then types a different valid date: that typed date is saved.
- The teacher tabs through the empty date field without intending to set a date: focus still fills today’s date; clearing before save is required if they want blank.
- The form is opened just before midnight and focused just after: the filled value is the date at the moment of focus.
- An invalid date string the teacher types is rejected by existing validation; this request does not change the YYYY-MM-DD rule.

## Out of Scope

- Changing how assessment (per-student mark) dates default or validate.
- Making the work date required.
- Changing where the work date is displayed after it is saved.
- Native date-picker controls, unless chosen later as an implementation detail.
- Copying work, reordering work, or any other work action beyond the date field on add/edit.

## Suggested Improvements

1. **User experience.** After focus fills today’s date, offer an explicit clear control or make Escape clear an untouched auto-filled date, so keyboard Tab through the field does not force a date the teacher did not want. Addresses the edge case where focus alone commits the suggestion into the value.
2. **User experience.** Align the assessment editor’s date behaviour with this suggestion pattern (optional blank until focus), or document why assessment dates stay required and pre-filled, so teachers are not surprised by two different date defaults. Addresses inconsistency between work date and assessment date.
3. **Technical.** Share one “empty date suggests today on focus” helper used by both work editors, so class settings and the grade-table editor cannot drift. Addresses duplicated form behaviour already present in two components.

## Open Questions

1. **Medium.** The issue title says “date created”; the body says “today’s date”. Confirm that the suggestion is always the current calendar day on the teacher’s machine, not a stored creation timestamp for the work row (works have no creation-date field today).
2. **Medium.** Confirm that focusing the empty field (including Tab) should fill the value, or that only a pointer click should. The body says “click into”; keyboard focus is assumed above for accessibility.
3. **Low.** Confirm create and edit-with-blank-date both get this behaviour. The title says “Edit individual work”; the empty-field case on Add work is assumed to be included.

## Assumptions

- **Assumption.** “Date created” in the title means today’s date as the natural default when creating or first dating the work, not a persisted `createdAt` column.
- **Assumption.** Both Add work and Edit work (when the date is blank) are in scope; Edit work with an existing date keeps showing that date.
- **Assumption.** Both UI entry points (assessment setup and grade-table structure editor) are in scope.
- **Assumption.** “Click into the field” means the field receiving focus, including keyboard focus.
- **Suggestion (non-binding, from stakeholder).** Show the default as suggestion/placeholder text rather than as a pre-filled value so untouched saves stay blank. Recorded as Functional Requirements 1–3 because the issue states this as the desired outcome, not merely an optional idea.
