import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CategoryComponent } from './pages/category/category.component';
import { TaskComponent } from './pages/task/task.component';
import { ListComponent } from './pages/list/list.component';
import { TodosComponent } from './pages/todos/todos.component';
import { GroupedTodosComponent } from './pages/grouped-todos/grouped-todos.component';
import { PAGES } from './services/interfaces';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, title: 'Habit Tracker', data: { page: PAGES.HOME } },
  { path: 'create', component: TaskComponent, title: 'Create Habit', data: { page: PAGES.CREATE_HABIT } },
  { path: 'todos', component: TodosComponent, title: 'ToDos', data: { page: PAGES.TODOS } },
  { path: 'grouped-todos', component: GroupedTodosComponent, title: 'Grouped ToDos', data: { page: PAGES.GROUPED_TODOS } },
  { path: 'list', component: ListComponent, title: 'Habit List', data: { page: PAGES.HABIT_LIST } },
  { path: 'category', component: CategoryComponent, title: 'Habit Category', data: { page: PAGES.HABIT_CATEGORY } }
];
