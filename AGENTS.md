# Agent guide — Local Gradebook

## Purpose

Local Gradebook is a desktop gradebook for teachers. It manages school years, classes, students, parents, enrolments, assessments, adjustments, and notes. All data stays on the teacher's machine in SQLite.

Architecture:

```text
React renderer → typed Electron IPC → main process → Drizzle → SQLite
```

The renderer must not touch Node, Electron, or SQLite. The only bridge is `window.gradebook` via `contextBridge` (`nodeIntegration: false`, `contextIsolation: true`). IPC payloads are untrusted and validated with shared Zod contracts. There is no generic SQL API.

Human-facing product detail, commands, and current status live in [`README.md`](README.md).

## Important paths

| Path | Role |
| --- | --- |
| `src/renderer/` | React UI. Calls `window.gradebook` only. Colocated `*.css` beside components/pages. |
| `src/preload/` | Exposes the preload API; no database access. |
| `src/main/` | App lifecycle, SQLite, Drizzle, IPC handlers, development HTTP fallback (WSL). |
| `src/main/database/` | Schema (`schema.ts`), domain queries, transfer/status helpers. |
| `src/main/ipc/` | IPC handler registration with Zod parse-in / parse-out. |
| `src/shared/` | Channel names, Zod contracts (`ipc.ts`), preload API types, shared pure helpers (e.g. grades). |
| `drizzle/` | Generated SQL migrations from `npm run db:generate`. |
| `.data/` | Local development SQLite (gitignored); never use in tests or packaged builds. |
| `.cursor/rules/` | Coding conventions for agents (British English, `Array<T>`, no `as`, colocated CSS, utility order). |
| `.ai/` | Persisted requirements and plans. See [`.ai/README.md`](.ai/README.md). |
| `.agents/skills/` | Project agent skills (requirements → plan → implement → review). |

### Domain map (quick)

- School years, classes, students, parents, enrolments → `src/main/database/` modules of the same names, plus matching renderer wrappers and pages.
- Grading structure and marks → `grading-structure.ts`, `gradebook.ts`, `assessments.ts`, shared maths in `src/shared/grades.ts`.
- Database check / export / import → `src/main/database/status.ts`, `transfer.ts`, renderer `DatabasePage`.

### Commands agents usually need

```bash
npm run check        # typecheck, lint, test
npm run test         # Vitest
npm run db:generate  # after editing src/main/database/schema.ts
npm run dev          # Electron app (WSL uses browser fallback)
```

Integration branch is `main`. Commits use Conventional Commits (Release Please).

## Skills

Skills live under [`.agents/skills/`](.agents/skills/). Each skill has a `SKILL.md`. Prefer the slash-style names below when the user asks for that workflow.

### Delivery workflow

| Skill | When to use |
| --- | --- |
| [`requirements`](.agents/skills/requirements/SKILL.md) | Turn a vague or product-language request into `.ai/requirements/<slug>.md`. Do not implement. |
| [`plan-feature`](.agents/skills/plan-feature/SKILL.md) | Research the repo and write `.ai/plans/<slug>/`. Do not implement. |
| [`review-plan`](.agents/skills/review-plan/SKILL.md) | Skeptical review of a plan; write `plan-review.md`. |
| [`implement-feature`](.agents/skills/implement-feature/SKILL.md) | Implement from a plan (or a small task without one). |

Typical order for substantial work: `/requirements` → `/plan-feature` → `/review-plan` → human approval → `/implement-feature` → `/code-review`.

### Code review

| Skill | When to use |
| --- | --- |
| [`code-review`](.agents/skills/code-review/SKILL.md) | Orchestrates the specialised reviews and consolidates findings. |
| [`general-review`](.agents/skills/general-review/SKILL.md) | Correctness, maintainability, architecture guidance (always part of code review). |
| [`backend-review`](.agents/skills/backend-review/SKILL.md) | `src/main/**`, `src/preload/**`, `drizzle/**`. |
| [`frontend-review`](.agents/skills/frontend-review/SKILL.md) | `src/renderer/**`. |
| [`ipc-review`](.agents/skills/ipc-review/SKILL.md) | IPC channels, Zod contracts, preload API, handlers (`/api-review` is an alias). |
| [`security-review`](.agents/skills/security-review/SKILL.md) | Process isolation, IPC validation, DB import/export, local PII, dev HTTP API. |
| [`testing-review`](.agents/skills/testing-review/SKILL.md) | Behaviour changes and regression coverage. |

Shared review conventions and severity scale:

- [`.agents/skills/code-review/references/findings.md`](.agents/skills/code-review/references/findings.md)
- [`.agents/skills/code-review/references/backend.md`](.agents/skills/code-review/references/backend.md)
- [`.agents/skills/code-review/references/frontend.md`](.agents/skills/code-review/references/frontend.md)

## Conventions agents must respect

- British English in UI copy, comments, commits, and identifiers we control (`colour`, `enrolment`, `initialise`).
- Named exports; no new default exports.
- `Array<T>` in type positions; no `as` assertions except `as const`.
- Conditional render with `condition ? <Node /> : null`, not `&&`.
- Colocated CSS next to the component/page; keep tokens in `src/renderer/styles.css`.
- New IPC work wires all four: `src/shared/ipc.ts` → preload → main handler → renderer caller.
- Schema edits go in `src/main/database/schema.ts`, then `npm run db:generate`.
- Tests use in-memory or temporary SQLite only.
