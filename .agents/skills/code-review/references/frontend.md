# Frontend review

Apply these checks to changes under `src/renderer/`. Report findings with the severity scale in [findings.md](findings.md).

Style rules (interfaces, array types, `as` assertions, named exports, conditional rendering, colocated CSS, British English, and utility placement) live in [conventions.md](conventions.md). Do not restate them here.

## React and TypeScript

- Follow existing component and state-management patterns.
- Prefer existing UI components under `src/renderer/components/` and project conventions.
- Avoid introducing new dependencies unless necessary.
- The renderer talks to the main process only through `window.gradebook`. Do not import `electron`, Node APIs, `better-sqlite3`, or Drizzle in renderer code.

## Data access

Call `window.gradebook` (or the thin wrappers in modules such as `school-years.ts`, `students.ts`, `grading.ts`) from the component or helper that needs the data. Do not load data in a parent only to pass the promise, loading state, or result through components that do not use it. A new IPC call passed down through unused intermediate props is Low.

When the WSL/browser fallback is in play, follow the existing pattern that prefers the preload API and falls back to the development HTTP helpers. Do not invent a second transport.

## Grades and display

Reuse shared grade helpers from `src/shared/` for percents and special marks. Format for display at the edge (for example `formatGradePercent`). Keep raw ratios and scores coherent with how neighbouring screens already show them.
