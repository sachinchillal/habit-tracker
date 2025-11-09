import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AppService } from './services/app.service';
import { LoaderComponent } from './components/loader/loader.component';
import { ToastComponent } from "./components/toast/toast.component";
import { ThemeService } from './services/theme.service';
import { THEME_TYPE as TT } from './services/interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, LoaderComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'habit-tracker';
  readonly navLinks = [
    { path: '/home', label: 'Dashboard' },
    { path: '/create', label: 'Create' },
    { path: '/todos', label: 'ToDos' },
    { path: '/grouped-todos', label: 'Grouped ToDos' },
    { path: '/list', label: 'List' },
    { path: '/category', label: 'Category' },
  ]
  readonly THEME_TYPE = TT;

  constructor(public appService: AppService, public themeService: ThemeService) { }
}
