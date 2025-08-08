import { inject } from '@angular/core';
import { HttpRequest, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export const authenticationInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const h = { AccessCode: environment.ACCESS_CODE, Authorization: '', uid: authService.uid, 'X-Referer': window.location.href };
  if (authService.token) {
    h.Authorization = authService.token;
  }
  const modifiedReq = req.clone({ setHeaders: h });
  return next(modifiedReq);
};