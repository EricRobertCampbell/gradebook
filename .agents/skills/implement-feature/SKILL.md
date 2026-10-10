---
name: implement-feature
description: Implement a Local Gradebook feature, enhancement, bug fix, refactor, or other code change, using a plan directory when one exists. Use when the user runs /implement-feature or asks to implement a change. For substantial work with no plan, stop and recommend /plan-feature. For a material conflict between the plan and the repo, stop for human confirmation.
---

# Implement feature

This is the general implementation skill for features, enhancements, bug fixes, refactors, and other normal development. Do not create a separate implementation path per change type.

## Choose the weight of process

Use a plan when the work is a new feature, a cross-cutting change, a schema or IPC contract change, an architectural change, or a request whose requirements are still unclear.

For an isolated bug fix, typo, small UI change, simple validation change, or straightforward maintenance task:

- Do not create `.ai/plans/` or `.ai/requirements/`
- Follow steps 1 through 7 and 9 through 12 below. Skip step 8. There is no checklist or status to update
- If the task turns out to need schema, IPC, or architectural decisions, stop and recommend [plan-feature](../plan-feature/SKILL.md)

For substantial work with no plan, recommend `/plan-feature` and stop. Continue without a plan only when the user explicitly says to.

## When a plan exists

The planning directory `.ai/plans/<feature-slug>/` is the source of truth. Read:

- `findings.md`
- `plan.md`
- `checklist.md`
- `plan-review.md` when present
- `decisions.md` when present
- Architecture guidance in `README.md`, plus relevant ADRs in `readme/adr/` and architecture docs in `readme/architecture/` when those exist

The user's request to implement records approval: set `Status: Approved`, then `Implementing`, and note the date in `plan.md`. If `plan-review.md` lists blocking issues and the user has not accepted them, show those issues and wait for confirmation before editing application code.

Update `checklist.md` as work is verified, not merely written. Add tasks the plan missed. Do not delete a cancelled task; mark it cancelled and say why.

Do not follow the plan when the repository contradicts it. Use [Contradictions](#contradictions).

## Git base branch

The repo's integration branch is `main`. When creating a feature branch for implementation work:

1. Fetch and update local `main` from `origin/main`.
2. Create the feature branch from `main` (for example `git checkout -b <branch> main` or `git switch -c <branch> main`).
3. Open the pull request with `main` as the base branch.

## Workflow

1. Understand the task.
2. Read planning artifacts when they exist.
3. Read relevant architecture guidance in `README.md` (and ADRs under `readme/adr/` when present) before making an architectural choice.
4. Inspect the existing implementation and match its patterns. Frontend conventions are in [frontend.md](../code-review/references/frontend.md). Backend conventions are in [backend.md](../code-review/references/backend.md).
5. Implement incrementally. For Drizzle schema changes, follow [Database migrations](#database-migrations). For new IPC channels, wire shared contract, preload, main handler, and renderer caller together.
6. Run the relevant checks: `npm run test` for focused or full Vitest runs, and `npm run check` before claiming the work is ready (typecheck, lint, and test).
7. Review the resulting diff against the plan, when one exists, and the conventions above.
8. When a plan directory exists, update `checklist.md` as work is verified, not merely written, and record commands and results in `verification.md`. Add tasks the plan missed. Do not delete a cancelled task; mark it cancelled and say why.
9. Verify the behaviour. For a UI change, exercise the affected flow in the app when browser or Electron tools are available. If they are not, say what was not verified.
10. Apply [ADR consideration](#adr-consideration).
11. A change that alters a documented architecture invariant or flow updates `README.md` (or the matching architecture doc) in the same change.
12. When a plan directory exists and its checklist is complete, set `Status: Done`. Summarize what changed, what was verified, and any remaining risk. The next step is [code-review](../code-review/SKILL.md).

Do not claim the task is complete because the code was written.

When you create a branch or a commit, follow [Branches and commits](#branches-and-commits).

## Branches and commits

Name a new implementation branch with a short kebab-case summary. When a GitHub issue exists, include its number:

```text
feat/clear-mark-confirm
fix/iss-12-database-startup-error
```

Write each commit with the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) formula. This repo's changelog is generated from those messages with Release Please.

```text
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

Use a type such as `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, or `chore`. When you include a scope, wrap it in parentheses: `fix(grading): confirm before clearing a mark`. Keep the description in the imperative mood. Prefer British English in the message prose.

When the commit closes an issue, make the last line of the message `Closes #<issue number>`.

```text
fix(grading): confirm before clearing a mark

Ask before deleting an assessment when the grade cell is emptied.

Closes #12
```

## Database migrations

Schema migrations change tables, columns, constraints, or indexes.

1. Edit `src/main/database/schema.ts`.
2. Generate SQL with `npm run db:generate`.
3. Leave the generated files under `drizzle/` in the change. Do not hand-write that migration when Kit can produce it.

Data migrations that rewrite existing rows need an explicit plan: prefer a generated migration plus carefully reviewed SQL, and cover the behaviour with tests that use in-memory or temporary databases.

Never point tests at `.data/gradebook-dev.sqlite` or the packaged `userData` database.

## Contradictions

If repository reality materially contradicts the plan, do not silently adapt and continue.

Examples: an expected abstraction is missing or means something else, the planned architecture conflicts with the code, requirements are incomplete, complexity is materially different, a different existing abstraction should be reused, or the scope has changed.

1. **Document the discovery** in `findings.md`. Record a decision in `decisions.md` when you are proposing one.
2. **Update** `plan.md` and `checklist.md`. Keep the previous reasoning under `## Revisions` with the date and why it changed.
3. **Classify the impact.** This repo has no separate impact scale, so use:
   - **minor** — a detail is wrong, and the approach, scope, and architecture still hold. Record it and continue.
   - **moderate** — the approach changes, and the objective and architecture still hold. Stop for confirmation.
   - **major** — scope, requirements, architecture, or the reuse target is wrong. Stop, and recommend `/plan-feature` again.
4. **Present the discrepancy** in this form:

```text
Plan assumption:
...

Repository reality:
...

Impact:
...

Proposed approach:
...

Why the plan may need to change:
...

Recommendation:
- continue
- revise plan
- re-run /plan-feature
```

5. **Wait** for human confirmation before continuing when the impact is moderate or major. Do not unilaterally redefine the implementation.
6. **Re-plan** when the discrepancy is major. Say that a new `/plan-feature` pass is preferable to patching an inaccurate plan.

## ADR consideration

After the implementation, ask: did this work introduce, materially change, or establish an architectural decision that should be preserved for future developers and AI agents?

If yes, and `readme/adr/` exists with a documented convention, add or supersede an ADR there. If that folder does not exist yet, record the decision in the plan's `decisions.md` and update `README.md` when the invariant belongs in the project overview. If no durable decision was made, do not write an ADR. Trivial implementation details do not get one.

Read relevant ADRs before choosing an architecture, not only afterwards.

## Related

- Planning: [plan-feature](../plan-feature/SKILL.md)
- Plan review: [review-plan](../review-plan/SKILL.md)
- Code review: [code-review](../code-review/SKILL.md)
- Paths: `.ai/README.md`
