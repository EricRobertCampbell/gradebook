# AI planning artefacts

Persisted requirements and plans for this repository live under `.ai/`. Application code stays in `src/`.

## Paths

| Artefact | Path |
| --- | --- |
| Requirements | `.ai/requirements/<feature-slug>.md` |
| Plan directory | `.ai/plans/<feature-slug>/` |

## Feature slug

Use a short kebab-case slug that names the change, not the ticket number alone.

```text
school-year-copy
grade-table-clear-confirm
database-single-instance
```

Reuse the same slug for the requirements file and the plan directory when both exist.

## Plan directory files

| File | Purpose |
| --- | --- |
| `findings.md` | Research for a later agent |
| `plan.md` | Proposed approach and status |
| `checklist.md` | Concrete, verifiable tasks |
| `decisions.md` | Choices a later reader would otherwise reverse-engineer (only when needed) |
| `plan-review.md` | Written by `/review-plan` |
| `verification.md` | Commands and results during implementation (only when needed) |

Do not create empty placeholder files.

## Status values in `plan.md`

`Draft` → `Reviewed` → `Approved` → `Implementing` → `Done`

## Architecture guidance

Primary architecture and stack notes live in the repository `README.md` (Architecture, Databases, Stack, Commands). Coding conventions live in `.agents/skills/code-review/references/conventions.md`. When ADRs or architecture docs are added later under `readme/adr/` or `readme/architecture/`, planning and review skills should read those too.
