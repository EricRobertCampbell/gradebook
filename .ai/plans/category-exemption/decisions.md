# Decisions

Choices a later reader would otherwise reverse-engineer. Requirements: [`.ai/requirements/category-exemption.md`](../../requirements/category-exemption.md).

## The excuse is its own row

An excuse is the presence of a row in `excuses` for a student and a category, or a student and a sub-category. Turning it on does not change assessment status, score, notes, or adjustments. Turning it off does not restore a snapshot. The assessments saved before and during the excuse are the ones that count again.

This matches the requirement that the usual assessment actions stay available and informational, and that those edits come back into the score.

## Coverage is computed when the gradebook is read

A work is covered when the student’s category excuse is on, or when the student’s sub-category excuse is on for that work’s parent. There is no move-between-parents API today (`updateWork` does not change parent). New work is covered because its parent is excused at read time. Copy does not copy excuse rows.

## Countable checks share one helper

`classAverages` and `countableMarksForWork` repeat the counted-or-nhi rule today. Both must also skip covered work, or an informational counted mark still moves the class average and the work chart. One helper in `src/shared/grades.ts` is the rule. Category and sub-category charts already follow the rolled-up percent, which is null when that section is excused.

## The gradebook carries two different flags

`StudentWorkGrade.excused` means the work is covered and must not count. `StudentCategoryGrade.excused` and `StudentSubcategoryGrade.excused` mean that target’s own excuse is on. The sub-category list needs the own flag to stay off while the parent flag still covers the student. The summary word “Excused” is shown for a sub-category when either flag is on.

## Summary copy and colour

The summary cell says `Excused`. It does not say `E` and does not use `.grade-cell--exempt`. A missing percent stays the em dash from `formatGradePercent`. The class-average row never says `Excused`.

## Header icon and modal

The requirements left the icon and modal as a non-binding suggestion. This plan uses them: an icon on the category and sub-category header opens a modal of checkboxes, with Excuse all and Clear all. That is the smallest existing UI shape (header icon button plus `Modal`) that can list students, toggle one, change all, show parent coverage, and disambiguate names. Work headers do not get the control.

Each toggle saves immediately and reloads the gradebook. The modal stays open.

## Leaving a class deletes assessments and excuses only

`removeStudentFromClass` today deletes only `class_students`, so assessments survive re-enrolment. After this change, a removal permanently deletes that student’s assessments for work in that class. Adjustments cascade with those assessments. Excuse rows for that class are deleted in the same transaction, so a later enrolment does not bring the excuse back.

The three deletes run in one synchronous `better-sqlite3` transaction. The callback is not async. If the enrolment delete does not commit, the assessment delete does not commit either.

The migration does not delete assessments that a past removal left behind. `addStudentToClass` does not delete them either. Enrolling that student again shows those marks. Only a removal performed after this change deletes them, and a further enrolment does not restore that deletion.

Goal marks are not assessments. They stay, including after re-enrolment. The student row and other classes stay.

There is no soft delete and no restore path for a removal performed after this change.
