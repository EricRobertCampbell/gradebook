# Requirements

Source: [GitHub issue 53](https://github.com/EricRobertCampbell/gradebook/issues/53) — “Navigation items: place at the top of the page as well”.

## Objective

On pages that already show a group of page-navigation links at the bottom, the teacher also sees that same group at the top of the page, so they can leave or move to a related screen without scrolling to the bottom.

## Background

The primary user is the teacher using the local desktop gradebook. After opening a class, student, settings screen, data view, or individual report, they often need to move back up the hierarchy or across to a related view (for example class ↔ student ↔ individual report).

Today those destinations are offered as a row of text links at the foot of the page (the shared `back-link` pattern). Examples include “Back to class · Back to student” on the individual report, “Back to class · Back to student · Individual report” on student class data, and single “Back to …” links on school year, class, student, settings, and database screens.

The individual report is a long, printable table. The bottom links sit under the Course total row. On a tall report the teacher must scroll past the whole table to reach them. The issue’s screenshot shows that bottom link row on the individual report.

Some of the same pages also have a separate heading-action area (for example Print report and the student class-data icon on the individual report, or class data and settings icons on the class page). Those heading actions are not the bottom link row the issue highlights.

Pages that currently end with this bottom navigation link group:

| Page | Bottom links today |
| --- | --- |
| School year | Back to gradebook |
| School year settings | Back to school year |
| Class | Back to school year |
| Class settings | Back to class |
| Class data | Back to class |
| Work data | Back to class · Class data |
| Student | Back to gradebook |
| Student settings | Back to student |
| Student class data | Back to class · Back to student · Individual report |
| Individual report | Back to class · Back to student |
| Database | Back to gradebook |

The home page has no bottom page-navigation link group.

## Functional Requirements

1. **Requested.** Every page that currently shows a page-navigation link group at the bottom also shows that same group at the top of the page.
2. **Requested.** On the individual student report, the top of the page includes “Back to class” and “Back to student”, matching the links already at the bottom.
3. **Implied.** Top and bottom groups on a given page offer the same destinations, with the same link labels, in the same order.
4. **Implied.** The bottom group remains; this change adds the top group rather than moving the only copy.
5. **Implied.** Activating a link in the top group navigates to the same place as the matching link in the bottom group.
6. **Implied.** The top group is available once the page has loaded enough to know those destinations (the same conditions under which the bottom group is shown today).
7. **Implied.** On the individual report, the top navigation group is omitted from print output, as the bottom group already is.
8. **Implied.** Heading-only actions that are not part of the bottom link group (for example Print report, or graph and settings icon buttons in the page heading) stay as they are unless the human expands scope. See Open Questions.

## Non-functional Requirements

1. Top and bottom groups stay visually consistent with the existing page-navigation link styling.
2. Adding the top group does not change mark entry, grading maths, printing of report content, or database behaviour.
3. Keyboard and pointer activation of the links continues to work for both copies.

## Business Rules

1. A page gets a top navigation group if and only if it already presents the corresponding bottom page-navigation link group.
2. Link targets follow the same parent and related-page rules the bottom links already use (school year, class, student, gradebook home, and cross-links such as individual report ↔ student class data).

## Acceptance Criteria

1. On the individual report, “Back to class” and “Back to student” appear at the top of the page as well as under the report table, and both copies go to the class and student pages respectively.
2. On every other page that already has a bottom page-navigation link group, the same links appear at the top with matching labels, order, and destinations.
3. After this change, the bottom link group is still present on those pages.
4. Printing the individual report still excludes the navigation links and still includes the report table content.
5. Pages that never had a bottom page-navigation link group (for example the home page) do not gain a new navigation strip from this work.

## Edge Cases

1. While a page is still loading or has failed to load the entities needed for destinations, the top group follows the same visibility rules as the bottom group (shown only when those links would be shown today).
2. On a short page where the whole content fits in the viewport, both top and bottom groups are visible at once; that is acceptable under these requirements.
3. On the individual report, heading actions such as Print remain distinct from the duplicated back-link group.
4. Deep-linked or missing-entity error states that already omit or limit bottom links omit or limit the top group the same way.

## Out of Scope

1. Changing which destinations each page offers (no new “Back to …” targets beyond duplicating what exists).
2. Redesigning the global app chrome or adding a site-wide sidebar or top app bar.
3. Sticky or floating navigation that stays on screen while scrolling, unless accepted from Suggested Improvements.
4. Changing print layout of the individual report beyond keeping navigation out of the printout.
5. Home-page tabs or modal action buttons.

## Suggested Improvements

1. **User experience.** Keep the top navigation group in view while the teacher scrolls a long page (for example the individual report or a long class grade table). Duplicating the links helps only until they scroll past the top; a sticky top group would keep leave/related navigation reachable throughout.
2. **User experience.** Place the top group in a consistent spot relative to the page title on every affected page (for example always directly under the heading block). Without a shared placement rule, each page may put the links in a slightly different spot and the pattern will feel uneven.
3. **Technical.** Record the “top and bottom from one definition” pattern so later pages that add page-navigation links include both positions from the start. Otherwise new screens are likely to ship bottom-only again.
4. **User experience.** On very short settings-style pages, consider whether showing the same links twice is worth the clutter, or keep both for consistency with longer pages. Consistency is specified above; this only matters if dual links feel noisy in review.

## Open Questions

1. **High.** Confirm the page inventory above. Should every page that already has a bottom `back-link` group get a top copy, or only longer pages such as the individual report and data views?
2. **High.** Where should the top group sit relative to the title and any existing heading actions (above the title, under the title, or in the heading row)? The issue asks for “the top of the page” but does not pin the exact placement.
3. **Medium.** Are heading-action controls (Print, graph/settings icons) in scope for top/bottom duplication, or only the bottom text-link navigation group shown in the issue screenshot?
4. **Low.** On pages with a single “Back to …” link, is duplicating that one link at the top still required for consistency with multi-link pages?

## Assumptions

1. “Navigation items / buttons” in the issue refers primarily to the existing bottom page-navigation link groups (the `back-link` pattern), as shown in the individual-report screenshot (“Back to class · Back to student”).
2. The home page is out of scope because it has no such bottom group.
3. **Non-binding suggestion from the stakeholder:** implement top and bottom from a single shared component (or equivalent single definition of the links) so the two copies cannot drift. This is recorded as guidance for planning, not as a mandatory design in the functional requirements.
4. Exact visual spacing of the top group can follow existing heading and `back-link` styling unless the human specifies otherwise when answering Open Question 2.
