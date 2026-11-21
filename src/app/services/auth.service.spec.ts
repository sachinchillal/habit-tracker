import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import {
  AuthService, DEFAULT_SIGNED_IN_URL, SSO_STORAGE_KEY, readSsoState, sanitizeReturnUrl, toSession,
} from './auth.service';
import { authGuard, guestGuard, resumeAfterSignInGuard } from './auth.guards';

const RETURN_URL_KEY = environment.localStorageKey + 'ReturnUrl';
const REJECTED_TOKEN_KEY = environment.localStorageKey + 'RejectedToken';

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeJwt(payload: object): string {
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.signature`;
}

function storeSsoToken(jwt: string, user: object = {}): void {
  localStorage.setItem(SSO_STORAGE_KEY, JSON.stringify({ auth: { token: 'Bearer ' + jwt, user }, apps: {} }));
}

describe('auth helpers', () => {
  const jwt = makeJwt({ sub: 42, username: 'sam', sid: 7, type: 'USER' });

  it('reads a session from SSO state', () => {
    const { session, user } = readSsoState(JSON.stringify({ auth: { token: 'Bearer ' + jwt, user: { email: 'sam@example.com' } } }));
    expect(session).toEqual({ jwt, userId: '42', username: 'sam', type: 'USER', exp: undefined });
    expect(user?.email).toBe('sam@example.com');
  });

  it('rejects missing, malformed and expired tokens', () => {
    expect(readSsoState(null).session).toBeNull();
    expect(readSsoState('not json').session).toBeNull();
    expect(readSsoState(JSON.stringify({ auth: { token: '' } })).session).toBeNull();
    expect(toSession('Bearer abc.def')).toBeNull();
    expect(toSession('Bearer a.!!!.c')).toBeNull();
    expect(toSession('Bearer ' + makeJwt({ username: 'no-sub' }))).toBeNull();
    expect(toSession('Bearer ' + makeJwt({ sub: '1', exp: 1000 }), 2000)).toBeNull();
    expect(toSession('Bearer ' + makeJwt({ sub: '1', exp: 3000 }), 2000)?.userId).toBe('1');
  });

  it('accepts only in-app return URLs', () => {
    expect(sanitizeReturnUrl('/todos')).toBe('/todos');
    expect(sanitizeReturnUrl('/tree?category=3#top')).toBe('/tree?category=3#top');
    for (const bad of ['//evil.com', 'https://evil.com', 'todos', '/\\evil.com', '/login', '/login?returnUrl=/x', ' javascript:alert(1)', '', null, 42]) {
      expect(sanitizeReturnUrl(bad)).withContext(String(bad)).toBeNull();
    }
  });
});

describe('AuthService and guards', () => {
  const jwt = makeJwt({ sub: 'u1', username: 'sam', sid: 's1', type: 'USER' });

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    return { auth: TestBed.inject(AuthService), router: TestBed.inject(Router) };
  }

  function route(queryParams: Record<string, string> = {}): ActivatedRouteSnapshot {
    return { queryParamMap: convertToParamMap(queryParams) } as ActivatedRouteSnapshot;
  }

  function state(url: string): RouterStateSnapshot {
    return { url } as RouterStateSnapshot;
  }

  function run<T>(fn: () => T): T {
    return TestBed.runInInjectionContext(fn);
  }

  function serialize(result: unknown): string | boolean {
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : (result as boolean);
  }

  beforeEach(() => {
    localStorage.removeItem(SSO_STORAGE_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    sessionStorage.removeItem(REJECTED_TOKEN_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(SSO_STORAGE_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    sessionStorage.removeItem(REJECTED_TOKEN_KEY);
  });

  it('is signed out without an SSO token, and authGuard sends to /login with the return URL', () => {
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBeFalse();
    expect(auth.token).toBe('');
    expect(serialize(run(() => authGuard(route(), state('/todos?x=1'))))).toBe('/login?returnUrl=%2Ftodos%3Fx%3D1');
  });

  it('is signed in with an SSO token and lets protected pages through', () => {
    storeSsoToken(jwt, { firstname: 'Sam', lastname: 'Lee', email: 'sam@example.com', id: 'u1' });
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBeTrue();
    expect(auth.token).toBe('Bearer ' + jwt);
    expect(auth.displayName()).toBe('Sam Lee');
    expect(auth.initials()).toBe('SL');
    expect(run(() => authGuard(route(), state('/todos')))).toBeTrue();
  });

  it('ignores a token the API already rejected in this tab', () => {
    storeSsoToken(jwt);
    sessionStorage.setItem(REJECTED_TOKEN_KEY, jwt);
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBeFalse();
  });

  it('builds SSO URLs with the app id', () => {
    const { auth } = setup();
    const appId = encodeURIComponent(environment.sso.appId || environment.api.accessCode);
    expect(auth.signInUrl).toBe(`${environment.sso.url}sign-in?appId=${appId}`);
    expect(auth.signUpUrl).toBe(`${environment.sso.url}sign-up?appId=${appId}`);
    expect(auth.signOutUrl).toBe(`${environment.sso.url}logout?appId=${appId}`);
  });

  it('stores only safe pending return URLs, defaulting to the dashboard', () => {
    const { auth } = setup();
    auth.setPendingReturnUrl('//evil.com');
    expect(auth.consumePendingReturnUrl()).toBe(DEFAULT_SIGNED_IN_URL);
    auth.setPendingReturnUrl('/category');
    expect(auth.consumePendingReturnUrl()).toBe('/category');
    expect(auth.consumePendingReturnUrl()).toBeNull();
  });

  it('guestGuard shows /login when signed out and skips it when signed in', () => {
    setup();
    expect(run(() => guestGuard(route({ returnUrl: '/todos' }), state('/login')))).toBeTrue();
    TestBed.resetTestingModule();

    storeSsoToken(jwt);
    setup();
    expect(serialize(run(() => guestGuard(route({ returnUrl: '/todos' }), state('/login'))))).toBe('/todos');
    expect(serialize(run(() => guestGuard(route({ returnUrl: 'https://evil.com' }), state('/login'))))).toBe(DEFAULT_SIGNED_IN_URL);
  });

  it('resumeAfterSignInGuard continues to the pending page after SSO returns to the root', () => {
    storeSsoToken(jwt);
    const { auth } = setup();
    expect(run(() => resumeAfterSignInGuard(route(), state('/')))).toBeTrue();

    auth.setPendingReturnUrl('/tree');
    expect(serialize(run(() => resumeAfterSignInGuard(route(), state('/'))))).toBe('/tree');
    // Consumed: a later visit to the landing page stays there.
    expect(run(() => resumeAfterSignInGuard(route(), state('/')))).toBeTrue();
  });

  it('verifySession loads the profile from the API', () => {
    storeSsoToken(jwt);
    const { auth } = setup();
    const http = TestBed.inject(HttpTestingController);
    auth.verifySession();
    const req = http.expectOne(`${environment.api.baseUrl}auth/userinfo`);
    expect(req.request.headers.get('Authorization')).toBeNull(); // no interceptor in this test setup
    req.flush({ data: { id: 'u1', email: 'sam@example.com', firstname: 'Sam', lastname: '' }, status: 'success' });
    expect(auth.displayName()).toBe('Sam');
    http.verify();
  });

  it('verifySession remembers a rejected token and reloads, but ignores AccessCode errors and network failures', () => {
    storeSsoToken(jwt);
    const { auth } = setup();
    const http = TestBed.inject(HttpTestingController);
    const reload = spyOn(auth as unknown as { reload: () => void }, 'reload');
    const url = `${environment.api.baseUrl}auth/userinfo`;

    auth.verifySession();
    http.expectOne(url).flush({ message: 'Access denied' }, { status: 403, statusText: 'Forbidden' });
    auth.verifySession();
    http.expectOne(url).error(new ProgressEvent('error'), { status: 0 });
    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(REJECTED_TOKEN_KEY)).toBeNull();

    auth.verifySession();
    http.expectOne(url).flush({ message: 'Session has been expired. Please login again.' }, { status: 403, statusText: 'Forbidden' });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(REJECTED_TOKEN_KEY)).toBe(jwt);
    http.verify();
  });
});
