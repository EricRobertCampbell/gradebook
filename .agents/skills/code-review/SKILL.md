---
name: code-review
description: Review a diff, pull request, or local change in Local Gradebook by running the specialized reviews that match the change, then consolidating findings. Use when the user asks for a code review, runs /code-review, or asks whether a change is ready to merge.
---

# Code Review

Orchestrate the specialized review skills. Do not restate their checklists here. Do not start implementation.

## Workflow

1. Understand the purpose of the change.
2. Review the diff before examining surrounding code.
3. Choose the specialized reviews that apply. Use [Which reviews to run](#which-reviews-to-run).
4. Read each chosen skill and every reference it names. Apply those checks to the diff.
5. Always include [general-review](../general-review/SKILL.md). It checks correctness, maintainability, and architecture guidance.
6. Check user-facing error messages. See [User-facing error messages](#user-facing-error-messages).
7. When the diff changes the database schema or a migration, evaluate it against existing data. See [Schema changes and existing data](#schema-changes-and-existing-data).
8. Merge the findings into one list. Use the severity scale in [references/findings.md](references/findings.md).
9. Drop duplicate comments. When two reviews report the same issue, keep one finding, use the higher severity, and name both sources.
10. Report only issues that are actionable and reasonably well-supported.
11. Distinguish defects from suggestions.
12. Number the consolidated findings from 1, in the priority order in [references/findings.md](references/findings.md). Continue that sequence for optional suggestions. The reader uses these numbers to say which items to address or ignore.

## Which reviews to run

| Skill | Run when |
| --- | --- |
| [general-review](../general-review/SKILL.md) | Every review |
| [backend-review](../backend-review/SKILL.md) | The diff touches `src/main/**`, `src/preload/**`, or `drizzle/**` |
| [frontend-review](../frontend-review/SKILL.md) | The diff touches `src/renderer/**` |
| [ipc-review](../ipc-review/SKILL.md) | The diff touches IPC channels, Zod contracts in `src/shared/ipc.ts`, preload API shape, or main-process handlers |
| [security-review](../security-review/SKILL.md) | The diff touches process isolation, IPC validation, SQLite paths, database import/export, the development HTTP API, student or parent data, or secrets |
| [testing-review](../testing-review/SKILL.md) | The diff changes behaviour |

A renderer-only styling change runs general-review and frontend-review. It does not run backend-review or ipc-review. Skip security-review when the diff has no security surface, and skip testing-review for documentation, comments, or formatting that cannot change behaviour. Say which reviews were skipped and why.

Specialized reviews can be invoked on their own, for example `/backend-review` or `/security-review`. When this skill invoked them, they contribute findings and this skill writes the single summary.

## User-facing error messages

Any user-facing error message should be descriptive and provide a set of next steps. The message should say what went wrong and what the user can do next. A message that only names the failure, or that gives no next steps, is Medium.

## Schema changes and existing data

When the diff changes `src/main/database/schema.ts` or SQL under `drizzle/`, evaluate the migration in light of data that already exists. Confirm that existing rows, column values, and relationships survive, including table rebuilds that copy rows into a new table. A migration that drops, truncates, rejects, or fails to copy existing data is Critical, unless that data loss is an explicit part of the feature.

## Output

Follow [references/findings.md](references/findings.md).

End with:

- Reviews run and reviews skipped
- Number of findings by severity, with the finding numbers in each severity
- Whether any findings are blocking, listed by number
- Optional suggestions that are not blockers, listed by number

## Related

- Implementation: [implement-feature](../implement-feature/SKILL.md)
- Plan review: [review-plan](../review-plan/SKILL.md)
- Paths: `.ai/README.md`
