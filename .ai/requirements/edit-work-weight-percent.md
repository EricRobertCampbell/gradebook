# Requirements

Source: [GitHub issue 51](https://github.com/EricRobertCampbell/gradebook/issues/51) — “Edit individual work: default percent to 100 and display the percent sign”.

## Objective

When a teacher adds or edits a piece of work, the weight field is clearly a percent: it starts at 100 for new work, and a percent sign is visible next to the value.

## Background

The teacher is the only user. Work is set up as part of the class grading structure: class → category → optional sub-category → work. That structure is edited from the class grade table (header actions that open the structure editor) and from Class settings (assessment setup).

Each category, sub-category, and piece of work has a weight. Sub-category, category, and course percents are weighted averages of the levels below them. Assessment percents on a single piece of work use that work’s weight when rolling up. The stored weight is a relative number: equal weights of `1` or of `100` produce the same averages when every sibling uses the same scale.

Today, when the teacher **adds** a piece of work, the weight field is pre-filled with `1`. The grade-table structure editor labels the field `Weight (%)`. Class settings labels the same field `Weight`. Neither form shows a `%` character beside the input. The grade table header and the individual report already format the saved weight with a trailing `%` (for example `1%`).

Editing an existing piece of work loads the weight that is already stored. The assessment editor (one student’s mark on one piece of work) also has a `Weight (%)` field; that value defaults from the work’s weight when no assessment exists yet. Issue 51 names “edit individual work”, not the assessment editor or category/sub-category editors.

The issue has no body and no comments. The title is the only stakeholder text.

## Functional Requirements

1. **Requested.** When the teacher opens the form to **add** a new piece of work, the weight field starts at `100`.
2. **Requested.** On the form used to add or edit a piece of work, the weight field shows a percent sign with the value so the teacher can see that the number is a percent.
3. **Implied.** When the teacher opens the form to **edit** an existing piece of work, the weight field still shows that work’s stored weight, not a forced `100`.
4. **Implied.** Saving a weight of `100` stores `100` and uses it in weighted averages the same way any other positive weight is used today.
5. **Implied.** The teacher can still enter a weight other than `100` when adding or editing work.
6. **Implied.** Existing pieces of work keep their stored weights until the teacher changes them. Nothing is rewritten only because the create default changed.

## Non-functional Requirements

- The change stays inside the local desktop app. No network or multi-user behaviour is involved.
- Weighted averages and mark maths keep the same meaning: only the create default and how the weight is labelled in the work form change.

## Business Rules

- Weight remains a relative contribution to weighted averages. It is not required to sum to `100` across siblings.
- A create default of `100` instead of `1` does not change how an already-saved weight of `1` is calculated.
- Category and sub-category weights are separate fields unless the human accepts a suggested improvement that extends this behaviour to them.

## Acceptance Criteria

- Opening **Add work** (from the grade table or from Class settings) shows `100` in the weight field before the teacher types.
- That same add/edit work form shows a visible `%` with the weight value (not only the word “percent” or “(%)” in the label).
- Opening **Edit work** for a piece of work whose stored weight is `1` still shows `1`, not `100`.
- Saving a new piece of work without changing the weight stores weight `100`.
- After that save, the grade table header for that work shows the weight with a `%` as it does for other works today.
- A class that already has work with weight `1` is unchanged until the teacher edits those records.

## Edge Cases

- The teacher clears the create default and types another positive weight; that value is what is saved.
- The teacher edits work that already has weight `100`; the field shows `100` and still shows the percent sign.
- Add work from a category and add work from a sub-category both use the `100` default and the percent sign.
- Copying an existing piece of work (where that action exists) is not redefined by this issue; only the blank add-work form is required to default to `100`.

## Out of Scope

- Changing how weighted averages are calculated.
- Migrating existing weights from `1` to `100`.
- Requiring sibling weights to sum to `100`.
- Changing the assessment editor, category editor, or sub-category editor, unless a suggested improvement below is accepted.
- Changing grade-table header or individual-report weight display (those already show `%`).

## Suggested Improvements

- **User experience.** Use the same create default of `100` and the same visible `%` on category and sub-category weight fields. Those forms use the same weight idea and today also start at `1`, so the work-only change leaves the structure editors inconsistent. The outcome is one weight convention for the whole grading structure.
- **User experience.** Show the same visible `%` on the assessment editor’s weight field. That field is already labelled `Weight (%)` and inherits the work weight, but the input itself has no `%`. The outcome is that every weight the teacher types looks like a percent.
- **User experience.** Align Class settings assessment setup with the grade-table structure editor: label the work weight field as a percent and show `%` in the work list meta (it currently says `Weight {n}` with no `%`). The outcome is that Class settings matches what the grade table already shows.
- **Technical.** Keep one shared empty/create default for work weight so the grade-table editor and Class settings cannot drift again after the default moves to `100`. The outcome is a single place to change the create default later.

## Open Questions

1. **Medium.** Should the create default of `100` and the visible `%` apply only to **work**, as the issue title says, or also to **category** and **sub-category** weight fields (see Suggested Improvements)?
2. **Low.** Should the assessment editor’s weight field also show a visible `%`, or is that out of scope for this issue?
3. **Low.** When the teacher **copies** a piece of work, should the copy keep the source weight (current behaviour assumed), with only blank **Add work** defaulting to `100`?

## Assumptions

- “Edit individual work” means the add/edit form for a piece of work in the grading structure, not the per-student assessment editor and not the work data chart page.
- “Percent” in the issue title means the work **weight** field that is already presented as `Weight (%)` in the grade-table structure editor.
- “Default percent to 100” applies when creating new work (the blank form). Edit continues to show the stored value.
- “Display the percent sign” means a visible `%` with the weight value on that form, beyond the `(%)` already in some labels.
- The issue does not ask to change existing stored weights or the maths of weighted averages.
- No implementation approach is mandated by the issue; the title states outcomes only.
