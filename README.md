# HabitTracker

A simple habit tracker application. To track progress, stay motivated with streaks, and achieve goals.

Notable changes are recorded in the [changelog](CHANGELOG.md).

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Authentication (SSO)

Every page except the landing page (`/`) needs a signed-in domain account. Sign-in is handled by the
[SSO app](../sso) (`github/sso`, backed by `github/awb`):

1. A signed-out user opening a protected page (e.g. `/todos`) is sent to `/login?returnUrl=/todos`.
2. **Sign in** / **Create account** go to `{sso.url}sign-in?appId=…` (`environment.sso`; `appId` defaults to `api.accessCode`).
3. SSO stores the session in `localStorage["sso"]` and sends the user back to the app root. Habit Tracker reads
   the session from there (same origin), and the landing page resumes the page the user asked for.
4. The session is confirmed in the background with `GET auth/userinfo`; if the server rejects it, the user is sent
   to sign in again. Signing in or out in another tab reloads open Habit Tracker tabs.
5. **Sign out** (account menu) clears cached habits and opens SSO's logout page.

The session only works when both apps share an origin (`https://domain.com` in production). For local development,
`ng serve` proxies `http://localhost:4200/sso/` to the SSO dev server ([proxy.conf.json](proxy.conf.json)):

```bash
cd github/awb && npm start            # API on :3000 (needs its .env / database)
cd github/sso && npm run s:proxied    # SSO on :5050, served under /sso/
cd github/habit-tracker && npm start  # http://localhost:4200
```

SSO's return URL comes from awb and points at production, so after signing in locally, go back to
`http://localhost:4200/` yourself. Tip: ctrl-click **Sign in** to open SSO in a new tab; the original tab continues
by itself once you are signed in.

Note: awb's `habitTracker/` routes only check the access code, so habit data is not yet separated per user.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Version and build info

Settings (and the browser console on startup) shows e.g. `Version 1.0.0 · 170a4e2` and `Built Nov 26, 2026, 11:07:59 AM` (local time; hover for the exact UTC value).

- **Version** — set by a person, once per release, in `package.json` only (see Releasing). Builds never change it.
- **Commit and build time** — written automatically by [scripts/build-info.mjs](scripts/build-info.mjs) into
  `src/environments/build-info.ts` before every `npm run s|start|build|b|g|watch|test`. That file is gitignored.
  `-dirty` after the commit means the build included uncommitted changes.

Running `ng serve` / `ng build` directly skips the script; run `npm run build-info` once first (needed after a fresh clone).

## Releasing

1. In [CHANGELOG.md](CHANGELOG.md), rename `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD` (add a new empty `[Unreleased]`) and commit.
2. `npm version minor` — or `patch` (fixes only) / `major` (breaking changes). Needs a clean working tree; it bumps
   `package.json` and `package-lock.json`, commits, and tags `vX.Y.Z`.
3. `git push --follow-tags`
4. `npm run b` and deploy `dist/`.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

```bash
npm install tailwindcss @tailwindcss/postcss postcss --force

ng serve -o --host 0.0.0.0

ng g c pages/home
ng g c pages/tree
ng g c pages/tree-modern
ng g c pages/todos
ng g c pages/grouped-todos
ng g c pages/list
ng g c pages/category
ng g c pages/subcategories

ng g c components/loader
ng g c components/toast
ng g c components/header

ng g c components/category-list

ng g c components/task
ng g c components/task-create
ng g c components/task-list

ng g c components/checkbox-item
ng g c components/kanban-board
ng g c components/settings

ng g s services/theme
ng g s services/settings

# To run the development server
cd github/habit-tracker
npm run s

# To deploy
cd github/habit-tracker
npm run b

```