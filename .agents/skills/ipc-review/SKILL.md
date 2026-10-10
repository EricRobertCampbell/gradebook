---
name: ipc-review
description: Review Local Gradebook Electron IPC channel, Zod contract, preload, and handler changes for compatibility, validation, and process boundaries. Use when the user runs /ipc-review or /api-review, or when /code-review reviews an IPC contract change.
---

# IPC review

Review changes to the typed IPC contract and the handlers the renderer calls. Read [findings.md](../code-review/references/findings.md) and the layout rules in [backend.md](../code-review/references/backend.md).

## Where the contract lives

- Channels and Zod schemas: `src/shared/ipc.ts`
- Preload API type: `src/shared/preload-api.ts`
- Preload bridge: `src/preload/preload.ts`
- Handler registration helper: `src/main/ipc/register.ts`
- Handler wiring and domain calls: `src/main/main.ts` and modules under `src/main/database/`
- Development-only HTTP mirror (WSL/browser fallback): `src/main/development-api.ts` and related files — keep it aligned with IPC when a channel is mirrored, and keep it on `127.0.0.1` only

A channel the renderer is meant to call is defined in `ipcChannels`, has input and output schemas in `ipcContracts`, is exposed on `window.gradebook` through the preload API, and is registered with `registerIpcHandler`. Leaving any of those unwired is High.

## What to review

- Contract shape: input and output types match the operation the renderer actually needs
- Backwards compatibility for fields an existing renderer caller still relies on
- Zod validation of untrusted IPC payloads on the main-process boundary (and preload parsing where the project already does it)
- No generic SQL or unconstrained filesystem API over IPC
- Reserved route names (`settings`, `students`, `database`) stay protected when school-year naming is involved
- Renderer wrappers and development HTTP fallbacks stay consistent with the shared contract
- Error behaviour neighbouring callers already handle is preserved

A contract change that breaks an existing renderer caller, without updating that caller, is High.

## Output

Follow [findings.md](../code-review/references/findings.md).
