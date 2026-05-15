import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppService } from '../../services/app.service';
import { SettingsComponent } from '../settings/settings.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SettingsComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  showSettingsModal = false;
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

  constructor(public appService: AppService) { }

  openSettingsModal(): void {
    this.showSettingsModal = true;
  }

  closeSettingsModal(): void {
    this.showSettingsModal = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
