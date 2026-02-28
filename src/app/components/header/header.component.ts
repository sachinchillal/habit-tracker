import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { THEME_TYPE as TT } from '../../services/interfaces';
import { AppService } from '../../services/app.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  showThemeModal = false;
  mobileMenuOpen = false;
  /** Labels aligned with app.routes.ts title for each route */
  readonly navLinks = [
    { path: '/home', label: 'Dashboard' },
    { path: '/create', label: 'Create Habit' },
    { path: '/todos', label: 'ToDos' },
    { path: '/grouped-todos', label: 'Grouped ToDos' },
    { path: '/list', label: 'Habit List' },
    { path: '/category', label: 'Habit Category' },
  ];
  readonly THEME_TYPE = TT;

  constructor(public themeService: ThemeService, public appService: AppService) { }

  openThemeModal(): void {
    this.showThemeModal = true;
  }

  closeThemeModal(): void {
    this.showThemeModal = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
