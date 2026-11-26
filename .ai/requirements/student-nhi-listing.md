# Requirements

Source: [GitHub issue 57](https://github.com/EricRobertCampbell/gradebook/issues/57) — “Individual student page: show missing assignments”.

## Objective

On the individual student page, the teacher can see at the top a listing of every piece of work for that student that is marked not handed in (NHI), so those outstanding items are visible without opening each class grade table.

## Background

The teacher uses a local desktop gradebook. Opening a student goes to `#/students/<id>` (`StudentPage`). That page currently shows the student’s details, their enrolled classes (with links into the class, class data, and individual report), and their parents. It does not show marks or not-handed-in work.

A student’s mark on a piece of work is an assessment. Status values in use are `counted`, `exempt`, `nhi`, and `unmarked`. The teacher marks not handed in by typing `NHI` in the class grade table or by checking NHI in the assessment editor. NHI displays as `NHI`, counts as zero percent toward averages, and is treated as something that still needs to be dealt with. Work with no assessment row, and work saved as `unmarked` (a note without a counted mark), is not the same as NHI: those cells are empty or note-only rather than explicitly not handed in.

Each student may be enrolled in several classes across school years. NHI marks are stored per student per piece of work inside those classes. The individual report for one class (`#/<student-id>/<class-id>/individualreport`) already styles NHI work rows, but it is per class and is not the student overview page named in the issue.

Affected user and workflow: the teacher reviewing one student’s outstanding not-handed-in work from that student’s overview before following up or entering a mark.

## Functional Requirements

1. **Requested.** On the individual student page (`#/students/<id>`), the teacher can see a listing of that student’s assessments that are marked NHI.
2. **Requested.** That listing appears at the top of the page (above the existing classes and parents sections).
3. **Implied.** The listing includes every NHI assessment for that student across the classes they are enrolled in.
4. **Implied.** Each entry identifies the piece of work clearly enough that the teacher can tell which assignment it is (at least the work name and which class it belongs to).
5. **Implied.** When the student has no NHI assessments, the page still loads normally; the listing does not invent NHI items.
6. **Implied.** After the teacher changes an assessment away from NHI (or deletes it) and returns to the student page, that work no longer appears in the listing.
7. **Implied.** After the teacher marks a new assessment as NHI and returns to the student page, that work appears in the listing.
8. **Implied.** Assessments that are counted, exempt, or unmarked, and work with no assessment row, are not listed as NHI.
9. **Implied.** The listing is specific to the opened student; other students’ NHI marks do not appear.

## Non-functional Requirements

- The listing uses the same local gradebook data as the rest of the app. No network or sync dependency.
- The student page remains usable offline with the rest of the local data.

## Business Rules

- NHI means an assessment whose status is `nhi` (“Not handed in”). That is the set of “things that need to be dealt with” for this feature.
- Blank grade-table cells (no assessment) and `unmarked` note-only assessments are not NHI and are outside this listing unless a later accepted change expands the definition.
- NHI still counts as zero in grade averages; this feature does not change how NHI affects percents.
- Removing a student from a class removes that student’s assessments for the class, so those NHI items leave the listing with the enrolment.

## Acceptance Criteria

- Given a student enrolled in one class with two pieces of work, when one assessment is NHI and the other is counted, the student page lists only the NHI work.
- Given a student enrolled in two classes, each with one NHI assessment, the student page lists both items, and each item shows which class it belongs to.
- Given a student with no NHI assessments, the student page does not list any NHI items and still shows classes and parents as today.
- Given a student with an NHI assessment, when the teacher changes that assessment to a counted mark and opens the student page again, that work is no longer in the listing.
- Given a student with an NHI assessment, when the teacher deletes that assessment and opens the student page again, that work is no longer in the listing.
- Given two students in the same class with NHI on the same work, opening the first student’s page lists that work for the first student only.
- The NHI listing appears above the Classes section on the student page.
- Work that has no assessment, or that is exempt or unmarked, does not appear in the NHI listing.

## Edge Cases

- Student enrolled in several school years: NHI items from every enrolled class are included unless scoping is decided otherwise in Open Questions.
- Class or work renamed after the NHI mark was saved: the listing shows the current names.
- Student with many NHI items across many classes: every NHI item still appears; order and grouping are not prescribed beyond being a usable listing.
- NHI on work that sits under an excused category or sub-category for that student: the assessment is still NHI and still appears (excusing changes averages, not the stored status).
- Student with no enrolments: no NHI items; the empty classes state remains as today.
- Invalid or missing student id: existing not-found behaviour; no NHI listing is required.

## Out of Scope

- Changing how NHI is entered, stored, or counted in averages.
- Listing blank (unmarked / no assessment) cells as missing work.
- Listing exempt assessments.
- Changing the individual class report’s NHI presentation.
- Editing or clearing NHI from the student page itself (unless accepted later as an improvement).
- A cross-student “all NHI in the gradebook” view.
- Parent-facing or printed views of the NHI listing.

## Suggested Improvements

1. **User experience.** Let the teacher open the class grade table (or the assessment editor) from each NHI entry. Addresses the “need to be dealt with” intent by shortening the path from noticing NHI to entering a mark.
2. **User experience.** When there are no NHI items, show a short empty state (for example “No not-handed-in work”) rather than omitting the section, so the teacher knows the check ran. Addresses ambiguity between “feature missing” and “nothing outstanding”.
3. **User experience.** Group or sort the listing by class, then by work order or assessment date, so a long list remains scannable.
4. **User experience.** Optionally include blank work (no assessment) in a separate “missing” group, distinct from explicit NHI. Addresses the issue title’s “missing assignments” language without conflating blank cells with NHI.
5. **Technical.** Prefer one student-scoped read of NHI assessments over loading every class gradebook on the student page. Addresses cost and complexity as enrolment counts grow, without prescribing the API shape.

## Open Questions

1. **Medium.** Confirm the target page is `#/students/<id>` (`StudentPage`), not the per-class individual report.
2. **Medium.** Which fields must each listing entry show beyond work name and class (school year, category, sub-category, assessment date, weight)?
3. **Medium.** Should the listing cover all enrolled classes across all school years, or only a selected / current school year?
4. **Low.** When there are no NHI items, should the section be hidden, or should an empty state be shown? (Related suggested improvement 2.)
5. **Low.** Must each entry be interactive (navigate or open the assessment), or is a read-only list enough for the first version?
6. **Low.** Preferred order or grouping when many NHI items exist?

## Assumptions

- “Individual student page” means `StudentPage` at `#/students/<id>`, not `StudentClassReportPage`.
- “Assignments marked NHI” means assessments with status `nhi` only, not blank cells or `unmarked`.
- The listing is primarily a read-only summary for the first version; navigation from an entry is a suggested improvement, not a requirement.
- Class display name is enough to disambiguate the class in each entry, with school year included if the same display name could appear in more than one year — exact fields remain an open question.
- Stakeholder wording “things that need to be dealt with” describes why NHI is listed; it does not by itself expand the set beyond NHI.
