# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Sign in with SSO** (2026-11-21) — every page except the landing page needs a signed-in account. Signed-out users get a sign-in page that hands over to SSO and returns them to the page they opened. The header shows an account menu with Sign out, the session is checked with the API, and signing in or out in another tab updates open tabs. Local development proxies `/sso` to the SSO dev server.
- **Public landing page** (2026-11-21) — intro at `/` covering daily check-ins, streaks, and categories. The dashboard shows an empty state until the first habit exists.
- **Search metadata** (2026-11-20) — branded page titles, description, Open Graph and Twitter cards, JSON-LD, a canonical URL, and a sitemap. Only the landing page is indexable; habit pages stay `noindex`.
- **App icons and shortcuts** (2026-11-20) — Habit Tracker logo, maskable icon, and install shortcuts for ToDos and Create Habit.
- **Mark again** (`aef161f`, 2026-11-19) — mark a habit another time for the chosen date and time.
- **Search box** (`7bcca14`, 2026-10-29) — shared search input for tasks and categories; environment files kept out of git.
- **Markdown and safer unmark** (`bd47691`, 2026-08-16) — Markdown task descriptions, category search and filter, confirm before unmarking, table of contents on the tree view.
- **Local storage** (`3f32e6d`, 2026-08-16) — `StoreService` keeps categories, tasks, marks, theme, and todos view in the browser.
- **Auto-clear on create** (`1620434`, 2026-08-07) — forms clear after creating a task or category; API paths updated; leftover create component removed.
- **Habit tree** (`5078089`, 2026-07-18) — tree and modern tree views, in-tree search, category detail with stats, complete a habit from the tree.

### Changed

- **Routes** (2026-11-20) — the dashboard moved from `/home` to `/dashboard` (`/home` still redirects). Unknown paths go to the landing page, and the header logo links home.
- **Theme** (2026-11-20) — Auto follows the system as it changes, the browser theme color updates with the mode, and the saved theme is applied before the first paint.
- **Task views** (`aef161f`, 2026-11-19) — the dashboard and task list follow live task data. Each category shows how many tasks it has, and unreadable local storage is cleared instead of breaking the app.
- **Home backed by the API** (`de37a33`, 2026-08-07) — home loads habits from the API instead of only local state.
- **Typed API tasks** (`d259827`, 2026-07-18) — tasks from the API mapped into the app model, including category name.
- **Parent categories** (`7989e9c`, 2026-07-18) — parent on create, add-child from the list.

### Removed

- **Subcategories** (`7989e9c`, 2026-07-18) — subcategory pages and components added in 1.0.0.

## [1.0.0] - 2026-07-17

### Added

- **Subcategories** (`c6b7b71`, 2026-07-17) — create, list, edit, and delete subcategories; full category path when creating a task; app icons.
- **Weekdays** (`f1ef17f`, 2026-07-15) — choose weekdays on a task.
- **Settings** (`a5e27c2`, 2026-05-15) — settings panel for recent tasks and task borders.
- **Quick date and time** (`bfe0365`, 2026-04-10) — preset date/time picker on the todos page.
- **Header** (`c369454`, 2026-02-28) — shared header for navigation, theme, and refresh.
- **App pages** (`183c9d4`, 2026-02-27) — home, list, category, grouped todos, and a todos page with filters.
- **Kanban board** (`1aea33e`, 2026-02-26) — board view beside the list, with a category picker.
- **Task controls** (`e4c42f9`, 2026-01-23) — pause and resume, search, date and time filters, progress on grouped todos.
- **Tasks and categories** (`bf35fc3`, 2025-11-09) — check off a task, create, edit, and delete tasks, group by category, category API.
- **First tracker UI** (`8512c9f`, 2025-08-08) — Tailwind, theme, toasts, loader, and the first home, list, and create screens on top of the API client.
- **Angular app** (`d069441`, 2025-06-26) — Angular 18 project created with the CLI.

[Unreleased]: https://github.com/sachinchillal/habit-tracker/compare/v1...HEAD
[1.0.0]: https://github.com/sachinchillal/habit-tracker/compare/73dc6d9...v1
