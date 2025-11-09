import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CategoryComponent } from './components/category/category.component';
import { TaskComponent } from './components/task/task.component';
import { ListComponent } from './components/list/list.component';
import { TodosComponent } from './components/todos/todos.component';
import { GroupedTodosComponent } from './components/grouped-todos/grouped-todos.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent, title: 'Habit Tracker' },
  { path: 'create', component: TaskComponent, title: 'Create Habit' },
  { path: 'todos', component: TodosComponent, title: 'ToDos' },
  { path: 'grouped-todos', component: GroupedTodosComponent, title: 'Grouped ToDos' },
  { path: 'list', component: ListComponent, title: 'Habit List' },
  { path: 'category', component: CategoryComponent, title: 'Habit Category' }
];
