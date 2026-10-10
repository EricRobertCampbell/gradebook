# Checklist

Dependencies run top to bottom. The gradebook `excused` fields have to exist before the table can show them. Enrolment deletion can land with the schema, before the modal.

## Main process / database

- [x] Add the `excuses` table to `src/main/database/schema.ts` (one of category or sub-category, cascade from student and from the target, partial unique indexes) and generate the migration with `npm run db:generate`.
- [x] Add `setExcuse` and `setAllExcuses` in `src/main/database/excuses.ts`. Reuse the existing “That student is not in this class.” check. `setAll` uses only the current enrolment list and runs in one synchronous transaction.
- [x] Load excuses in `getClassGradebook` and set work, category, and sub-category `excused` flags. Keep informational work percents. Null a category percent when that category is excused, and a sub-category percent when the sub-category or its parent category is excused. Skip covered work inside `countableWorkAverage`.
- [x] Change `removeStudentFromClass` so a confirmed removal, inside a synchronous `better-sqlite3` transaction, deletes that student’s assessments for the class’s work, then that class’s excuses, then the enrolment. Leave goal marks, other classes, and assessments already left by an earlier removal. Do not delete those old assessments from the migration or from `addStudentToClass`.
- [x] Add database tests for set, clear, set-all, unenrolled rejection, parent excuse surviving a sub-category clear-all, gradebook percents, informational marks, permanent deletion on removal, rollback when the removal transaction throws, and re-enrolment that still shows an assessment left behind before this change.

## Shared contracts

- [x] Add `excuse:set` and `excuse:setAll` to `ipcChannels`, `ipcContracts`, and `src/shared/preload-api.ts`. Extend the gradebook Zod objects with the `excused` booleans.
- [x] Add a shared helper in `src/shared/grades.ts` for “this work counts”, used by the gradebook, `classAverages`, and `countableMarksForWork`. Cover it in `grades.test.ts` and `grade-distribution.test.ts`.
- [x] Add the development paths and PUT routes for category and sub-category excuses, and thread the handlers through `grading-development-api.ts`, `grading-api-handlers.ts`, and the stub in `development-api.test.ts`.
- [x] Register both channels in `src/main/main.ts` and expose them on the preload API.
- [x] Add renderer wrappers in `src/renderer/grading.ts` that use the preload API or the development HTTP API.
- [x] Extend `ipc.test.ts` for the new contracts. Update grade-distribution fixtures so `excused` is present.

## Renderer

- [x] Add `ExcuseIcon` and an excuse button on category and sub-category headers in `ClassGradeTable`, including collapsed headers.
- [x] Add `CategoryExcuseModal`: enrolled students, own-excuse checkbox, Excuse all, Clear all, shared-name full names, and `Excused by ${category.name}` when the parent category covers the student. Save by reloading the gradebook; keep the modal open.
- [x] Render `Excused` on the student category and sub-category summary cells when the matching flag is on, without the work-level exempt colour. Leave the class-average row numeric.
- [x] Make work-column class averages ignore covered work. Leave work cells and the assessment editor on their current behaviour.
- [x] Set `excused: false` on the fallback work-grade objects in the table and in `StudentClassReportPage`. Leave the report’s null category and sub-category percents as a dash.

## Documentation

- [x] Update the grading paragraph in `README.md` for section excuses and for assessment deletion when a student leaves a class.

## Verification

- [x] Run `npm run check`.
