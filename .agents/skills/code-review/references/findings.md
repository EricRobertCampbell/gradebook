# Review findings

Every code-review skill uses this severity scale and output format. Do not invent another scale.

## Severity

- **Critical** — exploitable security hole, data loss, or data corruption
- **High** — incorrect behaviour, a security weakness, a significant performance problem, or one of the established High mappings below
- **Medium** — a missing regression test, or a maintainability problem that will cause a defect
- **Low** — a minor improvement

Critical and High findings are blocking. These glosses apply the existing scale; they do not add a new one.

Use severity to communicate actual importance. A stylistic preference stays a suggestion. Do not raise it to High or Critical to make it look mandatory.

Prioritize findings in this order:

1. Bugs that will cause incorrect behaviour
2. Security issues
3. Data loss or corruption
4. Significant performance problems
5. Missing or inadequate tests
6. Maintainability concerns
7. Minor style improvements

Established mappings, already used in this repo:

- A diff that contradicts architecture guidance in `README.md` (or a matching architecture doc under `readme/architecture/` when present) is **High**.
- An intentional behaviour change that leaves matching architecture guidance stale is **Medium**.
- A missing test is **Medium**, and only when it can hide a regression. Do not require a test for a trivial change that cannot hide one.
- A new `as` type assertion (except `as const`) is **High**. See [frontend.md](frontend.md) and [backend.md](backend.md).
- A Drizzle schema field, constraint, or index change without the matching generated migration under `drizzle/` is **High**. See [backend.md](backend.md).
- A new IPC channel missing the shared contract, preload method, or main-process handler is **High**. See [backend.md](backend.md).
- Renderer code that imports Node, Electron, `better-sqlite3`, or Drizzle, or that bypasses `window.gradebook` for database access, is **High**.
- A user-facing error message that is not descriptive, or that does not provide a set of next steps, is **Medium**.

Do not report something merely because you would have implemented it differently.

## Generated files

Treat SQL under `drizzle/` as generated from `src/main/database/schema.ts` via `npm run db:generate`. Do not hand-edit generated migration SQL when Kit should own the change. Do not ask for a codegen step that regenerates unrelated artefacts.

## Output format

Number every finding the reader sees, starting at 1, with no gaps or reused numbers. The reader uses these numbers to say which findings to address or ignore.

When `/code-review` is the caller, return findings in this format without numbers and do not write a second full summary. The orchestrating skill consolidates them and assigns the numbers. When a specialized review is invoked on its own, number its findings itself.

For each finding, provide:

### 1. Short title

- **Severity:** Critical / High / Medium / Low
- **Location:** File and line(s)
- **Problem:** What is wrong
- **Impact:** Why it matters
- **Recommendation:** How to fix it

Replace `1` with that finding's number and `Short title` with a one-line summary. Number optional suggestions that are not blockers in the same sequence, after the findings, so a number always refers to one item.

When a specialized review is invoked on its own, end with:

- Number of findings by severity, with the finding numbers in each severity
- Whether any findings are blocking, listed by number
- Optional suggestions that are not blockers, listed by number
