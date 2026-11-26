# Requirements

GitHub issue: [#58 — General aesthetics: make it more compact](https://github.com/EricRobertCampbell/gradebook/issues/58)

## Objective

Reduce wasted screen space across the Local Gradebook UI so teachers see more information and data in the same viewport, with less space given to padding, gaps, and other chrome.

## Background

The primary user is the teacher working in a local desktop gradebook. Day-to-day work moves through school years, classes, students, parents, enrolments, and grading. The densest information surface is the class grade table on `#/<school-year-id>/<class-id>`, where many students and pieces of work must fit on screen while marks are entered.

Today the shared page shell (`.panel`) uses large vertical padding (`3.5rem` top, `4rem` bottom). Page titles use a large `h1` (`2.4rem`). Lists of school years, classes, and students use card-like rows with generous padding and rounded corners. Forms, tabs, and primary buttons also use roomy padding. The class grade table itself is already denser than those list and form surfaces (small cell padding and a smaller table font).

The issue asks for a general aesthetic shift toward compactness: more of the window should carry data, and less should be empty spacing. It does not name particular screens, components, or a density target.

## Functional Requirements

1. **Requested.** The overall layout uses less empty spacing and gives more of the viewport to information and data.
2. **Implied.** Spacing reductions apply across the teacher-facing UI, not only on one page, unless a later decision narrows scope.
3. **Implied.** After the change, list screens (school years, classes, students) show more records above the fold than they do today for the same window size.
4. **Implied.** After the change, form and settings screens show more of their fields and actions without scrolling, for the same window size, where content height is currently limited by spacing rather than by the number of controls.
5. **Implied.** On the class page, more of the grade table (rows and/or columns) is visible without scrolling than today for the same window size, to the extent that surrounding page chrome currently wastes vertical or horizontal space.
6. **Implied.** Existing workflows remain available: navigation, mark entry, assessment editing, enrolments, settings, and database operations still work; compactness does not remove features.
7. **Implied.** Interactive targets (buttons, links, mark fields, tabs) remain usable with pointer and keyboard; compactness does not make controls unusable.

## Non-functional Requirements

1. Text and controls remain readable at the app’s normal desktop window sizes.
2. Focus outlines and other affordances that identify the active control remain visible after spacing is tightened.
3. Print layout for pages that already suppress chrome for printing is not made worse by the compactness work unless print is explicitly included later.
4. The change is visual layout only: no new IPC, schema, or data behaviour is required for this outcome.

## Business Rules

1. Compactness must not hide or drop grade values, student names, category structure, or other grading data that the teacher relies on in the current UI.
2. Exempt, NHI, unmarked, and summary presentation in the grade table must remain distinguishable; density must not flatten those cues into one appearance.

## Acceptance Criteria

1. With the same window size as before the change, a representative list screen (for example school years or students) shows more list items without scrolling than it did before.
2. With the same window size, a representative settings or form screen that previously needed scroll mainly because of vertical padding and gaps needs less scroll, or none, for the same fields.
3. With the same window size, the class grade table exposes more student rows and/or more of the table width’s surrounding chrome is reduced so more table area is available than before.
4. Mark entry, list navigation, modals, and settings actions still complete successfully after the layout change.
5. Focused controls remain visually identifiable, and exempt/NHI/summary marks remain distinguishable in the grade table.

## Edge Cases

1. A very small window: compactness must not clip essential controls or make the grade table unusable beyond what already happens today.
2. A class with many enrolled students and many pieces of work: the grade table still scrolls; compactness reduces chrome around it rather than promising that every cell fits on one screen.
3. Modals with long forms: tighter spacing should reduce scroll inside the modal without cutting off actions or making the dialog overflow the window badly.
4. Development banner visible: the banner still appears; compactness of page content should not fight the banner for space in a broken way.
5. Wide class page (`panel--wide`) versus narrow list pages: both kinds of page should feel denser; narrow pages must not become cramped relative to their content.

## Out of Scope

1. Changing grading maths, assessment rules, or what data is stored.
2. Adding new screens, density presets, or a user-facing “compact mode” toggle (unless accepted later as a suggested improvement).
3. Redesigning colour, typography family, or overall brand look except where size or spacing of type is needed for density.
4. Dark theme or theme switching.
5. Responsive mobile layout beyond keeping the desktop window usable when resized.
6. Pinning the grade-table header while scrolling vertically, or other grade-table behaviour changes unrelated to spacing.

## Suggested Improvements

1. **Technical.** Introduce shared spacing tokens (for example page padding, section gaps, control padding) used by pages and common components. Today spacing is repeated as literal rem values across many CSS files, so a one-off trim will drift again as new screens are added.
2. **User experience.** Prioritise vertical space around the class grade table first (app bar, page heading, section gaps), because mark entry is the densest daily workflow and already has a relatively tight table.
3. **User experience.** Tighten list rows and primary buttons less aggressively than page chrome if hit targets start to feel hard to click; page padding and heading margins waste space without aiding interaction.
4. **User experience.** Consider a slightly smaller page title on inner pages (school year, class, student) while keeping the home brand title more prominent, so data screens reclaim height without weakening the home identity.
5. **Technical.** Audit max-width constraints on narrow panels separately from spacing: a narrow column can feel “empty” beside unused window width even when vertical spacing is already tight. Decide whether horizontal use of space is part of this issue before planning.

## Open Questions

1. **High.** Which surfaces are in scope for the first pass: everywhere, only page chrome and lists, or the class grade table and its surrounding page first?
2. **High.** How compact is “enough”? Is there a target (for example roughly one extra student row visible on a typical class page, or a subjective “noticeably denser” pass) the human will accept?
3. **Medium.** Should horizontal unused space on narrow `max-width: 40rem` pages be treated as wasted space for this issue, or is the request mainly about vertical padding and gaps?
4. **Medium.** May type sizes shrink (page titles, body, table font), or should density come only from padding, margins, and gaps?
5. **Low.** Should print styles be reviewed in the same change, or left alone?

## Assumptions

1. “General aesthetics” means the whole teacher-facing UI unless the human narrows scope in Open Questions.
2. The class grade table’s cell density is already closer to “compact” than lists and page chrome; surrounding chrome is a larger source of wasted space than the cells themselves. This is an observation to guide suggestions, not a requirement to leave the table untouched.
3. Stakeholder suggestion (non-binding): none beyond the issue text; the issue states the outcome (more compact, more space for data) without prescribing tokens, components, or a design system approach.
4. No behaviour change to mark entry, navigation, or data is intended; layout and spacing only.
)
