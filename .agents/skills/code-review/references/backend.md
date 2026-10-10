# Backend review

Apply these checks to changes under `src/main/` and to Drizzle schema or migrations that the main process owns. Report findings with the severity scale in [findings.md](findings.md).

## TypeScript and Electron main

- Follow existing main-process and database patterns.
- Use type hints where the surrounding code does.
- Prefer `Array<T>` over `T[]` in type annotations.
- Do not add `as` type assertions except `as const`. Narrow with type guards, Zod, or explicit annotations. A new `as` assertion is High.
- Do not introduce unnecessary abstractions.
- Keep British English in comments and user-facing strings we control (`colour`, `initialise`, `enrolment`).

## Layout

| Path | Role |
| --- | --- |
| `src/main/main.ts` | App lifecycle and window setup |
| `src/main/ipc/` | IPC handler registration |
| `src/main/database/` | Drizzle schema, SQLite access, domain queries |
| `src/main/database/schema.ts` | Source of truth for tables; edit here, then generate migrations |
| `drizzle/` | Generated SQL migrations shipped with the app |
| `src/shared/` | Channel names, Zod contracts, shared pure helpers |

Domain modules under `src/main/database/` stay focused (for example `school-years.ts`, `classes.ts`, `gradebook.ts`). Shared pure grade maths belongs in `src/shared/` when both main and renderer need it.

A new IPC channel must be wired end-to-end: channel and Zod contract in `src/shared/ipc.ts`, preload method in `src/preload/preload.ts` and `src/shared/preload-api.ts`, and a registered handler in the main process. Leaving any of those unwired is High.

## Imports

Put imports at the top of the file, not inside functions.

## Schema and migrations

Edit `src/main/database/schema.ts`, then generate SQL with `npm run db:generate`. Do not hand-write a schema migration under `drizzle/` when Drizzle Kit can produce it. A schema field, constraint, or index change that ships without the matching generated migration is High.

Tests use in-memory SQLite or a temporary file, never the development or production database files.

## Process boundaries

The main process owns Node, Electron, `better-sqlite3`, and Drizzle. Do not import those from `src/renderer/`. Do not expose a generic SQL API over IPC. Validate IPC inputs and outputs with the shared Zod contracts.

The development-only HTTP API under `src/main/development-api.ts` (and related Vite wiring) is for WSL/browser fallback on `127.0.0.1` only. Do not broaden it into a packaged or networked API.

## Grades and numbers

Reuse the helpers in `src/shared/grades.ts` and neighbouring shared modules for percents, weights, special marks, and averages. Assessment percents are ratios (score ÷ maximum, then adjustments); display formatting happens at the edge. Do not re-implement weighted averages or exempt/counted rules in a one-off path when the shared helpers already cover the case.

## Tests

Add or update tests next to the behaviour they cover (`*.test.ts` beside the module). Run focused or full suites with `npm run test`. Report a missing test as Medium only when it can hide a regression. Do not require a test for a trivial change that cannot hide one. The testing-review skill applies this same rule.
