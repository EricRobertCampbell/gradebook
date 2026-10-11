# Coding conventions

This file is the source of truth for the style rules reviews keep flagging. [implement-feature](../../implement-feature/SKILL.md) follows it while writing code. [code-review](../SKILL.md) checks the diff against it.

Architecture, IPC wiring, schema migrations, and process boundaries stay in [backend.md](backend.md), [frontend.md](frontend.md), and `README.md`. Do not restate those here.

Severity for a deviation is in [findings.md](findings.md). A new `as` assertion, other than `as const`, is High. Every other deviation from this file is Low.

## TypeScript

### Prefer interfaces for object shapes

Use `interface` for an object shape. Use `type` only when an interface cannot express the alias, such as a union, a mapped type, a tuple, a function type, a primitive alias, or a conditional type.

```ts
interface Student {
  id: string;
  name: string;
}

type GradeKind = "numeric" | "letter";
```

Declaration merging needs an interface. Augmenting `Window` stays an interface. A Zod inference such as `z.infer<typeof schema>` stays a `type` alias, because an interface cannot express it.

### Array types

Write array types as `Array<T>`, not `T[]`, in type positions.

```ts
Promise<Array<SchoolYear>>
useState<Array<Class>>([])
const names: Array<string> = []
```

Keep `T[]` only where it is not a type annotation, such as an empty array literal or a tuple type.

### No type assertions

Do not add `as` type assertions. That includes `value as SomeType`, `value as any`, `value as unknown`, and double assertions such as `value as unknown as SomeType`. Narrow with a type guard, Zod, generics, or `satisfies`. Do not add an `as` assertion as a fix.

`as const` is allowed. It narrows a literal; it does not override the type checker.

```ts
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

### Imports

Put imports at the top of the file, not inside functions.

### Named exports

Use named exports. Do not add new default exports.

## Function order

Order functions from general to specific. If function A calls function B, define A first and B after it.

Define a helper in its own file, or below the function or component that calls it. Do not place a file-local utility above the exported function or component.

Shared helpers used from more than one place belong in their own module.

```ts
export function HomePage() {
  return confirmName(pendingDelete);
}

function confirmName(value: string | null): boolean {
  return value !== null;
}
```

## React

Conditionally render with `condition ? <Component /> : null`. Do not use `condition && <Component />`.

## CSS

Put styles for a component or page in a CSS file next to that file, and import the CSS from the component. Do not add new component styles to `src/renderer/styles.css`.

```text
Modal.tsx → Modal.css
HomePage.tsx → HomePage.css
icons/icon-button.css for shared icon-button chrome
```

Keep only design tokens, the document reset, and shared typography utilities (`.eyebrow`, `.lede`, `.muted`, `.visually-hidden`) in `styles.css`. Prefer the existing CSS variables (`--ink`, `--paper`, `--accent`, semantic `--colour-*` tokens) over one-off colours.

## Language

Use British spellings in comments, documentation, UI copy, commit messages, and identifiers we control.

```text
colour, not color
initialise, not initialize
behaviour, not behavior
organise, not organize
centre, not center (except CSS keywords)
```

Keep required American spellings from languages and APIs: CSS `color`, `color-mix`, `color-scheme`, `text-align: center`, and third-party names such as `initializeDatabase` from libraries we do not own.

## Values

Prefer a named constant over a magic value.
