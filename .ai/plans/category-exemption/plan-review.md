# Plan Review

Reviewed against `.ai/requirements/category-exemption.md`, the plan directory, `README.md`, and the grading, enrolment, IPC, and report code the plan cites. Findings in the research notes match the code: `updateWork` does not change a work’s parent, `removeStudentFromClass` deletes only the enrolment row, adjustments cascade from assessments, and the countable check is duplicated in `countableWorkAverage`, `classAverages`, and `countableMarksForWork`.

## Blocking Issues

None.

## Important Issues

### Synchronous deletion transaction

The plan tells `removeStudentFromClass` to do its three deletes inside `db.transaction`. This process uses `better-sqlite3`. Its transactions are synchronous. The only transaction in the repo is `sqlite.transaction` in `ensureStructureSortOrder`. Drizzle’s better-sqlite3 `db.transaction` callback must return a value, not a Promise. The surrounding enrolment code is `async` and `await`s every query, so the natural transcription throws, or, if the transaction is then dropped, the three deletes commit one by one.

That breaks the reason the transaction is there: a failed enrolment delete must not leave the assessments already gone.

`setAllExcuses` has the same shape. A loop of inserts can excuse half the class if a later insert throws.

The plan should say to use a synchronous transaction, the same kind as `ensureStructureSortOrder`, for both the removal and `setAllExcuses`. The removal test should force a failure after the assessment delete and assert that the assessments, excuses, and enrolment are unchanged.

### Re-enrolling a student who already left

`removeStudentFromClass` today leaves assessments in place. The plan deletes them on future removals, and the compatibility section says an existing database keeps the same assessments. Together, that means a student who was removed before this change still has marks. Enrolling them again shows those marks. The requirement says enrolling them again does not restore the assessments.

The plan should choose one behaviour and name it:

- Delete, in the generated migration or at the start of `addStudentToClass`, assessments whose student is not enrolled in the class that owns the work. Adjustments cascade. Excuses do not exist yet. Goal marks stay. Re-enrolment then cannot restore old marks, including for someone who left before the upgrade. This deletes data on upgrade for removals that, at the time, kept the marks.
- Or keep those existing rows, and state that only a removal performed after this change deletes them. Re-enrolling someone who left earlier still shows the old marks.

Do not leave the choice implicit. The first option matches “I don’t care about the ability to restore them” for data already sitting in the file. The second option avoids a silent delete on upgrade.

## Generalization Opportunities

### Recommended

`goal-marks.ts` and `requireWorkInClass` in `grading-structure.ts` both reject a student who is not enrolled, with the same message. `setExcuse` needs that check again. Use one shared enrolment check rather than a third copy. It is the same rule, the same error text, and a small move.

### Not Recommended

A move-between-parents API, so the “work moved in or out” acceptance line can be exercised. Nothing in the product changes a work’s parent. Coverage at read time already makes a future move follow the excuse. Adding a move feature is a separate product change.

A general “targets that can be excused” framework that also covers the course column. The requirements leave the course out of scope. `goal_marks` is the schema pattern to copy, not a new abstraction over it.

## Questions

Should an upgrade delete assessments that already belong to a student who is not enrolled in that class? See the re-enrolment issue above. That choice changes the migration and the removal tests. It should be settled before implementation.

## Suggested Changes

`StudentClassReportPage` builds two fallback work grades and prints category, sub-category, and work percents from the gradebook. The plan names the two fallbacks in `ClassGradeTable` and not these. Once `excused` is required on `StudentWorkGrade`, the report fallbacks have to grow that field or `npm run check` fails. The report’s category and sub-category rows will show a dash when the percent is null. The requirements ask for the word `Excused` on the grade table, not on this report. Say that in the plan so the dash is a choice rather than an oversight. Work rows on the report should keep showing the stored assessment, as the grade-table work cells do.

The development routes `excuses` and `excuses/all` share a prefix. The existing `idPath` matcher must try `excuses/all` before `excuses`, or clear-all never runs.

## Missing Tests

The planned database tests cover the forward path: set, clear, averages, distributions, and a successful removal across two classes. They do not cover a removal that fails after the assessment delete. Without that, the transaction can be dropped and the suite still passes. That can hide the partial delete. Add it once the synchronous transaction is in the plan.

Add a test for whichever orphan rule is chosen: a student with an assessment and no enrolment, then either the migration or `addStudentToClass` removes those assessments, or re-enrolment still returns them.

No renderer test is warranted. This repo does not test components, and the score rules sit in the gradebook and distribution tests.

## Positive Findings

The excuse is a row of its own, so assessment edits stay stored and count again when the excuse is cleared. That matches the requirement and avoids a snapshot.

Putting `excused` on the gradebook, and one countable helper in `src/shared/grades.ts`, keeps the table, the class-average row, and the work chart on the same rule. Category and sub-category charts already follow the rolled-up percent.

The own-excuse flag is kept separate from “this work is covered”, which is what the sub-category checkbox and the parent-coverage label need.

IPC, preload, the development HTTP API, and parse-out of the new gradebook fields are all in the plan. Copy is correctly left alone. Goal marks are explicitly kept. The summary word `Excused` is distinct from `E` and from the dash.

## Recommendation

Revise the plan. The approach is sound. Settle the synchronous transaction, and settle what happens to assessments already left behind by a removal, before implementation. Do not treat this review as approval.

## Resolution

The plan was revised after this review. A removal deletes that class’s assessments inside a synchronous `better-sqlite3` transaction. Assessments already left by an earlier removal stay in the database, and enrolling that student again shows them. The plan is Draft again until it is approved.
