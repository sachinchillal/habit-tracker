import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService, DEFAULT_SIGNED_IN_URL, sanitizeReturnUrl } from './auth.service';

/** Protected pages: signed-out users go to the in-app sign-in page, remembering where they were headed. */
export const authGuard: CanActivateChildFn = (_route, state) => {
  if (inject(AuthService).isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** The sign-in page is pointless once signed in: continue to where the user was headed. */
export const guestGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) {
    return true;
  }
  const pending = auth.consumePendingReturnUrl();
  const target = sanitizeReturnUrl(route.queryParamMap.get('returnUrl')) ?? pending ?? DEFAULT_SIGNED_IN_URL;
  return inject(Router).parseUrl(target);
};

/**
 * SSO always sends users back to the app root (the landing page). If this tab started a
 * sign-in from the sign-in page, resume where the user was headed; otherwise show the landing page.
 */
export const resumeAfterSignInGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) {
    return true;
  }
  const target = auth.consumePendingReturnUrl();
  return target ? inject(Router).parseUrl(target) : true;
};
