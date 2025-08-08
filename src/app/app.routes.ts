import { Routes } from '@angular/router';
import { CreateComponent } from './components/create/create.component';
import { ListComponent } from './components/list/list.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent, title: 'Habit Tracker' },
  { path: 'create', component: CreateComponent, title: 'Create Habit' },
  { path: 'list', component: ListComponent, title: 'Habit List' }
];
