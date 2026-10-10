# Requirements

GitHub issue: [#36 — Ability to excuse a section or subsection](https://github.com/EricRobertCampbell/gradebook/issues/36)

## Objective

A teacher can excuse a grading category, or a single sub-category, for one student in a class. While that excuse is on, work in it stays editable and visible, and it has no numerical effect on that student’s score. Turning the excuse off makes the stored assessments count again.

## Background

The teacher uses the class grade table at `#/<school-year-id>/<class-id>` to enter marks. Grading is organised as class → category (unit) → sub-category → work. A category can also hold work directly, beside its sub-categories.

A student’s mark on one piece of work is an assessment with status `counted`, `exempt`, or `nhi` (not handed in). The teacher can already mark one piece of work exempt by typing `E` in the mark cell or by choosing Exempt in the assessment editor. An exempt assessment shows `E`, is left out of weighted averages, and is left out of distribution charts. Not-handed-in counts as zero. A blank cell is missing: it also drops out of the average, and it shows an empty mark rather than `E`. The assessment editor can also change the score, date, weight, and notes, and an assessment can have raw and percent adjustments.

Category, sub-category, and course percents are weighted averages. Items with no countable percent are dropped, and the remaining weights are used for that student. The class-average row is the mean of the students who have a percent. A category or sub-category summary with no countable percent shows a dash, the same dash as a student who has no marks yet.

Category and sub-category column headers already carry actions for edit, add work, collapse, and goal. The graph icon is on work headers, and it opens that work’s distribution. Category and sub-category distributions appear on the student and class data views, and they include only countable percents. Student lists elsewhere show the preferred name, or otherwise the first name, and show the full name beside it when that full name is different.

This request is about the category and the sub-category. The class record also has a section field (the teaching group). That field is not part of this request.

## Functional Requirements

1. **Requested.** For one student enrolled in a class, the teacher can excuse that student’s category, and can excuse that student’s sub-category.
2. **Requested.** The teacher can turn that excuse off again for the same student and the same category or sub-category.
3. **Requested.** The teacher can see which enrolled students are excused, and can change that set, from the category header and from the sub-category header on the class grade table.
4. **Requested.** While a category is excused for a student, work that belongs to that category has no numerical effect on that student’s score. That includes work placed directly on the category and work placed in any of its sub-categories. The work does not change that student’s sub-category percent, category percent, or course percent, and it does not add that student to a distribution that uses that percent.
5. **Requested.** While a sub-category is excused for a student, work that belongs to that sub-category has no numerical effect on that student’s score. Work elsewhere in the parent category is unchanged and still counts under the normal rules.
6. **Requested.** While an excuse covers a piece of work, the teacher can still do the usual assessment actions on it: enter or clear a mark, set not handed in, set exempt, and edit the score, date, weight, notes, and adjustments. Those values are saved and shown on the work. They are informational while the excuse covers that work.
7. **Requested.** Turning the excuse off makes the stored assessments count again under the normal rules. A counted mark counts, not handed in counts as zero, a work-level exemption stays out of the average, and adjustments apply. This includes marks that were already stored before the excuse and edits made while the excuse was on. The excuse does not clear them, leave them forced exempt, or revert them to a snapshot from the moment the excuse was turned on.
8. **Requested.** The excuse belongs to the student and the category or sub-category. Turning it on or off does not replace that student’s score, status, notes, or adjustments on any piece of work. Work added to an excused category or sub-category is covered for that student with no further action. Work moved into it becomes covered. Work moved out of it is no longer covered by the excuse it left.
9. **Requested.** The grade table shows the excuse on that student’s category summary when the category is excused, and on that student’s sub-category summary when the sub-category is excused. A sub-category summary also shows the excuse when the parent category is excused for that student. The indication is distinct from a work-level Exempt mark (`E`) and from the dash used when a percent is missing.
10. **Requested.** The teacher can excuse every enrolled student in one action, and can clear every enrolled student in one action, for that category or that sub-category.
11. **Requested.** The student list for a category or sub-category shows each enrolled student’s display name (preferred name, otherwise first name). When two enrolled students would show the same display name, each also shows their full name when that full name differs from the display name. The list is ordered by last name, then first name.
12. **Requested.** On the sub-category student list, a student already covered by a parent category excuse is shown as covered by that category. The teacher can still set or clear the sub-category’s own excuse. Clearing the sub-category excuse, including clearing every student, does not clear the parent category excuse.
13. **Implied.** An excuse on a category still removes the numerical effect of work inside a sub-category when that sub-category’s own excuse is off.
14. **Implied.** The excuse applies only to the chosen student, the chosen category or sub-category, and the class that owns that category. Other students, other categories, and the student’s other classes stay as they are.
15. **Implied.** Students who are not enrolled in the class cannot be excused from that class’s categories, and they are not listed.
16. **Implied.** The work cell keeps showing the assessment the teacher saved, including its mark, not-handed-in or exempt code, percent, and adjustments. That display is informational while an excuse covers the work.
17. **Implied.** Goal marks, category weights, and sub-category weights are unchanged. Adjustments stay stored. They do not affect averages while an excuse covers the work, and they apply again when no excuse covers it.
18. **Implied.** For work that no category or sub-category excuse covers, counted marks, not-handed-in marks, work-level exemptions, and adjustments behave as they do today.
19. **Requested.** Removing a student from a class permanently deletes that student’s assessments for work in that class. Enrolling them again does not restore those assessments.
20. **Implied.** Adjustments on those assessments are deleted with them. Excuses for that student’s categories and sub-categories in that class are deleted too, and they do not return on a later enrolment. The student record, that student’s other classes, and goal marks stay.

## Non-functional Requirements

1. **Implied.** The excuse is stored in the local gradebook and is still there after the app restarts.
2. **Implied.** A database created before this behaviour still opens. Export and import of the whole gradebook database still succeed for databases created before and after this behaviour.
3. **Implied.** Only the enrolled students of that class are shown for that category or sub-category. The control does not expose students from other classes.

## Business Rules

- While a category or sub-category excuse covers a piece of work, that work contributes nothing to the student’s sub-category, category, or course percent, whether the stored assessment is counted, not handed in, exempt, or missing.
- When no excuse covers the work, exempt work does not count, not-handed-in counts as zero, counted marks count, and missing marks drop out of the average.
- Weighted averages ignore items with no countable percent and use the remaining weights. Excusing a category therefore removes that category’s weight from that student’s course percent. Excusing a sub-category removes that sub-category’s weight from that student’s category percent.
- A stored assessment is independent of the excuse. The excuse does not rewrite the assessment, and the assessment’s own status does not turn the excuse on or off.
- A category belongs to one class. Excusing it does not follow the student into another class.
- Removing a student from a class deletes their assessments for that class’s work. There is no archive and no restore on a later enrolment.
- The class section field is a label on the class, not a grading category or sub-category.

## Acceptance Criteria

- From a category header, the teacher can excuse one enrolled student and leave the others unchanged. That student’s existing marks, not-handed-in marks, work-level exemptions, blanks, notes, and adjustments remain stored and visible. None of that work changes the student’s category percent, course percent, or the related distributions. The category summary shows the excuse, and that indication is distinct from `E` and from a dash.
- From a sub-category header, the teacher can excuse one enrolled student. Only work in that sub-category loses its numerical effect. Sibling sub-categories and work directly on the category keep their existing numerical effect. The sub-category summary shows the excuse.
- While the excuse is on, the teacher can enter a mark, replace it, clear it, set not handed in, set exempt, and edit the assessment’s date, weight, notes, and adjustments. After each action the work cell shows the saved assessment, and the category, sub-category, and course percents are unchanged by it.
- Turning the excuse off makes those stored assessments count again. A counted mark saved before or during the excuse counts. Not handed in counts as zero. A work-level exemption stays out. Adjustments apply. Nothing is restored from a snapshot taken when the excuse was turned on.
- A piece of work created in an excused category or sub-category is covered for each excused student without the teacher marking that piece of work. Its cells stay blank until the teacher enters an assessment. An assessment entered there is visible and has no numerical effect while the excuse remains.
- A piece of work moved into an excused category or sub-category becomes covered for each excused student, and its stored assessment stays as it was. A piece of work moved out is no longer covered by the excuse it left, and its stored assessment counts again under the normal rules.
- With one category excused and another category still counted, the student’s course percent matches the weighted average of the categories that still have a countable percent.
- With one sub-category excused and other work in the category still counted, the student’s category percent matches the weighted average of the remaining countable items. The excused sub-category’s own summary shows the excuse rather than a percent.
- A category excuse still removes the numerical effect of a sub-category’s work after that sub-category’s own excuse is cleared. The sub-category student list shows that the parent category covers the student.
- The teacher can excuse every enrolled student in one action, and clear every enrolled student in one action. Students enrolled afterwards are not excused by an earlier “everyone” action. Clearing every sub-category excuse leaves a parent category excuse in place.
- The class-average row ignores a student with no countable percent for that column and still includes students who have one.
- When two enrolled students would show the same preferred or first name, the student list shows each student’s full name as well when it differs from the display name.
- A student enrolled only in another class is not listed and is not excused.
- An existing database with counted, exempt, and not-handed-in marks opens unchanged until the teacher sets an excuse. Typing `E` on a piece of work that is not covered by an excuse still exempts only that piece of work.
- Restarting the app, exporting the database, and importing that export keep the same students excused and keep the same stored assessments.
- Removing a student from a class deletes their assessments, adjustments, and excuses for that class only. Their assessments in another class remain. Enrolling them in the class again does not bring the deleted assessments or excuses back.
- An assessment that is already stored for a student who is not enrolled stays stored. The upgrade does not delete it. Enrolling that student again shows it. A removal after this change is what deletes it.

## Edge Cases

- The category has no work and no sub-categories, or the sub-category has no work. The teacher can still excuse and clear it. Summaries show the excuse. There is no assessment to change until work is added.
- The category is collapsed, or the sub-category is collapsed. The header action is still available.
- The class has no enrolled students. The action is still available and lists nobody. Excusing everyone and clearing everyone are available and change nobody.
- Before the excuse, the same student has a mix of counted marks, not-handed-in marks, single-work exemptions, blanks, and adjustments. While the excuse is on, all of that remains visible and has no numerical effect. During the excuse the teacher changes one mark, sets another to not handed in, and adds an adjustment. Those edits remain. When the excuse is turned off, the edited values count under the normal rules, and the untouched values count as they were.
- The teacher sets a work-level exemption while a category excuse covers that work, then clears the category excuse. The work stays exempt and still has no numerical effect, because its own status is exempt.
- The category is excused and one of its sub-categories is also excused. Clearing only the sub-category excuse leaves the category excuse in force, so that sub-category’s work still has no numerical effect. The sub-category list still shows the parent coverage.
- Clearing the category excuse while a sub-category excuse remains leaves that sub-category’s work without numerical effect and releases the rest of the category.
- Every enrolled student is excused. The category or sub-category distribution has no countable marks. The class average for that column is blank. Each excused student’s summary shows the excuse.
- Only some students are excused. The class average and the distribution use the other students’ countable percents. Excused students’ informational marks are excluded.
- The student is removed from the class after this change. Their assessments, adjustments, and excuses for that class are gone. Goal marks for that class remain. Enrolling them again starts with no assessments and no excuses. Their other classes are unchanged. A student who was already removed keeps any assessments that removal left behind, and enrolling them again shows those assessments.
- The category, sub-category, work, or student is deleted. Excuses that can no longer apply are gone with it. Deleting the work deletes its assessment, as it does today.
- Two enrolled students share a display name and have different full names. The student list shows both full names. Two students who also share a full name are listed separately by that same name.
- The teacher excusing a category does not change the category weight, the sub-category weights, or anyone’s goal mark.
- An assessment weight or adjustment edited while the excuse is on has no numerical effect until the excuse no longer covers that work. It then applies with the other stored assessment values.

## Out of Scope

- Excusing the whole course, the whole class, or every category at once.
- A new way to exempt one piece of work. That already exists.
- Changing how a counted, not-handed-in, or single-work exempt mark is calculated when no category or sub-category excuse covers it.
- Goal marks, category weights, and the class section field.
- Parents, school years, and enrolments, except that an excuse only applies to a current enrolment and that leaving a class deletes that class’s assessments and excuses.
- Restoring assessments, adjustments, or excuses after a student has been removed from a class by this change.
- Deleting assessments that a removal had already left behind before this change.
- Deleting or restoring goal marks when a student leaves a class.
- Rewriting or snapshotting assessments when an excuse is turned on or off.

## Suggested Improvements

1. **User experience.** Mark a work cell’s percent as informational while a category or sub-category excuse covers it. The cell still shows the saved assessment, so a teacher can read a percent that is not part of the course score and mistake it for one that counts. The category and sub-category summaries show the excuse; the work cell does not.

## Open Questions

None. Leaving a class permanently deletes that student’s assessments for the class, and a later enrolment does not restore them or their excuses.

## Assumptions

- “Section” in the issue means a grading category, and “subsection” means a sub-category. It does not mean the class section field.
- A category or sub-category excuse is separate from a work-level Exempt mark. Teacher-facing copy for this feature follows the issue and says “excuse”. The existing work-level mark stays “Exempt” and `E`.
- The teacher is the only user, and the data stays in the local database.
- **Non-binding suggestion.** The issue asks for an icon beside the existing header actions (add work, graph, and the others). That icon would open a modal listing the students in the class, with a checkbox for whether each student is excused. Category and sub-category headers do not have a graph icon today; the graph icon is on work headers. This interaction is not a requirement. The requirement is that the teacher can view and change the excused students from those headers, including the bulk actions, the shared-name labels, and the parent-category coverage.

## Change note

Updated after review. Turning an excuse off brings the stored assessments back into the score, including counted marks and not-handed-in marks. While an excuse is on, the usual assessment actions remain available and are informational: they do not change the score. The excuse is not stored by rewriting each assessment to exempt.

Accepted suggestions are now requested requirements: show the excuse on the grade-table summary, keep that indication distinct from a work-level `E`, keep the excuse on the student and the category or sub-category, count the stored assessments again when the excuse is cleared (including edits made while it was on, with no snapshot revert), excuse or clear every enrolled student in one action, show a distinguishing full name when display names collide, and show parent-category coverage on the sub-category student list. The class-wide action is no longer out of scope. The two High questions are resolved. Re-enrolment remains a Low question and does not block planning.

Updated again before planning. Leaving a class permanently deletes that student’s assessments for the class’s work, and the adjustments on them. Excuses for that class are deleted as well. Enrolling the student again does not restore the assessments or the excuses. Goal marks are left as they are.

Updated after the plan review. A removal after this change deletes that class’s assessments. Assessments already left by an earlier removal stay, and enrolling that student again shows them. The upgrade does not delete those rows.
