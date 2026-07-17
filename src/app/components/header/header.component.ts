import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppService } from '../../services/app.service';
import { SettingsComponent } from '../settings/settings.component';

interface NavLink {
  path: string;
  label: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SettingsComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly appTitle = 'Habit Tracker';
  readonly logoSrc = 'android-chrome-192x192.png';

  showSettingsModal = false;
  mobileMenuOpen = false;
  moreMenuOpen = false;

  /** High-traffic routes shown inline on desktop */
  readonly primaryLinks: NavLink[] = [
    { path: '/home', label: 'Dashboard' },
    { path: '/todos', label: 'ToDos' },
    { path: '/create', label: 'Create Habit' },
    { path: '/tree', label: 'Habit Tree' },
  ];

  /** Secondary routes under the More dropdown / mobile drawer section */
  readonly moreLinks: NavLink[] = [
    { path: '/list', label: 'Habit List' },
    { path: '/grouped-todos', label: 'Grouped ToDos' },
    { path: '/category', label: 'Habit Category' },
    { path: '/subcategories', label: 'Subcategories' },
  ];

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public appService: AppService,
    private router: Router,
  ) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeAllMenus();
      });
  }

  /** True when the current URL matches a secondary (More) route */
  get isMoreRouteActive(): boolean {
    const url = this.router.url.split('?')[0];
    return this.moreLinks.some((link) => url === link.path || url.startsWith(link.path + '/'));
  }

  openSettingsModal(): void {
    this.showSettingsModal = true;
    this.closeAllMenus();
  }

  closeSettingsModal(): void {
    this.showSettingsModal = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      this.moreMenuOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleMoreMenu(): void {
    this.moreMenuOpen = !this.moreMenuOpen;
  }

  closeMoreMenu(): void {
    this.moreMenuOpen = false;
  }

  closeAllMenus(): void {
    this.mobileMenuOpen = false;
    this.moreMenuOpen = false;
  }

  isExactHome(path: string): boolean {
    return path === '/home';
  }

  onRefresh(): void {
    if (this.appService.isLoading) {
      return;
    }
    this.appService.handleRefreshFromHeader();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showSettingsModal) {
      return;
    }
    this.closeAllMenus();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.moreMenuOpen) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('.header-more')) {
      return;
    }
    this.closeMoreMenu();
  }
}
