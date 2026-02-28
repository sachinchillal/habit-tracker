# HabitTracker

A simple habit tracker application. To track progress, stay motivated with streaks, and achieve goals.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

```bash
npm install tailwindcss @tailwindcss/postcss postcss --force

ng serve -o --host 0.0.0.0

ng g c components/loader
ng g c components/home
ng g c components/toast
ng g c components/header

ng g c components/category
ng g c components/category-list
ng g c components/category-list

ng g c components/task
ng g c components/task-create
ng g c components/task-list

ng g c components/todos
ng g c components/grouped-todos
ng g c components/checkbox-item
ng g c components/kanban-board

ng g s services/theme

# To run the development server
cd github/habit-tracker
npm run s

# To deploy
cd github/habit-tracker
npm run b

```