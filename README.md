# Local Gradebook

A local desktop gradebook for teachers. It will manage courses, students, assignments, grades, adjustments, and notes, and it stores everything in SQLite on the teacher’s machine.

This repository is **v0**: school years, classes, students, parents, and class grading are in place. The shell still proves the application path and the project conventions around it.

```text
React renderer → typed Electron IPC → main process → Drizzle → SQLite
```

Student and parent records stay on the teacher’s machine.

## Current status

The window shows a `Local Gradebook` home screen with **School years** and **Students** tabs. School years open `#/<school-year-id>`, where classes can be added from a modal, listed alphabetically, and opened at `#/<school-year-id>/<class-id>`. School year settings (`#/<school-year-id>/settings`) delete the year. Class details, assessment setup, enrolments, and class deletion are at `#/<school-year-id>/<class-id>/settings`. The class page shows a compact grade table: enter raw marks beside computed percents, edit assessments and adjustments from the mark pencil, and edit categories, sub-categories, and work from the column headers. Students are added or removed from class settings. Students are listed alphabetically on the Students tab; add uses a modal. Opening a student goes to `#/students/<id>`, which lists their classes and lets you add, update, or remove parents. Student details and deletion are at `#/students/<id>/settings`. Years, classes, students, and parents can be deleted after typing the name in a confirmation modal. A gear button opens Database operations (`#/database`), where you can check the SQLite connection, save a copy of the gradebook, or import a SQLite file after typing `replace`. `#/settings` redirects there. A successful check displays `SQLite connection successful`. When running from source, a `DEVELOPMENT MODE` banner is shown.

Pushes to `main` also run `.github/workflows/windows-installer.yml`, which builds a Squirrel `Setup.exe` and uploads it as a GitHub Actions artefact (kept for 14 days). That is enough for personal use and a small, briefed alpha. The build is unsigned, so Windows SmartScreen will warn.

## Next steps

Before a second tester wave:

- Attach `Setup.exe` to a GitHub Release so download links do not expire with the Actions artefact
- Add a licence and a short changelog
- Allow only one running instance, and show a visible error if the database cannot start

Before a wider beta:

- Sign the Windows installer so SmartScreen reputation can build
- Add an in-app or Squirrel update feed so testers are not stuck on stale builds

Whenever convenient:

- Confirm before clearing a mark in the grade table (emptying a cell and leaving it currently deletes the assessment)
- Hide or label the analytics stubs at `#/<class-id>/data` and `#/<student-id>/<class-id>/data`

## Stack

| Area | Choice |
| --- | --- |
| Desktop | Electron and Electron Forge |
| UI | React and TypeScript (strict) |
| Bundling | Vite |
| Database | SQLite via `better-sqlite3`, Drizzle ORM, and Drizzle Kit |
| Validation | Zod on IPC inputs and outputs |
| Tests | Vitest, using in-memory or temporary databases only |
| Quality | ESLint (including a ban on TypeScript `as` assertions, except `as const`), Prettier, and TypeScript `noEmit` checks |
| Commits | Conventional Commits, enforced by commitlint |
| Releases | Release Please on `main` |

## Architecture

The renderer must not touch Node, Electron, or SQLite. The window is launched with `nodeIntegration: false` and `contextIsolation: true`. The only bridge is a narrow `contextBridge` API.

| Path | Role |
| --- | --- |
| `src/renderer` | React UI. Calls `window.gradebook` only. |
| `src/preload` | Exposes that API; no database access. |
| `src/main` | App lifecycle, SQLite, Drizzle, and IPC handlers. |
| `src/shared` | Channel names, Zod schemas, and TypeScript contracts. |
| `drizzle/` | Generated SQL migrations, shipped with the packaged app. |

`window.gradebook` currently exposes `database.getStatus()`, `database.export()`, `database.import()`, and school year, class, student, parent, enrolment, and grading methods. There is no generic SQL API. IPC payloads are treated as untrusted and validated against the shared contract in both the main process and the preload script. The names `settings`, `students`, and `database` are reserved so they cannot collide with those routes.

Global tokens and typography live in `src/renderer/styles.css`. Component and page styles sit next to the files that use them (for example `Modal.css` beside `Modal.tsx`). Base colours (`--ink`, `--paper`, `--accent`, `--success`, `--error`, `--banner`) each have light and dark variants via `color-mix`. Semantic tokens (`--colour-primary`, `--colour-secondary`, `--colour-warning`, `--colour-error`, `--colour-info`) inherit from those bases and expose `-lighter` and `-darker` variants. CSS property names such as `color` stay as the language requires.

## Databases

Development, test, and packaged builds never share a SQLite file.

| Environment | Location |
| --- | --- |
| Development (running from source) | `<project>/.data/gradebook-dev.sqlite` |
| Tests | In-memory SQLite or a file under the system temp directory |
| Packaged production | `<userData>/gradebook.sqlite` |

Production data uses Electron’s `app.getPath("userData")`, not the source tree or the install directory. Development also uses the app name `gradebook-dev` so its user-data folder cannot collide with the packaged `Gradebook` app. `.data/` is gitignored.

On startup the main process creates the database if needed, applies outstanding migrations, and inserts a `database_status` row when that key is missing. School years live in `school_years`, each with a unique non-empty name. Classes live in `classes`, with a display name, an internal name unique within the school year, optional subject and section, a required description, and a foreign key to `school_years`. Students and parents are separate tables, linked many-to-many through `student_parents`. Class enrolments are many-to-many through `class_students`.

Grading is organised as class → category (unit) → sub-category → work. A student’s mark on a piece of work is an assessment (`counted` or `exempt`), and an assessment may have many adjustments. An assessment percent is the score divided by the work’s maximum; raw adjustments are applied to the score, and percent adjustments are applied to that ratio. Sub-category, category, and course percents are weighted averages. Exempt assessments are left out of those averages.

## Prerequisites

- Node.js 22 or later
- npm 10 or later
- A C/C++ toolchain so `better-sqlite3` can compile against Electron (Windows Build Tools, Xcode CLT, or the usual Linux compiler packages)

## Commands

```bash
npm install          # dependencies and Git hooks
npm run dev          # development Electron app
npm run typecheck    # TypeScript strict checks
npm run lint         # ESLint
npm run test         # Vitest
npm run check        # typecheck, lint, and test
npm run db:generate  # Drizzle migration from src/main/database/schema.ts
npm run package      # unpackaged build for this OS, in out/
npm run package:win  # packaged Windows application directory
npm run make         # installers for this OS
npm run make:win     # Windows artefacts (Squirrel on Windows; zip elsewhere)
```

After `npm run dev`, select **Check Database** to exercise the full data path.

### Windows Subsystem for Linux

WSLg often never shows the Electron window on the Windows desktop. On WSL, `npm run dev` therefore:

1. Still starts Electron so the main process can open SQLite through Drizzle.
2. Serves a development-only `GET /api/database/status` on `127.0.0.1` (no generic SQL).
3. Opens that same Vite UI in your Windows browser.

Keep the terminal running. The page should appear in Edge or Chrome with a `DEVELOPMENT MODE — BROWSER FALLBACK` banner. **Check Database** still runs the real SQLite query in the main process; Vite proxies `/api` to it.

If the browser does not open, visit `http://127.0.0.1:5173/` from Windows. Do not use this HTTP API in packaged builds.

Edit `src/main/database/schema.ts` and run `npm run db:generate` when the schema changes. Generated SQL is written to `drizzle/` and applied on the next launch.

## Commits and releases

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/). The Git `commit-msg` hook runs commitlint, for example:

```text
feat: add course list
fix: restore database status query
docs: describe release workflow
```

`npm install` enables the hook through Husky.

Pushes to `main` run `.github/workflows/release.yml`. [Release Please](https://github.com/googleapis/release-please) reads the conventional commits, opens a pull request that bumps `package.json` and updates `CHANGELOG.md`, and creates a GitHub release when that pull request is merged. On `0.x`, a breaking change bumps the minor version rather than jumping to `1.0.0`.
