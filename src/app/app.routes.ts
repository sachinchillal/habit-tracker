import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CategoryComponent } from './pages/category/category.component';
import { TaskComponent } from './pages/task/task.component';
import { ListComponent } from './pages/list/list.component';
import { TodosComponent } from './pages/todos/todos.component';
import { GroupedTodosComponent } from './pages/grouped-todos/grouped-todos.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, title: 'Habit Tracker' },
  { path: 'create', component: TaskComponent, title: 'Create Habit' },
  { path: 'todos', component: TodosComponent, title: 'ToDos' },
  { path: 'grouped-todos', component: GroupedTodosComponent, title: 'Grouped ToDos' },
  { path: 'list', component: ListComponent, title: 'Habit List' },
  { path: 'category', component: CategoryComponent, title: 'Habit Category' }
];
