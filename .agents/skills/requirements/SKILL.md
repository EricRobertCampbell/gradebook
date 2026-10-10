---
name: requirements
description: Turn a product request, ticket, or rough specification into a persisted engineering specification, including non-binding technical and user-experience improvements related to the issue. Use when the user runs /requirements, or when a request is unclear, incomplete, or written in product language before /plan-feature. Do not use it to implement the change.
---

# Requirements

Turn the request into an engineering specification and stop. Do not design the implementation, and do not start coding.

Use this skill before [plan-feature](../plan-feature/SKILL.md) when the requirements are unclear, incomplete, or expressed in product or business language. If the user explicitly runs `/requirements`, write the specification even when the request is already fairly precise. If you were about to apply this skill on your own and the request is already a precise engineering task, leave it unused.

## Workflow

1. Read the request. If the user points at a ticket, note, or file, read that too.
2. If the request is a bug fix, find the root cause via reproducing the error before writing the rest of the specification. See [Bug fixes](#bug-fixes).
3. Inspect only enough of the product behaviour to name the users and workflows involved. Do not produce an implementation plan. That is [plan-feature](../plan-feature/SKILL.md).
4. Separate each statement into one of these classes:
   - **Requested** — the user or stakeholder asked for this outcome
   - **Implied** — a reasonable consequence of what they asked for
   - **Assumption** — something you are treating as true so the spec can be written
   - **Suggestion** — an implementation or architecture idea from the stakeholder
5. A stakeholder suggestion is not a requirement. Record it under Assumptions, labelled as a non-binding suggestion. Do not turn it into a mandatory design.
6. Suggest improvements related to this issue. Include technical improvements and user-experience improvements. Each one must follow from the issue and the behaviour you inspected. Record them under Suggested Improvements. They are proposals, not requirements. Do not copy them into Functional Requirements, Acceptance Criteria, or Business Rules. Name the improvement and why it matters for this issue. Do not design how to build it.
7. Write the specification to `.ai/requirements/<feature-slug>.md`. Follow the path and slug rules in `.ai/README.md`.
8. If that file already exists, update it. Add a short note at the bottom describing what changed. Do not silently drop an earlier requirement or an earlier suggested improvement. If the human accepts a suggested improvement, move it into Functional Requirements as **Requested** and remove it from Suggested Improvements.
9. Stop. Tell the human which questions block planning, summarize the suggested improvements so they can accept or reject them, and point them at `/plan-feature` when the spec is ready for planning.

Do not invent a requirement to fill a gap. Put the gap in Open Questions.

## Bug fixes

When the request is a bug fix, the first step is to find the root cause via reproducing the error.

Reproduce the failure, identify the code path that produces it, and record the root cause in the specification under **Root Cause**. Do not treat a guessed cause, a surface symptom, or an unreproduced report as the root cause.

If the root cause is not present — because the error could not be reproduced, the failing path was not found, or the specification would otherwise omit Root Cause — flag that with **High** priority in Open Questions and in the stop message to the human. Do not present the specification as ready for `/plan-feature` until the root cause is known or the human accepts the High gap.

## Specification

Use this structure:

```markdown
# Requirements

## Objective

## Background

## Root Cause

## Functional Requirements

## Non-functional Requirements

## Business Rules

## Acceptance Criteria

## Edge Cases

## Out of Scope

## Suggested Improvements

## Open Questions

## Assumptions
```

Omit **Root Cause** when the request is not a bug fix. For a bug fix, Root Cause is required: state how the error was reproduced and what causes it. If that section would be empty or speculative, leave it as a High open question instead of inventing a cause.

Mark each functional requirement as **Requested** or **Implied**. Acceptance criteria must be checkable from the requested and implied behaviour. Leave implementation choices out of Functional Requirements.

Include affected users and workflows in Background when the request implies them. For this product the primary user is the teacher using a local desktop gradebook; note school-year, class, student, parent, or grading workflows when they are involved. Include business rules that the outcome depends on. Include edge cases that follow from the requirements. Put work the request excludes, or that you are proposing to exclude, in Out of Scope.

Under Suggested Improvements, list technical and user-experience improvements related to this issue. Mark each as **Technical** or **User experience**. State the problem it addresses and the outcome it would improve. If none are worth proposing, say so. These stay out of scope until the human accepts one.

## Related

- Planning: [plan-feature](../plan-feature/SKILL.md)
- Paths: `.ai/README.md`
