---
name: security-review
description: Review a Local Gradebook change for process isolation, IPC validation, local data exposure, injection, secrets, and unsafe database import or export. Use when the user runs /security-review, or when /code-review reviews a change with a security surface.
---

# Security review

Read [findings.md](../code-review/references/findings.md). Compare the change with neighbouring IPC and database checks. Do not assume a new channel is safe because a nearby one is validated.

## What to review

- Process isolation: `nodeIntegration` stays off, `contextIsolation` stays on, and the renderer reaches the main process only through `contextBridge` / `window.gradebook`
- Renderer code must not gain Node, Electron, or SQLite access
- IPC payloads are untrusted: validate with the shared Zod contracts before use; validate outputs before returning them
- No generic SQL API, eval bridge, or arbitrary filesystem read/write over IPC
- Database import replaces local gradebook data — treat import paths and file contents as untrusted; preserve confirmation behaviour neighbouring flows use
- Student, parent, and grade data are sensitive personal information on the teacher's machine; avoid logging or exporting more than the feature needs
- Injection in raw SQL, shell calls, HTML, and file paths
- Input validation before writes and before dialogs that choose paths
- Secrets, credentials, and tokens committed in source or printed in logs
- Development HTTP API remains loopback-only (`127.0.0.1`), development-only, and narrowly scoped. Broadening it to a packaged, LAN, or generic endpoint is Critical when exploitable, otherwise High

The trust boundary in this codebase is the Electron process split plus validated IPC. Review new access paths against that boundary.

## Output

Follow [findings.md](../code-review/references/findings.md).
