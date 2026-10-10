---
name: review-plan
description: Skeptically review a Local Gradebook implementation plan for missing requirements, architectural mistakes, overly narrow solutions, and over-engineering. Use when the user runs /review-plan or asks for a review of .ai/plans. Do not start implementation.
---

# Review plan

Review the plan as a skeptical senior engineer. Look for ways it can fail. Do not rewrite it into a second implementation, and do not edit application code.

## Inputs

Read the planning directory, usually `.ai/plans/<feature-slug>/`:

- `plan.md`
- `findings.md`
- `checklist.md`
- `decisions.md` when present
- The requirements file named by the plan, usually `.ai/requirements/<feature-slug>.md`

Then read the repository code and architecture guidance the plan depends on (`README.md`, `.cursor/rules/`, and any `readme/architecture/` or `readme/adr/` docs). Check claims in `findings.md` against the code. A plan that cites a pattern the repo does not have is a finding.

Do not recommend a generic SQL API, renderer access to Node or SQLite, or hand-written Drizzle schema migrations that `npm run db:generate` should own.

## Review

### Requirements

Look for missing requirements, incorrect assumptions, scope ambiguity, missing acceptance criteria, and open questions that should be answered before implementation.

### Architecture

Look for inconsistency with the Electron process split (renderer → preload → main → Drizzle → SQLite), duplication, unnecessary new abstractions, incorrect renderer/main boundaries, IPC contract problems, data-model problems, migration concerns, and backwards compatibility issues.

### Implementation completeness

Look for missing files, components, or modules, missing dependencies, missing error handling, missing edge cases, and missing integration work (shared contract, preload, main handler, renderer caller).

### Testing

Look for missing main-process or database tests, missing renderer or shared tests, missing IPC contract coverage, missing regression coverage, and acceptance criteria that cannot be verified. Follow the test severity in [findings.md](../code-review/references/findings.md): a missing test is Medium only when it can hide a regression.

### Security

Look for process-isolation gaps, unvalidated IPC, unsafe database import or export, data exposure of student or parent information, input validation gaps, and unsafe assumptions about the development HTTP API.

### Maintainability

Look for unnecessary complexity, duplication, inconsistency with repository conventions, and avoidable technical debt.

## Generalization

Ask whether the plan solves only the exact current case when a more general solution would be easier to understand, fit the existing abstractions, and provide real reuse at little extra cost.

Flag that only when all four are true:

1. **Understandable.** The general solution is equally understandable, or easier to understand. Do not recommend an abstraction that makes the code harder to follow.
2. **Fits the architecture.** It matches existing patterns, aligns with existing abstractions, reduces duplication, and improves consistency.
3. **Small extra cost.** It does not meaningfully increase implementation, testing, or maintenance effort.
4. **Evidence of reuse.** Similar implementations already exist, a neighbouring feature shows the same shape, a pattern is repeated, or the plan partially duplicates an existing abstraction.

Do not recommend generalization because a hypothetical future requirement might exist.

Appropriate: the plan adds one-off validation for school-year names, while class internal names already share a similar Zod refine pattern. Recommend extending or mirroring that pattern.

Inappropriate: recommending a plugin system because there might someday be more import formats. Record that under Not Recommended when it appears in the plan or is tempting.

Also flag the opposite problem: a new framework or extension point whose only justification is a hypothetical future requirement.

## Output

Write `.ai/plans/<feature-slug>/plan-review.md`:

```markdown
# Plan Review

## Blocking Issues

## Important Issues

## Generalization Opportunities

### Recommended

### Not Recommended

## Questions

## Suggested Changes

## Missing Tests

## Positive Findings

## Recommendation
```

Use **Blocking Issues** for problems that make implementation unsafe or likely to miss the requirement. Use **Important Issues** for problems that should be fixed in the plan first. Explain why a recommended generalization is warranted. Keep this document's headings. The Critical / High / Medium / Low scale belongs to code review, not to this file. A test gap stays under Missing Tests and follows the Medium rule in findings.md.

Set the recommendation to one of: approve, revise the plan, or re-run `/plan-feature`.

Update `Status` in `plan.md` to `Reviewed`. Leave the plan's approach in place; suggested edits belong in this review. Do not mark the plan `Approved`.

Do not begin implementation. The next step is human approval, then [implement-feature](../implement-feature/SKILL.md).

## Related

- Planning: [plan-feature](../plan-feature/SKILL.md)
- Severity for test gaps: [findings.md](../code-review/references/findings.md)
