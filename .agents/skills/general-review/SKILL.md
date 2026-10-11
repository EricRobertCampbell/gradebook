---
name: general-review
description: Review a Local Gradebook diff for correctness, regressions, error handling, maintainability, and architecture-doc consistency. Use when the user runs /general-review, or when /code-review includes the general quality pass.
---

# General review

Review the diff for defects that are not specific to backend, frontend, IPC, security, or test conventions. Those domains have their own skills. Read [findings.md](../code-review/references/findings.md) and [conventions.md](../code-review/references/conventions.md). Use findings.md for every finding.

## What to review

- Correctness and edge cases
- Regressions in neighbouring behaviour
- Error handling
- Significant performance problems
- Unnecessary complexity, duplication, and dead code
- Consistency with existing project patterns and [conventions.md](../code-review/references/conventions.md)
- Whether a new abstraction is justified by a real repeated case
- Whether a one-off special case ignores an existing shared abstraction that would be clearer and no harder to use

Across the renderer, also apply [frontend.md](../code-review/references/frontend.md) when the diff touches `src/renderer/**`. Across the main process, preload, and migrations, also apply [backend.md](../code-review/references/backend.md) when the diff touches `src/main/**`, `src/preload/**`, or `drizzle/**`. The matching specialized skill covers the domain checklist; do not repeat those findings here when `/code-review` is running both. Coding conventions are checked from [conventions.md](../code-review/references/conventions.md); do not restate them here.

## Architecture guidance

Primary architecture notes live in `README.md` (Architecture, Databases, Stack). Coding conventions live in [conventions.md](../code-review/references/conventions.md).

1. Read the Architecture and Databases sections of `README.md` when the diff touches process boundaries, IPC, SQLite paths, or migrations.
2. If `readme/architecture/*.md` exists, list those files, skip `README.md` and `TEMPLATE.md` inside that folder, and match any `paths` frontmatter globs to changed files. Read each matching doc in full.
3. If nothing beyond the root README applies, say so. Do not invent an architecture constraint.
4. If the diff contradicts documented architecture guidance, report it as High. If the diff deliberately changes the documented behaviour, the same change must update that guidance. Report a missing update as Medium.

When ADRs exist under `readme/adr/`, treat a contradiction with an Accepted ADR as High. A deliberate change to that decision needs an ADR update in the same change.

## Under-generalized and over-built changes

Flag a change as Medium when all of the following are true:

- A more general approach is equally understandable, or easier to understand
- It matches an existing abstraction and reduces duplication
- The extra implementation, test, and maintenance cost is small
- Similar code or a neighbouring feature shows the general form will actually be reused

Do not request a new framework, plugin system, or configurable abstraction for a hypothetical future requirement.

## Output

Follow [findings.md](../code-review/references/findings.md).
