# Requirements

Source: [GitHub issue 50](https://github.com/EricRobertCampbell/gradebook/issues/50) — “Individual student report: make it more compact when printed”.

## Objective

When a teacher prints an individual student report, the printed page uses less empty space so more of the grade table fits on each sheet, while the report still shows the same student, class, and mark content it shows today.

## Background

The teacher uses a local desktop gradebook. For one enrolled student in one class, the individual report lives at `#/<student-id>/<class-id>/individualreport` (`StudentClassReportPage`). The teacher opens it from the class grade table or from the student’s class list, then uses **Print report**, which calls the browser or Electron print dialog.

The printed page already hides chrome that is only useful on screen: the app bar, development banner, print button, student-class-data link, and back links. What remains is the report heading (student name, optional full name, class and school year) and a table of categories, sub-categories, works, weights, scores, maxima, percents, and a course total. Category notes, work notes, and adjustment details still appear under the relevant names. Student assessment notes do not appear on this report.

On screen and in print today, the table uses a modest body size (`0.86rem`) with cell padding around `0.45rem` by `0.55rem`. The page heading still uses the global large `h1` and `lede` spacing. Existing `@media print` rules for this page adjust borders and preserve row colours; they do not reduce type size or spacing. For a class with many units of work, that leaves large unused regions on the printed sheet and pushes later rows onto further pages.

## Functional Requirements

1. **Requested.** When the teacher prints the individual student report, the printed layout is more compact than today’s printout: less empty space between and around the report content.
2. **Implied.** The printed report still identifies the student and the class (and school year) so the teacher can tell whose report it is.
3. **Implied.** The printed report still shows the same grading structure and mark fields as today: categories, sub-categories, works, weights, scores, maxima, percents, and the course total, including status presentation for exempt and not-handed-in work.
4. **Implied.** Category notes, work notes, and adjustment details that appear on the report today still appear after the change, unless a later accepted improvement removes them from print.
5. **Implied.** Compactness applies to the printed output. The teacher can still open and read the report on screen.
6. **Implied.** Navigation and print controls that are already hidden when printing stay hidden when printing.
7. **Implied.** No change to how marks, weights, or percents are calculated or stored.

## Non-functional Requirements

- The printed report remains readable as plain printed text on a typical A4 or Letter page from the app’s print dialog.
- The change stays in the local desktop app. Printing still uses the existing print dialog; no remote print or export service is required.
- On-screen use of the rest of the gradebook is unaffected.

## Business Rules

- The individual report is one student’s results for one class. Compact print does not change which student or class is shown.
- Student assessment notes remain off this report (see student-assessment-notes requirements).
- Percent and weight figures on the report stay the values the gradebook already computes.

## Acceptance Criteria

- Given an individual report that today prints with large unused vertical space in the table and heading, when the teacher prints after this change, that empty space is reduced so more rows fit on the first printed page than before for the same class structure and paper size.
- The printed page still shows the student identity and the class (with school year) for that report.
- The printed table still includes every category, sub-category, and work row that appears on screen for that class, with the same weight, score, maximum, percent, and course total values as on screen.
- Exempt and not-handed-in rows still appear with their current status presentation on the printed page.
- Category notes, work notes, and adjustment details that show on the report today still show on the printed report.
- Chrome that is already omitted from print (app bar, print button, data link, back links, development banner) remains omitted.
- Marks and course averages in the gradebook are unchanged after viewing or printing the more compact report.

## Edge Cases

- A short report (few works) still prints correctly; compactness must not clip or overlap heading and table content.
- A long report (many categories and works, or long notes under work names) still prints all rows; compactness reduces empty space but does not drop rows.
- A student whose display name differs from their full name still shows both where the report shows both today.
- Exempt scores that are greyed on screen remain distinguishable on the printed page in the same way as today.
- Printing with no marks yet (structure only, dashes for empty scores) still produces a compact, complete structure table.

## Out of Scope

- Changing which data belongs on the individual report (for example adding student assessment notes, or redesigning columns).
- Changing on-screen grade table, class data, or student class data pages.
- PDF export, email, or any delivery outside the local print dialog.
- Changing mark calculation, exemptions, or enrolment rules.
- A user-facing “compact vs comfortable” print density setting, unless accepted later as an improvement.

## Suggested Improvements

1. **Technical.** Apply the denser type and spacing only under print media, and leave the on-screen report at roughly today’s size. That keeps the screen readable for review while still fixing the wasted paper the issue describes.
2. **User experience.** Also tighten the printed heading (smaller title and less space under the class line), not only the table cells. The global `h1` / `lede` spacing is a large share of the empty region above the table.
3. **User experience.** Offer a print option that omits category notes, work notes, and adjustment detail lines so a marks-only sheet is shorter. Default would stay “include notes” unless the teacher chooses otherwise.
4. **Technical.** Add print page-break hints so a category block is less likely to split awkwardly across sheets once rows are denser.

## Open Questions

1. **Medium.** Should the on-screen individual report also become denser, or only the printed output? The issue title names printing; the body does not say the screen must change.
2. **Medium.** Is “more compact” satisfied by denser type and spacing alone, or is there a target such as fitting a typical class on one page?
3. **Low.** Are long note lines under works expected to wrap more tightly as well, or is cell and heading spacing the only concern?

## Assumptions

- The primary user is the teacher printing for their own records or to hand to a student or parent from a local printer.
- “More compact when printed” means less unused space on the printed sheet for the same content, not fewer columns or a different report.
- Stakeholder suggestion (non-binding): achieve compactness by decreasing font size and spacing. The mandatory outcome is a denser printed layout; the exact sizes and which spacing tokens change are left to planning.
- Paper size is whatever the teacher chooses in the print dialog; the app does not need a fixed page size.
- Existing print colour behaviour (row backgrounds and header contrast) can stay unless compactness forces a readability trade-off that planning calls out.
