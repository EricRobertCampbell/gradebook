---
name: frontend-review
description: Review Local Gradebook React renderer changes for component structure, state, hooks, accessibility, and UI consistency. Use when the user runs /frontend-review, or when /code-review reviews a src/renderer change.
---

# Frontend review

Apply this skill to changes under `src/renderer/`.

Read and apply:

- [findings.md](../code-review/references/findings.md)
- [frontend.md](../code-review/references/frontend.md)

## What to review

- Match the surrounding component and state-management patterns. The app uses React, React Router, colocated CSS, and `window.gradebook` for data.
- Named exports, conditional rendering (`condition ? … : null`), colocated CSS, `Array<T>`, the ban on new `as` assertions, and British English UI copy, as specified in [frontend.md](../code-review/references/frontend.md)
- Renderer code stays free of Node, Electron, and SQLite imports
- Hook dependencies and state that causes avoidable re-renders of a heavy tree (especially the grade table)
- Loading, empty, and error states for data the user is waiting on
- Accessibility of new interactive elements: name, keyboard use, and focus when the surrounding UI provides them (modals already restore focus and handle Escape)
- UI consistency with neighbouring screens and existing CSS variables
- Client code that re-implements a rule the shared grade helpers or main process already enforce, or that trusts a response the IPC contract does not actually return
- Data fetching sits as low in the component tree as practical. A parent that loads only to pass the result through several unused intermediate props is prop drilling. A new call passed down through props that intermediate components do not use is Low.

## Output

Follow [findings.md](../code-review/references/findings.md).
