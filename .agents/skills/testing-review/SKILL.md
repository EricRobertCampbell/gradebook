---
name: testing-review
description: Review whether a Local Gradebook change is verified by tests that actually check the stated behaviour. Use when the user runs /testing-review, or when /code-review reviews a behaviour change.
---

# Testing review

Read [findings.md](../code-review/references/findings.md). A missing test is Medium only when it can hide a regression. Do not require a test for a trivial change that cannot hide one.

## Where tests live

- Tests are Vitest modules named `*.test.ts` beside the code they cover, under `src/main/`, `src/renderer/`, and `src/shared/`.
- Database tests use in-memory SQLite or a temporary file, never `.data/gradebook-dev.sqlite` or the packaged `userData` database.
- Run the suite with `npm run test`. Broader verification uses `npm run check` (typecheck, lint, and test).
- Renderer and shared pure helpers are fair game for unit tests. Prefer extending an existing neighbouring test module when one covers the area.

## What to review

- The tests assert the behaviour the change claims, including the failure path
- Edge cases called out in requirements, the plan, or the diff
- Regressions in neighbouring behaviour the diff could disturb
- IPC contract coverage when a channel, Zod schema, or preload method changes (`src/shared/ipc.test.ts` and related modules)
- Grade-calculation coverage when shared maths in `src/shared/grades.ts` (or neighbours) changes
- Tests that pass without exercising the new branch
- Gaps where no existing harness can run a test. Report the gap; do not pretend a missing runner is coverage

## Output

Follow [findings.md](../code-review/references/findings.md).
