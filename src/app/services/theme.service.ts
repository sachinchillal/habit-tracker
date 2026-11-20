import { Injectable } from '@angular/core';
import { THEME_TYPE } from './interfaces';
import { StoreService } from './store.service';

/** Browser UI color per theme; matches the header background (white / slate-950). */
const THEME_COLOR = { light: '#ffffff', dark: '#020617' };

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentThemeType: THEME_TYPE = THEME_TYPE.AUTO;

  private readonly systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  constructor(private storeService: StoreService) {
    this.init();
  }

  private init() {
    this.currentThemeType = this.storeService.getThemeType();
    this.changeTheme(this.currentThemeType);
    // In Auto, follow the operating system when it switches between light and dark.
    this.systemDark.addEventListener('change', () => {
      if (this.currentThemeType === THEME_TYPE.AUTO) {
        this.apply(this.systemDark.matches);
      }
    });
  }

  changeTheme(theme: THEME_TYPE) {
    this.currentThemeType = theme;
    this.apply(this.resolveDark(theme));
    this.storeService.saveThemeType(theme);
  }

  private resolveDark(theme: THEME_TYPE): boolean {
    return theme === THEME_TYPE.DARK || (theme === THEME_TYPE.AUTO && this.systemDark.matches);
  }

  /** Keep in sync with the inline theme script in src/index.html. */
  private apply(dark: boolean) {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.classList.toggle('light', !dark);
    root.dataset['theme'] = dark ? 'dark' : 'light';
    root.style.colorScheme = dark ? 'dark' : 'light';
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light);
    });
  }
}
