# Verification

10 October 2026.

```text
npm run check
```

Typecheck, lint, and Vitest passed: 27 files, 151 tests.

Covered by those tests:

- Exempt `0` is a greyed numeric mark; exempt `null` is `E`; NHI is `NHI`.
- Typing `E` on an exempt score clears it. An unchanged greyed score stays exempt. Typing `NHI` clears the score. A number over `E` or `NHI` is counted. An empty cell deletes.
- An exempt score is left out of the sub-category percent while its own percent is calculated. A cleared exempt mark has no percent. NHI with a supplied score is stored as null and counts as zero. A later counted zero still counts as zero.
- A counted null score is rejected, including when status is omitted on an existing counted row. Exempt `null` and exempt `0` persist.
- The development HTTP parser accepts a null score and rejects a body that omits score.
- `src/shared/grade-distribution.test.ts` still omits an exempt mark whose percent is `0.4`.

The grade table, assessment editor, and individual report were not exercised in the running app. No browser or Electron window was available in this environment.
