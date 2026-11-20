import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authenticationInterceptor } from './services/api.interceptor';
import { SeoTitleStrategy } from './services/seo-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    provideHttpClient(withInterceptors([authenticationInterceptor])),
  ]
};
