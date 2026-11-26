# Requirements

Source: [GitHub issue 47](https://github.com/EricRobertCampbell/gradebook/issues/47) — “Individual student report - "Print" has interactive ui components”.

## Objective

When a teacher prints an individual student report, the printed page shows only the report content. Interactive chrome used to navigate or trigger printing does not appear on the printed page.

## Background

The teacher uses a local desktop gradebook. The individual report at `#/<student-id>/<class-id>/individualreport` shows one student’s results for one class: student name, class and school year, and the assessment table (weights, scores, maximums, percents).

On screen the page also offers:

- A **Print report** button that calls `window.print()`
- A link to the student’s class data chart page (graph icon)
- Back links to the class and to the student
- The global app bar (product title and Database operations gear)
- In development, a development-mode banner

Printing uses the browser or Electron print dialog from that page. Global print styles in `App.css` already try to hide `.app-bar`, `.dev-banner`, and any element with the `no-print` class. The report actions and back links are marked `no-print`.

## Root Cause

Reproduced from the current source and the issue screenshot (Print report control and graph icon still visible above the report table).

1. `StudentClassReportPage` wraps the graph link and **Print report** button in `className="individual-report-actions no-print"`.
2. `App.css` defines `@media print { .no-print { display: none; } }` so those controls should disappear when printing.
3. `StudentClassReportPage.css` defines `.individual-report-actions { display: flex; }` outside any print media query. That stylesheet is loaded after `App.css` when the report page mounts.
4. In print media both rules apply to the same element and have equal specificity (one class each). The later `display: flex` rule wins, so the actions stay visible on the printed page.

The app bar is not affected the same way: its screen `display: flex` and print `display: none` both live in `App.css`, and the print rule comes later in that file. Back links use `no-print` and have no competing `display` rule, so they hide as intended.

## Functional Requirements

1. **Requested.** When the teacher prints the individual report, the **Print report** control does not appear on the printed page.
2. **Implied.** When the teacher prints the individual report, other on-page controls that only exist to navigate or operate the app (graph / student-class-data link, back links) do not appear on the printed page.
3. **Implied.** When the teacher prints the individual report, global chrome that is not part of the report (app bar, development banner when present) does not appear on the printed page.
4. **Implied.** The printed page still includes the report heading content that identifies the student, class, and school year, and the assessment table with its scores and percents.
5. **Implied.** On screen, before printing, the teacher can still use Print report, the graph link, back links, and the app bar as today.

## Non-functional Requirements

- Print behaviour works in the packaged Electron app and in the development browser fallback, because both use the same renderer print styles and `window.print()`.
- Hiding print-only chrome does not change mark calculation or stored data.

## Business Rules

- The individual report’s printable content is the student/class identity and the grade table for that enrolment.
- Controls that start printing, open other pages, or manage the app are for the teacher’s screen session, not for the paper or PDF output.

## Acceptance Criteria

- Given an individual report with a loaded student row, when the teacher prints (or opens print preview), the **Print report** button is not visible on the printed page.
- In that same print output, the graph / student-class-data control is not visible.
- In that same print output, the back links to class and student are not visible.
- In that same print output, the app bar (and development banner, when the build shows it) is not visible.
- In that same print output, the student name, class and school year labelling, and the assessment table remain visible with the same marks and percents as on screen.
- On screen, with print preview closed, Print report, the graph link, back links, and the app bar remain available and usable.

## Edge Cases

- Printing while the report is still loading: loading text is not an interactive control; it may appear if the teacher prints before data arrives. Empty or error states may print the error message; interactive recovery controls, if any, must not print.
- A report that has no student row (not enrolled / not found): print chrome that is not shown on screen stays absent; any `no-print` controls that are on screen still must not print.
- Very long tables that paginate: hiding chrome must not clip or omit table rows that belong on later printed pages.

## Out of Scope

- Changing the on-screen layout of the individual report except as needed so print hiding works.
- A separate “print layout” page or PDF export pipeline.
- Printing a whole class’s reports in one action.
- Changing which grade fields, notes, or status codes appear in the report table (covered by other issues).
- Print styling of colours, page size, margins, or headers/footers beyond hiding non-report chrome.

## Suggested Improvements

1. **Technical.** Add a regression check that print styles actually hide the report action chrome (for example a CSS or component test that evaluates computed `display` under print media). The current bug is an equal-specificity cascade miss that typecheck and ordinary unit tests would not catch.
2. **User experience.** Give printed pages a clear document title (student and class) in the print header/footer or browser tab title so paper copies stay identifiable when the on-screen eyebrow or chrome is gone.
3. **Technical.** Audit other teacher-facing pages that might later call `window.print()` so shared print-hide conventions stay stronger than ordinary layout `display` rules.

## Open Questions

1. **Low.** Should the on-screen eyebrow text “Individual report” remain on the printed page, or is student / class / school year enough? The issue only asks to remove interactive controls.
2. **Low.** Should print preview hide the loading and error messages as well, or only interactive controls? The issue examples are buttons and similar controls.

## Assumptions

- “Printed report” means the output of the existing **Print report** control (`window.print()` / system print preview), including saving as PDF from that dialog.
- The issue screenshot shows the failing print (or print preview) output: Print report and the graph control remain visible above the table.
- App bar and development banner are already intended to be non-printing; keeping that behaviour is part of the implied fix surface, not a new product ask.
- No change to IPC, database, or mark maths is required for this issue.
