import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { CategoryComponent } from './pages/category/category.component';
import { TaskComponent } from './pages/task/task.component';
import { ListComponent } from './pages/list/list.component';
import { TodosComponent } from './pages/todos/todos.component';
import { GroupedTodosComponent } from './pages/grouped-todos/grouped-todos.component';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';

import { PAGES } from './services/interfaces';
import { TreeComponent } from './pages/tree/tree.component';
import { TagsComponent } from './pages/tags/tags.component';
import { authGuard, guestGuard, resumeAfterSignInGuard } from './services/auth.guards';

export const routes: Routes = [
  // Public landing page: no route title, so SeoTitleStrategy uses the full default title.
  // SSO returns users here after sign-in; the guard resumes their original destination.
  { path: '', component: LandingComponent, pathMatch: 'full', canActivate: [resumeAfterSignInGuard], data: { indexable: true } },
  { path: 'login', component: LoginComponent, title: 'Sign in', canActivate: [guestGuard] },

  // Everything else needs a signed-in Domain (SSO) account.
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: 'dashboard', component: HomeComponent, title: 'Dashboard', data: { page: PAGES.HOME } },
      // The dashboard used to live at /home; keep old bookmarks working.
      { path: 'home', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'create', component: TaskComponent, title: 'Create Habit', data: { page: PAGES.CREATE_HABIT } },
      { path: 'todos', component: TodosComponent, title: 'ToDos', data: { page: PAGES.TODOS } },
      { path: 'tree', component: TreeComponent, title: 'Habit Tree', data: { page: PAGES.HABIT_TREE } },
      { path: 'grouped-todos', component: GroupedTodosComponent, title: 'Grouped ToDos', data: { page: PAGES.GROUPED_TODOS } },
      { path: 'list', component: ListComponent, title: 'Habit List', data: { page: PAGES.HABIT_LIST } },
      { path: 'category', component: CategoryComponent, title: 'Categories', data: { page: PAGES.HABIT_CATEGORY } },
      { path: 'tags', component: TagsComponent, title: 'Tags', data: { page: PAGES.HABIT_TAGS } },
    ],
  },

  { path: '**', redirectTo: '' },
];
