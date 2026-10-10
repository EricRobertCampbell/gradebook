---
name: backend-review
description: Review Local Gradebook Electron main-process and database changes for Drizzle schema, queries, IPC handlers, validation, and migrations. Use when the user runs /backend-review, or when /code-review reviews a src/main, src/preload, or drizzle change.
---

# Backend review

Apply this skill to changes under `src/main/`, `src/preload/`, and `drizzle/`.

Read and apply:

- [findings.md](../code-review/references/findings.md)
- [backend.md](../code-review/references/backend.md)

## What to review

- Electron main and database patterns already used in the surrounding modules
- Drizzle schema in `src/main/database/schema.ts` and the matching generated SQL under `drizzle/`
- Query correctness and obvious N+1 or unbounded queries against SQLite
- Transaction boundaries when several writes must succeed or fail together
- Validation and error handling at the IPC boundary that accepts input
- Main versus shared boundaries: pure grade maths and contracts stay in `src/shared/` when both sides need them; SQLite and Electron stay in main
- Process isolation: no renderer imports of Node, Electron, or SQLite drivers
- New IPC channels are registered with Zod input and output parsing

Layout, imports, end-to-end IPC wiring, and migration severity are defined in [backend.md](../code-review/references/backend.md). Follow those mappings.

## Database environments

Development, test, and packaged builds must not share a SQLite file. Tests use in-memory or temporary databases. Packaged data stays under Electron `userData`. A change that points tests or packaged builds at `.data/gradebook-dev.sqlite` (or otherwise crosses those boundaries) is High.

## Output

Follow [findings.md](../code-review/references/findings.md).
