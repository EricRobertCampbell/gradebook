# Plan

Status: Done

Approved 2026-10-10. Implementing from 2026-10-10. Done 2026-10-10.

Revised after review. A removal deletes that student’s assessments for the class inside a synchronous transaction. Assessments left by a removal that already happened stay in the database.

## Objective

Let a teacher excuse a category, or a single sub-category, for students in a class. Covered work stays editable and visible, and it drops out of that student’s score and out of distributions. Turning the excuse off makes the stored assessments count again.

Removing a student from a class permanently deletes their assessments for that class’s work, and their excuses for that class. Enrolling them again does not restore either.

## Scope

- Persist an excuse as a row for one student and one category, or one student and one sub-category.
- Set or clear it per enrolled student, and excuse or clear every currently enrolled student in one action, from the category and sub-category headers.
- Show the excuse on the grade-table summary, distinct from a work-level `E` and from a missing percent.
- On the sub-category list, show when the parent category already covers the student, without clearing that parent excuse.
- Disambiguate students who share a display name.
- Exclude covered work from sub-category, category, course, and class averages, and from distribution charts, while still returning the stored assessment and its informational percent.
- Delete that class’s assessments (and their adjustments) and excuses when the student is removed. Leave goal marks, the student, and other classes alone.

## Out of scope

- Excusing the course, every category, or a single piece of work by a new control. Work-level Exempt stays as it is.
- Changing weights, goal marks, or the class section field.
- Copying excuses when a category, sub-category, or work is copied.
- A work-move API. Coverage is derived from the work’s current parent.
- Restoring assessments or excuses after removal.
- Deleting goal marks on removal.
- Marking the work-cell percent itself as informational. That remains the open suggestion in the requirements file.
- Any archive or undo of the deleted assessments.

## Architectural approach

Store the excuse separately from the assessment. `buildStudentRow` already decides what counts. Teach it, and the two other countable checks (`classAverages`, `countableMarksForWork`), to skip work covered by an excuse. Do not write `exempt` onto assessments when the excuse is turned on, and do not snapshot them.

Put the shared countable rule in `src/shared/grades.ts` so the main process, the grade table, and the charts cannot drift.

The gradebook payload carries the flags the UI needs:

- `StudentWorkGrade.excused` — this work is covered by its category or its sub-category.
- `StudentCategoryGrade.excused` — this category’s own excuse is on.
- `StudentSubcategoryGrade.excused` — this sub-category’s own excuse is on.

A sub-category summary shows “Excused” when its own flag is on or the parent category flag is on. The checkbox for the sub-category reads only its own flag. Parent coverage is a label beside that checkbox.

Adopt the issue’s header control: an icon button on the category and sub-category `HeaderLabel`, opening a `Modal` of enrolled students with a checkbox each, plus Excuse all and Clear all. That is the chosen UI, recorded in `decisions.md`. The graph icon stays on work headers only.

Removal stays inside `removeStudentFromClass`. The assessment delete, the excuse delete, and the enrolment delete run in one synchronous `better-sqlite3` transaction, so a failure rolls all three back. `setAllExcuses` uses the same kind of transaction.

## Affected systems

- SQLite schema and generated migration
- Gradebook assembly and enrolment removal
- IPC, preload, and the development HTTP API
- Class grade table, a new excuse modal, and distribution helpers
- README grading paragraph

## Affected files and modules

- `src/main/database/schema.ts`, `drizzle/` (generated)
- `src/main/database/excuses.ts` (new) and `excuses.test.ts`
- `src/main/database/gradebook.ts`, `gradebook.test.ts`
- `src/main/database/enrolments.ts`, `enrolments.test.ts`
- `src/shared/grades.ts`, `grades.test.ts`
- `src/shared/grade-distribution.ts`, `grade-distribution.test.ts`
- `src/shared/ipc.ts`, `ipc.test.ts`
- `src/shared/preload-api.ts`, `src/shared/development-api.ts`
- `src/preload/preload.ts`
- `src/main/main.ts`
- `src/main/grading-api-handlers.ts`, `src/main/grading-development-api.ts`
- `src/main/development-api.test.ts` (handler stub)
- `src/renderer/grading.ts`
- `src/renderer/components/ClassGradeTable.tsx`, `ClassGradeTable.css`
- `src/renderer/components/CategoryExcuseModal.tsx`, `CategoryExcuseModal.css` (new)
- `src/renderer/components/common/icons/ExcuseIcon.tsx` (new)
- `src/renderer/StudentClassReportPage.tsx` (fallback work grades must include `excused`; category rows keep the dash from a null percent)
- `README.md` grading paragraph

## Data changes

New `excuses` table, shaped like `goal_marks` without a value column:

- `student_id` not null, cascade delete from `students`
- `category_id` nullable, cascade delete from `categories`
- `subcategory_id` nullable, cascade delete from `subcategories`
- Check that exactly one of `category_id` and `subcategory_id` is set
- Partial unique indexes on `(student_id, category_id)` and `(student_id, subcategory_id)`

Generate the migration with `npm run db:generate`. Existing databases gain an empty table on next launch. No assessment rows are rewritten.

## IPC / contract changes

Add two channels, both Zod-parsed in and out:

- `excuse:set` — `{ categoryId } or { subcategoryId }`, `studentId`, `excused`. Exactly one target. Result `{ excused: boolean }`.
- `excuse:setAll` — the same target, plus `excused`, and no student id. Result `{ excusedStudentIds: Array<number> }`.

Reject a student who is not enrolled in the class that owns the target, with the existing “That student is not in this class.” `setAll` applies only to students enrolled at that moment. Excuse-all inserts a row per enrolled student. Clear-all deletes rows for that target. A student enrolled later is not excused by an earlier excuse-all.

Extend the gradebook schemas with the three `excused` booleans above. Parse-out will reject a gradebook that omits them, so every builder and every test fixture must send them.

Development HTTP, used by the WSL browser fallback:

- `PUT /api/categories/:id/excuses` and `PUT /api/categories/:id/excuses/all`
- `PUT /api/subcategories/:id/excuses` and `PUT /api/subcategories/:id/excuses/all`

Match `excuses/all` before `excuses` in the `idPath` router, or clear-all never runs.

Wire the handlers through `gradingApiHandlers` and the preload `gradebook.excuses` namespace. The renderer wrapper in `grading.ts` follows `setGoalMark`: preload when present, otherwise the development API.

## Renderer changes

Add an excuse icon button to category and sub-category headers, including when the column is collapsed. `aria-label`: `Excuse students for ${name}`.

`CategoryExcuseModal` lists enrolled students in gradebook order (already last name, then first name). Each row is a checkbox labelled with `personDisplayName`. When two listed students share that display name, also show `personDistinctFullName` when it is non-null. The checkbox is the target’s own excuse. For a sub-category, a student whose category excuse is on also shows `Excused by ${category.name}`. Excuse all and Clear all call `setAll`. Each change waits for `onChanged` to reload the gradebook; the modal stays open. Failures use the table’s existing error display.

Summary cells (`CategoryCells` and `SubcategoryCells`, collapsed and expanded) render the word `Excused` when the relevant flag is on, instead of `formatGradePercent`. Do not use `.grade-cell--exempt`. The class-average row keeps numeric percents and dashes.

Work cells are unchanged: mark, `E`, `NHI`, informational percent, adjustments, and the assessment editor all keep working. `classAverages` must ignore `workGrade.excused` when averaging work columns.

The two fallback work-grade objects in the table, and the two in `StudentClassReportPage`, must set `excused: false`. The report keeps showing a dash for a null category or sub-category percent. It does not need the word `Excused`. Its work rows keep showing the stored assessment.

## Main-process and database changes

`setExcuse` inserts or deletes one row. It reuses the existing enrolment check that rejects with “That student is not in this class.”, rather than copying that check a third time. `setAllExcuses` replaces the excused set for that target with either every current enrolment or nobody, inside one synchronous transaction.

`getClassGradebook` loads excuses for the class’s categories and sub-categories with the other gradebook queries, and applies the coverage rules in Architectural approach. Informational work percents still come from `buildWorkGrade`.

`removeStudentFromClass` confirms the enrolment, then runs the rest in a synchronous `better-sqlite3` transaction (`db.$client.transaction`, the same kind as `sqlite.transaction` in `ensureStructureSortOrder`). The callback must not be async. Do not call `await db.transaction(async ...)`. `better-sqlite3` rejects a transaction function that returns a Promise, and an async callback would commit before the later deletes finish.

Inside that transaction:

1. Delete assessments for that student on work in the class (category work and sub-category work).
2. Delete excuses for that student on categories and sub-categories in the class.
3. Delete the enrolment.

If any step throws, the transaction rolls back, so the assessments are still there when the student is still enrolled. Adjustments disappear with the assessments through the existing foreign key. Goal marks are not deleted. `addStudentToClass` does not delete assessments.

Category and sub-category delete already cascade from those tables, so their excuses go with them once the foreign keys exist. Student delete already cascades assessments and will cascade excuses. Copy stays a new structure with no excuse rows.

## Testing strategy

Database tests against in-memory SQLite:

- Set, clear, and set-all. Reject a student who is not enrolled. Clear-all on a sub-category leaves the parent category excuse. A student enrolled after excuse-all is not excused.
- Category excuse: stored assessment unchanged; category and course percents ignore it; informational work percent still present; a later counted edit stays stored and still does not count; clearing the excuse makes that stored mark count.
- Sub-category excuse leaves sibling work and direct category work counting. Parent excuse still covers the sub-category after the sub-category excuse is cleared.
- Not-handed-in under an excuse contributes nothing, and contributes zero after the excuse is cleared.
- Work-level exempt stays exempt after the section excuse is cleared.
- New work in an excused category is covered. Because work cannot be reparented, assert coverage from the parent the work is created under rather than a move.
- `removeStudentFromClass` deletes this class’s assessments, adjustments, and excuses, keeps another class’s assessment, and a later `addStudentToClass` does not restore them. Goal mark for the removed class is still present.
- A thrown error inside the removal transaction leaves the assessments, the excuses, and the enrolment as they were.
- An assessment that already belongs to a student who is not enrolled is left in place by the migration and by `addStudentToClass`. Enrolling that student again shows that assessment. A removal after this change is what deletes it.
- Distribution: a counted mark under an excuse is absent from the work chart. A category chart omits a student whose category percent is null.

Shared tests for the countable helper and the new IPC schemas. Update `grade-distribution` fixtures and the development-api handler stub so they compile with `excused` and the new handlers.

`npm run check` (typecheck, lint, test).

## Migration and backwards compatibility

`npm run db:generate` after the schema edit. Commit the generated SQL and journal. The migration adds `excuses` and does not delete assessments. Startup migrates older files; import does not need a new table-name allow list. Databases created before this feature open with no excuses and the same assessments, including assessments whose student is no longer enrolled. Removing a student after this change deletes that class’s assessments. A removal that already happened is left as it is.

## Security considerations

Payloads stay on the Zod contracts. The handler resolves the class from the category or sub-category and checks enrolment before writing. `setAll` never accepts a caller-supplied student list. No SQL is assembled from renderer text. Excuses are local gradebook data, same as marks.

## Observability and analytics

No new telemetry. Distribution charts change only by omitting covered work and null rolled-up percents.

## Deployment considerations

The migration ships in `drizzle/` with the app, like the existing grading migrations. No installer change.

## Relevant architecture docs and ADRs

`README.md` Architecture, Databases, and Stack. No ADR directory. The grading paragraph in `README.md` should say that a category or sub-category excuse drops that work out of the averages without changing the stored assessment, and that removing a student from a class deletes their assessments for that class.

## Open questions

None that change this approach. The work-cell informational styling suggestion is recorded in the requirements and is not part of this plan.

## Assumptions

- “Section” and “subsection” are the category and the sub-category.
- Teacher-facing copy for this feature says “excuse” / “Excused”. Work-level status stays “Exempt” / `E`.
- Goal marks are intentionally kept when a student leaves a class.
- The header icon and modal are the chosen presentation of the student list. They were a non-binding suggestion in the requirements; this plan adopts them.
