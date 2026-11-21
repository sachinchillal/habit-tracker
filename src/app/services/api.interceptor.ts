import { inject } from '@angular/core';
import { HttpRequest, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export const authenticationInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // The access code and session token are only for our API; never send them to other hosts.
  if (!req.url.startsWith(environment.api.baseUrl)) {
    return next(req);
  }
  const authService = inject(AuthService);
  const h: Record<string, string> = {
    AccessCode: environment.api.accessCode,
    uid: authService.uid || '', li: authService.localId || '',
    'X-Referer': window.location.href
  };
  const token = authService.token;
  if (token) {
    h['Authorization'] = token;
  }
  const modifiedReq = req.clone({ setHeaders: h });
  return next(modifiedReq);
};
