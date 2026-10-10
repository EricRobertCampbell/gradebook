# Findings

Research for excusing a grading category or sub-category for one student, and for deleting that student’s class assessments when they leave the class. Requirements: [`.ai/requirements/category-exemption.md`](../../requirements/category-exemption.md).

## Product behaviour today

The class grade table is `ClassGradeTable` at `#/<school-year-id>/<class-id>`. Grading is class → category → sub-category → work. A category may also hold work directly. The schema enforces that a work has exactly one parent (`works_one_parent` in `src/main/database/schema.ts`).

A mark is an `assessments` row keyed by work and student. Status is `counted`, `exempt`, or `nhi`. The teacher sets that on the mark cell (`E`, `NHI`, or a number) or in `GradeAssessmentModal` (score, date, weight, status, notes, adjustments). Clearing the cell deletes the assessment. Adjustments belong to an assessment and cascade-delete with it.

`buildStudentRow` in `src/main/database/gradebook.ts` turns those rows into percents:

- A work percent is the adjusted score over the maximum. Not handed in is zero. A missing assessment has a null percent.
- `countableWorkAverage` keeps a work only when its status is `counted` or `nhi`. Exempt work drops out.
- Sub-category, category, and course percents are `weightedAverage` over the remaining items. Null percents and non-positive weights are dropped, and the remaining weights are renormalised.
- The class-average row is a mean of those student percents (`classAverages` in `ClassGradeTable.tsx`). For work columns it repeats the counted-or-nhi check itself, instead of reading a flag from the gradebook.

Distribution charts use `src/shared/grade-distribution.ts`. Category, sub-category, and course charts use the rolled-up percent, so a null percent already omits the student. Work charts call `countableMarksForWork`, which keeps any counted or not-handed-in assessment that has a finite percent. An excused-but-counted mark would still enter that chart unless this check learns about the excuse.

Category and sub-category headers already render `HeaderLabel` actions: collapse, edit, add, and goal. The graph icon is only passed for work headers (`dataHref` / `GraphIcon`). There is no excuse control.

Student lists elsewhere (`StudentsPanel`, `ClassSettingsPage`) show `personDisplayName` (preferred name, otherwise first name) and `personDistinctFullName` when the full name differs. Enrolment order is last name, then first name (`listStudentsForClass`).

## What does not exist

There is no excuse table and no per-student category flag. Excusing a section cannot be represented by writing `exempt` onto assessments: the teacher must still edit those assessments, and clearing the excuse must make the stored status count again.

`updateWork` changes name, notes, date, maximum, and weight. It does not change `categoryId` or `subcategoryId`. Reorder only changes `sortOrder`. Copy creates new category, sub-category, and work rows and does not copy assessments. “Work moved into an excused section” is therefore a rule about whichever parent the work has when the gradebook is built, not a move API to hook.

`removeStudentFromClass` deletes the `class_students` row and nothing else. Assessments have no foreign key to the enrolment, so they remain. Re-enrolling the same student shows the old marks. Goal marks also remain, because they are keyed by student and target, not by enrolment. Deleting the student, the class, the category, or the work does cascade to assessments.

## Patterns to reuse

IPC is untrusted. `registerIpcHandler` Zod-parses input and output from `ipcContracts` in `src/shared/ipc.ts`. The renderer calls `window.gradebook` only. WSL uses the development HTTP API, which must gain the same operations. The chain for a grading mutation is:

`src/shared/ipc.ts` → `src/shared/preload-api.ts` → `src/preload/preload.ts` → `src/main/main.ts` → database function

and, for the browser fallback:

`src/renderer/grading.ts` → `src/shared/development-api.ts` → `src/main/grading-development-api.ts` → `gradingApiHandlers`

`setGoalMark` is the closest mutation. It checks that the target exists and that the student is enrolled in the owning class (`requireEnrolled` in `src/main/database/goal-marks.ts`), and it rejects with “That student is not in this class.”

`goal_marks` is also the schema pattern to copy: one nullable target column, a check that exactly one target is set, and partial unique indexes per target. An excuse has no numeric value; the row’s presence is the flag. Cascades already used on that table (student, category, sub-category) match this feature: deleting a student, category, or sub-category should remove excuses. Deleting an enrolment will not, so `removeStudentFromClass` has to delete them itself.

`GradebookDatabase` is Drizzle’s `BetterSQLite3Database`. The only transaction in the repo is synchronous: `sqlite.transaction` in `ensureStructureSortOrder`. `better-sqlite3` rejects a transaction callback that returns a Promise, so `await db.transaction(async ...)` is the wrong call. Runtime turns foreign keys on after migrations (`src/main/database/client.ts`). A new table should come from `npm run db:generate`, not a hand-written migration. Latest migration is `drizzle/0010_goal_marks.sql`. The migration must not delete assessments. A student who was removed before this change still has those rows, and enrolling them again shows them.

The gradebook response is the document the table and the charts already share. Adding `excused` there avoids a second fetch and lets `countableMarksForWork` and `classAverages` see coverage without joining the database again.

UI conventions: named exports, `Array<T>`, no `as` except `as const`, conditional render with `condition ? node : null`, colocated CSS, British English. Modals use `Modal` (`role="dialog"`, Escape to close, focus restore). Icon buttons are small SVGs with `aria-hidden` and an `aria-label` on the button, styled by `icon-button.css` / `grade-header-edit`. There is no checkbox component; a native checkbox inside a label is enough.

`formatGradePercent(null)` renders an em dash. That is the same glyph as “no marks yet”, so the summary must branch on the excuse flag before formatting the percent. Work-level exempt renders the letter `E` and uses `.grade-cell--exempt` (warning mix). The section excuse must not reuse that letter or that class.

## Calculation change

For each student and category, load whether an excuse row exists. Then:

- A work is covered when its category is excused, or when its sub-category is excused.
- Covered work still has its stored assessment and its informational percent (`buildWorkGrade` stays as it is).
- Covered work is omitted from `countableWorkAverage`, even when status is `counted` or `nhi`.
- A sub-category percent is null when the sub-category or its parent category is excused. Otherwise it is the weighted average of its uncovered countable work.
- A category percent is null when the category is excused. Otherwise it is the weighted average of its sub-category percents and its uncovered direct work.
- Course percent is already the weighted average of category percents, so a null category percent drops that weight.

Own-excuse flags on the category and sub-category grades must stay distinct from “covered”. The sub-category student list has to show a parent excuse while the sub-category’s own checkbox is off. The renderer can read the parent flag from the enclosing category grade.

The class-average row for a work column must use the same covered check. Category and sub-category class averages already average the rolled-up percents, so a null percent is enough there.

## Leaving a class

`removeStudentFromClass` should, in one synchronous `better-sqlite3` transaction, after it has confirmed the enrolment:

1. Delete that student’s assessments whose work belongs to the class (category work and sub-category work). Adjustments cascade.
2. Delete that student’s excuses whose category or sub-category belongs to the class.
3. Delete the `class_students` row.

Other classes, the student row, and goal marks stay. `addStudentToClass` only inserts the enrolment, so a later enrolment does not recreate assessments or excuses that this removal deleted. Assessments that a removal had already left behind stay in the file. Enrolling that student again shows them. The migration does not delete them.

Work belongs to the class when `works.category_id` is one of the class’s categories, or `works.subcategory_id` is one of those categories’ sub-categories.

## Tests and fixtures that will feel this

- `src/main/database/gradebook.test.ts` builds a class, assessments, and expected percents. New cases belong here for coverage, informational percents, and averages.
- `src/main/database/enrolments.test.ts` only checks the enrolment row. It needs a case with assessments in two classes.
- `src/shared/grade-distribution.test.ts` builds `StudentWorkGrade` objects with `goalMark`. A new required `excused` field will fail those literals and the IPC parse of a gradebook that omits it.
- `src/shared/grades.test.ts` is the place for a shared “does this work count?” helper.
- `src/shared/ipc.test.ts` covers contracts.
- `src/main/development-api.test.ts` builds a stub `GradingDevelopmentApiHandlers`. New handler fields are required on that stub.
- `ClassGradeTable.tsx` has two fallback `workGrade` objects (missing index). They must include `excused: false` once the type requires it.

No renderer component test runner is in use. Gradebook and distribution tests are the behavioural net. `npm run check` is the verification command.

## Architecture constraints

From `README.md`: renderer → typed IPC → main → Drizzle → SQLite. No generic SQL. No Node in the renderer. Schema changes go through Drizzle Kit. Tests use in-memory SQLite. Import checks that a file is SQLite and contains `app_metadata`, `school_years`, or `__drizzle_migrations`; it does not require a fixed table list. Startup runs pending migrations, so an older file gains the new table empty.

There is no `readme/adr/` or `readme/architecture/` directory.

The unaccepted suggestion (mark the work-cell percent as informational) is not part of this work. The work cell keeps today’s mark, code, percent, and adjustment marker.
