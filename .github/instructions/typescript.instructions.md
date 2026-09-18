---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript review conventions

When performing a code review, flag deviations from these conventions.

## Utility function placement

Define helpers in a separate file, or below the function or component that calls them. Do not place file-local utilities above the exported function or component.

Shared helpers used from more than one place belong in their own module.

```ts
export function HomePage() {
  return confirmName(pendingDelete);
}

function confirmName(value: string | null): boolean {
  return value !== null;
}
```

## No type assertions

Do not use `as` assertions such as `as number` or `as unknown`. Narrow with type guards, Zod, or explicit annotations. `as const` is allowed.

```ts
const names = ["settings", "students"] as const;
const parsed: unknown = JSON.parse(text);
```

## Prefer interfaces to types

Use `interface` for object shapes. Use `type` only when an interface cannot express the alias, such as unions, mapped types, or tuples.

```ts
interface Student {
  id: string;
  name: string;
}

type GradeKind = "numeric" | "letter";
```
