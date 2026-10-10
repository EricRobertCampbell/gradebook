# Frontend review

Apply these checks to changes under `src/renderer/`. Report findings with the severity scale in [findings.md](findings.md).

## React and TypeScript

- Follow existing component and state-management patterns.
- Prefer existing UI components under `src/renderer/components/` and project conventions.
- Avoid introducing new dependencies unless necessary.
- Use named exports. Do not add new default exports.
- Conditionally render with `condition ? <Component /> : null`. Do not use `condition && <Component />`.
- Prefer `Array<T>` over `T[]` in type annotations.
- Keep British English in UI copy and identifiers we control (`colour`, `enrolment`, `organise`).
- The renderer talks to the main process only through `window.gradebook`. Do not import `electron`, Node APIs, `better-sqlite3`, or Drizzle in renderer code.

## Styling

Put styles for a component or page in a CSS file next to that file, and import the CSS from the component. Do not add new component styles to `src/renderer/styles.css`.

```text
Modal.tsx → Modal.css
HomePage.tsx → HomePage.css
```

Keep only design tokens, the document reset, and shared typography utilities in `styles.css`. Prefer the existing CSS variables (`--ink`, `--paper`, `--accent`, semantic `--colour-*` tokens) over one-off colours.

## Types

- Write array types as `Array<T>`, not `T[]`.
- Do not add `as` type assertions. That includes `value as SomeType`, `value as any`, `value as unknown`, and double assertions such as `value as unknown as SomeType`. A new `as` assertion is High. Type the value with narrowing, a type guard, Zod, generics, or `satisfies`. Do not suggest adding an `as` assertion as a fix.
- `as const` is allowed. It narrows a literal; it does not override the type checker.

```tsx
// Reject
const student = response as Student;
const id = value as string;
const payload = data as unknown as Payload;

// Prefer
function isStudent(value: unknown): value is Student {
  return typeof value === "object" && value !== null && "id" in value;
}

if (isStudent(response)) {
  const student = response;
}

const payload = { kind: "create", id } satisfies Payload;

// Allowed
const RESERVED = ["settings", "students", "database"] as const;
```

## Data access

Call `window.gradebook` (or the thin wrappers in modules such as `school-years.ts`, `students.ts`, `grading.ts`) from the component or helper that needs the data. Do not load data in a parent only to pass the promise, loading state, or result through components that do not use it. A new IPC call passed down through unused intermediate props is Low.

When the WSL/browser fallback is in play, follow the existing pattern that prefers the preload API and falls back to the development HTTP helpers. Do not invent a second transport.

## Grades and display

Reuse shared grade helpers from `src/shared/` for percents and special marks. Format for display at the edge (for example `formatGradePercent`). Keep raw ratios and scores coherent with how neighbouring screens already show them.

## Utility placement

Define helpers in a separate file, or below the function or component that calls them. Do not place file-local utilities above the exported function or component.
