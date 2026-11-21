import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppService } from '../../services/app.service';
import { AuthService } from '../../services/auth.service';
import { SettingsComponent } from '../settings/settings.component';
import { environment } from '../../../environments/environment';

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
  readonly appTitle = environment.appTitle;
  readonly logoSrc = 'addhuri-habit-tracker-logo.svg';

  showSettingsModal = false;
  mobileMenuOpen = false;
  moreMenuOpen = false;
  accountMenuOpen = false;

  readonly auth = inject(AuthService);

  /** High-traffic routes shown inline on desktop */
  readonly primaryLinks: NavLink[] = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/todos', label: 'ToDos' },
    { path: '/create', label: 'Create Habit' },
    { path: '/category', label: 'Categories' },
    { path: '/tree', label: 'Habit Tree' },
  ];

  /** Secondary routes under the More dropdown / mobile drawer section */
  readonly moreLinks: NavLink[] = [
    { path: '/list', label: 'Habit List' },
    { path: '/grouped-todos', label: 'Grouped ToDos' },
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
    if (this.moreMenuOpen) {
      this.accountMenuOpen = false;
    }
  }

  closeMoreMenu(): void {
    this.moreMenuOpen = false;
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen = !this.accountMenuOpen;
    if (this.accountMenuOpen) {
      this.moreMenuOpen = false;
    }
  }

  closeAllMenus(): void {
    this.mobileMenuOpen = false;
    this.moreMenuOpen = false;
    this.accountMenuOpen = false;
  }

  signOut(): void {
    this.closeAllMenus();
    this.auth.signOut();
  }

  isExactHome(path: string): boolean {
    return path === '/dashboard';
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
    if (!this.moreMenuOpen && !this.accountMenuOpen) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (this.moreMenuOpen && !target?.closest('.header-more')) {
      this.closeMoreMenu();
    }
    if (this.accountMenuOpen && !target?.closest('.header-account')) {
      this.accountMenuOpen = false;
    }
  }
}
