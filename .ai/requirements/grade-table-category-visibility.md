# Requirements

Source: [GitHub issue #54 — Category is hidden](https://github.com/EricRobertCampbell/gradebook/issues/54)

## Objective

On the class grade table, keep each category and sub-category name visible in the scroll viewport while the teacher is looking at that group’s work columns, even when the group is wide enough to force horizontal scrolling.

## Background

The teacher records marks on the class page, in the Grades table (`ClassGradeTable`). The table has up to three header rows: categories, then sub-categories (and any work hanging directly under a category), then individual pieces of work. A category header is one cell that spans every column under that category (works, sub-category columns, the category summary, and any goal columns shown for those children). A sub-category header likewise spans every column under that sub-category.

The table sits in a horizontally scrollable frame (`.grade-table-scroll`). The student name column is pinned on the left. The course total, and the course goal when shown, are pinned on the right. Category and sub-category headers are ordinary table cells: they are not pinned, and their labels are centred in the full width of the spanned columns.

When a category or sub-category has many pieces of work, that header cell becomes much wider than the viewport. Scrolling sideways to reach later work moves the centred name out of view while work under that same group is still on screen. The teacher then sees marks and work titles without knowing which category or sub-category they belong to. Collapse can shrink a group, but that hides the work the teacher may need while entering marks.

This behaviour is only on the class grade table. Student reports and other pages do not use this multi-level mark grid.

## Root Cause

Reproduced with a layout matching `ClassGradeTable`: a scroll container (`overflow: auto`, constrained width), sticky Student and Course columns only, and category / sub-category headers as wide `colSpan` cells whose content is centred via `.grade-header` (`display: flex; align-items: center` in a column).

With ten work columns under one category (cell ≈ 1336px in the repro), scrolling so later exams are in view leaves an empty dark header band above those work titles: the centred “Tests” and “Unit exams” labels sit near the horizontal centre of the cell and leave the viewport (`scrollLeft=900` → both labels `in viewport=false`), while Exam 7–10 and the summary stay visible. Student and Course remain pinned.

The product code path is the same: category and sub-category `<th>` elements in `ClassGradeTable.tsx` use large `colSpan` values from `categoryHeaderSpan` / `subcategoryHeaderSpan`, render `HeaderLabel` inside `.grade-header`, and have no sticky positioning in `ClassGradeTable.css` (unlike `.grade-table-student` and `.grade-table-total`). Horizontal overflow therefore scrolls the group label away while its child columns remain in frame.

## Functional Requirements

1. **Requested.** When a category has so many child columns that the grade table scrolls horizontally, the teacher can still see that category’s name while viewing work (or other columns) that belong to that category.
2. **Requested.** The same is true for a sub-category with many pieces of work: its name stays visible while its work columns are in view.
3. **Implied.** While any part of a category’s columns is in the horizontal viewport, that category’s identifying name remains readable in the viewport (the “view frame” called for in the issue), not only somewhere on the full-width header cell off-screen.
4. **Implied.** While any part of a sub-category’s columns is in the horizontal viewport, that sub-category’s identifying name remains readable in the viewport.
5. **Implied.** When the teacher scrolls past a category or sub-category so none of its columns remain in view, that group’s name does not remain pinned as if it still applied to the columns now on screen.
6. **Implied.** The pinned student column and pinned course total (and course goal, when shown) keep their current sticky behaviour.
7. **Implied.** Individual work headers and the category / sub-category summary columns continue to scroll with the table; this change is about category and sub-category identity, not about pinning every work title.
8. **Implied.** Collapse and expand of categories and sub-categories continue to work. Visibility of the name must not depend on collapsing the group.
9. **Implied.** Category and sub-category header actions that already exist (edit, add, excuse, collapse, goal, and so on) remain usable; the name staying visible must not block those controls when they are in view.

## Non-functional Requirements

1. The fix applies on the existing class grade table without changing how marks are stored or calculated.
2. Horizontal scrolling of a wide table remains possible; the table must not become unusable on a typical desktop window width.
3. Category and sub-category names stay readable against the existing header styling (dark header, light text).
4. Keyboard and pointer use of header controls and mark entry must not regress.

## Business Rules

1. A category name identifies the columns that belong to that category in the current expanded/collapsed layout.
2. A sub-category name identifies the columns that belong to that sub-category in the current expanded/collapsed layout.
3. Work that hangs directly under a category (no sub-category) is still part of that category’s span; the category name covers those columns as it does today.

## Acceptance Criteria

1. With a category wide enough to require horizontal scrolling, scroll until a later work under that category is in view: the category name is still visible in the scroll viewport.
2. With a sub-category wide enough to require horizontal scrolling, scroll until a later work under that sub-category is in view: the sub-category name is still visible in the scroll viewport.
3. Scroll until no columns of that category remain in view: the previous category’s name is gone, and the name for the category now in view (if any) is what appears.
4. The same hand-off applies when scrolling from one wide sub-category into another.
5. Student remains pinned on the left and Course (and course goal when shown) remain pinned on the right while doing the above.
6. Collapsing a category or sub-category still hides its child columns; expanding restores them. Names remain visible for groups that are on screen whether or not the teacher uses collapse.
7. Header actions on a category or sub-category that is on screen can still be activated.

## Edge Cases

1. A category with only a summary column (collapsed, or no children beyond the summary) is already narrow; its name stays visible without special scrolling behaviour.
2. A category with many direct works and no sub-categories: only the category name needs to stay in view above those works.
3. Nested width: a wide category that contains several wide sub-categories. While scrolling within one sub-category, both that sub-category name and the parent category name stay identifiable in the viewport.
4. Goal columns under a category or sub-category count toward the group’s width; scrolling across them still keeps the group name visible while those columns are in view.
5. Multiple categories on one class: scrolling from the end of one category into the next must not leave the previous category’s name over the next category’s columns.
6. Drag-reorder of categories, category children, or sub-category works must still be possible after the visibility change.
7. A very short viewport height is unchanged by this issue; vertical header pinning is not required here.

## Out of Scope

1. Pinning individual work column headers while scrolling horizontally.
2. Pinning the whole `thead` while scrolling vertically.
3. Changing collapse defaults, auto-collapse, or requiring teachers to collapse wide groups.
4. Changing grading maths, weights, excuses, goals, or mark entry.
5. Applying this behaviour to student class reports or any screen other than the class grade table.
6. Redesigning the header action set or the three-row header structure itself.

## Suggested Improvements

1. **User experience.** Also keep the active work’s header (or a compact work label) in view while a mark field in that column has focus. Related to the row-highlight work: the student can stay obvious while the work title still scrolls away on a wide group.
2. **User experience.** Keep the grade-table header rows pinned while scrolling vertically through a long class list, so category / sub-category / work titles remain available when the teacher has scrolled down the student list.
3. **Technical.** Prefer a CSS-first approach that sticks the header label within its own column group (and clears when that group leaves the viewport), so scroll behaviour stays in the browser rather than in scroll listeners. Worth evaluating in planning; not mandated here.
4. **User experience.** When a sticky category or sub-category label would collide with the sticky student column, inset the label so it sits clearly to the right of Student and remains fully readable.
5. **User experience.** If header action icons crowd a sticky label on a narrow remaining slice of the group, keep the name first and allow actions to clip or tuck until there is room, rather than hiding the name again.

## Open Questions

1. **Medium.** Must the sticky treatment include the full `HeaderLabel` (weight, notes, and action buttons), or is the category / sub-category **name** enough to satisfy “visible”? The issue names the category / sub-category; actions staying reachable is implied when they are on screen, but packing every control into a sticky chip may be unnecessary.
2. **Low.** When only a thin sliver of a category remains at the left or right edge of the viewport, should the name still attempt to show (and possibly overflow that sliver), or may it hide once the visible width of the group falls below a small threshold?
3. **Low.** Confirm that work hanging directly under a category (no sub-category row cell above those works) needs no extra label beyond the category name staying in view.

## Assumptions

1. “Visible in the view frame” means the name is readable inside the grade table’s scroll viewport while that group’s columns are on screen, not merely present in the DOM for the full-width cell.
2. Collapse is a useful shrink tool but not an acceptable substitute for this requirement; teachers must be able to keep many works expanded and still know which group they are in.
3. Non-binding suggestion from the issue wording (“ideally visible in the view frame”): treat staying in the viewport while the group is on screen as the intended outcome, not an optional nice-to-have.
4. No change to the set of pinned edge columns (Student left; Course / course goal right) is required beyond coordinating with category / sub-category visibility.
