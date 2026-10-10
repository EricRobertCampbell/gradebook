---
name: plan-feature
description: Research the repo and write a persisted implementation plan for a substantial feature, enhancement, refactor, complex bug fix, or architectural change. Use when the user runs /plan-feature or asks for an implementation plan before coding. Do not use it for trivial edits, and do not start implementation.
---

# Plan feature

Produce a plan and stop for human review. Do not edit application code.

Skip this skill for trivial work: an isolated bug fix, typo, small UI change, simple validation change, or other task that follows one existing pattern and does not change schema, IPC contracts, or architecture. Those go to [implement-feature](../implement-feature/SKILL.md). If the user explicitly ran `/plan-feature` on work that is trivial, say so and write the planning files only after they confirm they still want a plan.

## Workflow

1. Understand the requested work. Read `.ai/requirements/<feature-slug>.md` when it exists, and any requirements file the user names.
2. Inspect the repository enough to see how this area actually works. Cover the items in [What to inspect](#what-to-inspect) that are relevant. Record discoveries while you go.
3. Read architecture guidance in `README.md` (Architecture, Databases, Stack). Read relevant ADRs in `readme/adr/` and architecture docs in `readme/architecture/` when those directories exist. Skip template README files inside those folders.
4. Distinguish discoveries, requirements, assumptions, decisions, and open questions. Do not invent a requirement that the request and the requirements file do not support. Label assumptions as assumptions.
5. Write the planning files. Follow `.ai/README.md`.
6. Review the plan against [Before finishing](#before-finishing).
7. Set `Status: Draft` and stop. Ask the human to run `/review-plan` or to approve the plan. Do not implement it.

## What to inspect

Look for the relevant subset of:

- Renderer code under `src/renderer/`
- Main process and database code under `src/main/`
- Preload bridge under `src/preload/`
- Shared IPC contracts and pure helpers under `src/shared/`
- Drizzle schema (`src/main/database/schema.ts`) and migrations under `drizzle/`
- Existing similar implementations and patterns to reuse
- Tests (`*.test.ts` beside modules)
- Root `README.md` and `.cursor/rules/`
- ADRs in `readme/adr/` when present

Record reusable patterns. Prefer extending an existing abstraction when it already covers the case. Note architectural implications, edge cases, task dependencies, and missing requirements.

Do not plan a generic SQL API, renderer access to Node/SQLite, or hand-written schema migrations that Drizzle Kit should generate.

## Files to write

Create `.ai/plans/<feature-slug>/` and write:

- `findings.md` — research for a later agent, not a short summary. Include relevant files, existing implementations, architectural patterns, renderer/main interaction, IPC contracts, tests, reusable code, constraints, and potential problems.
- `plan.md` — the proposed approach
- `checklist.md` — concrete tasks

Also write `decisions.md` when the plan makes a choice a later reader would otherwise have to reverse-engineer. Do not create empty `progress.md`, `decisions.md`, or `verification.md` files.

`plan.md` starts with `Status: Draft`. Use later statuses only as the workflow changes them: `Reviewed`, `Approved`, `Implementing`, `Done`.

Include these sections in `plan.md` when they are relevant. Omit a section that does not apply rather than filling it with filler:

- Objective
- Scope
- Out of scope
- Architectural approach
- Affected systems
- Affected files and modules
- Data changes
- IPC / contract changes
- Renderer changes
- Main-process and database changes
- Testing strategy
- Migration and backwards compatibility
- Security considerations
- Observability and analytics
- Deployment considerations
- Relevant architecture docs and ADRs
- Open questions
- Assumptions

`checklist.md` uses tasks that can be completed and verified on their own. Group them by area, and include only groups that apply:

```markdown
## Main process / database

- [ ] Add ...

## Shared contracts

- [ ] Add ...

## Renderer

- [ ] Add ...

## Verification

- [ ] Run ...
```

## Before finishing

Check that:

- The plan is internally consistent
- Each requested requirement is represented, or explicitly out of scope
- The plan follows existing repository conventions
- Relevant tests are identified
- Architecture guidance in `README.md` (and any ADRs or architecture docs) was considered
- Dependencies between tasks are explicit
- Open questions that would change the approach are visible

If a requirements file is missing and the request is still ambiguous, write the questions into `plan.md` and say that `/requirements` should be run before implementation. Do not invent the missing requirements.

## Related

- Requirements: [requirements](../requirements/SKILL.md)
- Plan review: [review-plan](../review-plan/SKILL.md)
- Implementation: [implement-feature](../implement-feature/SKILL.md)
- Paths: `.ai/README.md`
