import { Injectable } from '@angular/core';
import { THEME_TYPE } from './interfaces';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentThemeType: THEME_TYPE = THEME_TYPE.AUTO;

  constructor(private storeService: StoreService) {
    this.init();
  }

  private init() {
    this.currentThemeType = this.storeService.getThemeType();
    this.changeTheme(this.currentThemeType);
  }

  changeTheme(theme: THEME_TYPE) {
    this.currentThemeType = theme;
    if (theme === THEME_TYPE.AUTO) {
      // if dark mode is preferred, set theme to dark
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.dataset['theme'] = 'dark';
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.dataset['theme'] = 'light';
      }
    } else if (theme === THEME_TYPE.DARK) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');

      document.documentElement.dataset['theme'] = 'dark';
    } else if (theme === THEME_TYPE.LIGHT) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');

      document.documentElement.dataset['theme'] = 'light';
    }
    this.storeService.saveThemeType(theme);
  }

}
