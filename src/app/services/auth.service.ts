import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { StoreService } from './store.service';

/**
 * Sign-in is handled by the Domain SSO app (github/sso). SSO does not hand a token back:
 * after sign-in it stores its state in localStorage["sso"] = { auth: { token, user }, ... }
 * and redirects to the app's registered URL. Apps served from the same origin
 * (domain.com in production, localhost:4200 + proxy in dev) read the session from there.
 */
export const SSO_STORAGE_KEY = 'sso';
/** Where a signed-in user goes when there is no (valid) return URL. */
export const DEFAULT_SIGNED_IN_URL = '/dashboard';

/** Per-tab: survives the same-tab round trip to SSO, never leaks into other tabs. */
const RETURN_URL_KEY = environment.localStorageKey + 'ReturnUrl';
/** Per-tab: a token the API rejected, so it is not trusted again until SSO issues a new one. */
const REJECTED_TOKEN_KEY = environment.localStorageKey + 'RejectedToken';

const SSO_APP_ID = environment.sso.appId || environment.api.accessCode;

export interface SsoSession {
  /** Raw JWT, without the "Bearer " prefix. */
  jwt: string;
  userId: string;
  username: string;
  type: string;
  /** Expiry in seconds since epoch. Current SSO tokens have none (they live as long as the server session). */
  exp?: number;
}

export interface SsoUser {
  id: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
}

/** Decodes a JWT payload without verifying it; the API verifies the signature on every call. */
export function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Turns SSO's stored token ("Bearer <jwt>") into a session, or null if it is missing, malformed or expired. */
export function toSession(rawToken: unknown, nowSeconds = Date.now() / 1000): SsoSession | null {
  if (typeof rawToken !== 'string') {
    return null;
  }
  const jwt = rawToken.replace(/^Bearer\s+/i, '').trim();
  const payload = decodeJwtPayload(jwt);
  if (!payload) {
    return null;
  }
  const sub = payload['sub'];
  if ((typeof sub !== 'string' && typeof sub !== 'number') || sub === '') {
    return null;
  }
  const exp = typeof payload['exp'] === 'number' ? payload['exp'] : undefined;
  if (exp !== undefined && exp <= nowSeconds) {
    return null;
  }
  return {
    jwt,
    userId: String(sub),
    username: asString(payload['username']),
    type: asString(payload['type']),
    exp,
  };
}

/** Reads SSO's persisted state (the raw localStorage["sso"] string). */
export function readSsoState(raw: string | null, nowSeconds = Date.now() / 1000): { session: SsoSession | null; user: SsoUser | null } {
  if (!raw) {
    return { session: null, user: null };
  }
  try {
    const state = JSON.parse(raw);
    const auth = state && typeof state === 'object' ? state.auth : null;
    const session = toSession(auth?.token, nowSeconds);
    return { session, user: session ? toUser(auth?.user) : null };
  } catch {
    return { session: null, user: null };
  }
}

/**
 * Accepts only in-app paths ("/todos?x=1"), so a crafted ?returnUrl= can never send the
 * user to another site. Returns null for anything else, including the sign-in page itself.
 */
export function sanitizeReturnUrl(url: unknown): string | null {
  if (typeof url !== 'string') {
    return null;
  }
  const value = url.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) {
    return null;
  }
  const path = value.split(/[?#]/)[0];
  if (path === '/login' || path.startsWith('/login/')) {
    return null;
  }
  return value;
}

export function toUser(value: unknown): SsoUser | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const v = value as Record<string, unknown>;
  const user: SsoUser = {
    id: asString(v['id']),
    email: asString(v['email']),
    username: asString(v['username']),
    firstname: asString(v['firstname']),
    lastname: asString(v['lastname']),
  };
  return user.id || user.email || user.username ? user : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function storageGet(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function storageSet(storage: () => Storage, key: string, value: string): void {
  try {
    storage().setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode, quota); auth still works for this page load.
  }
}

function storageRemove(storage: () => Storage, key: string): void {
  try {
    storage().removeItem(key);
  } catch {
    // ignore
  }
}

const localStore = () => localStorage;
const sessionStore = () => sessionStorage;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  localId: string = "";
  uid: string = "";

  private readonly apiService = inject(ApiService);
  private readonly storeService = inject(StoreService);
  private readonly zone = inject(NgZone);

  private readonly _session = signal<SsoSession | null>(null);
  private readonly _user = signal<SsoUser | null>(null);

  readonly session = this._session.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);

  readonly displayName = computed(() => {
    const user = this._user();
    const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(' ');
    return fullName || user?.username || user?.email || this._session()?.username || 'Account';
  });
  readonly email = computed(() => this._user()?.email || '');
  readonly initials = computed(() => {
    const user = this._user();
    const fromNames = (user?.firstname?.[0] ?? '') + (user?.lastname?.[0] ?? '');
    const fallback = (user?.username || user?.email || this._session()?.username || '?')[0];
    return (fromNames || fallback).toUpperCase();
  });

  readonly signInUrl = this.ssoUrl('sign-in');
  readonly signUpUrl = this.ssoUrl('sign-up');
  readonly signOutUrl = this.ssoUrl('logout');

  constructor() {
    this.initLocalID();
    this.initUID();
    this._session.set(this.readValidSession());
    this._user.set(this._session() ? readSsoState(storageGet(localStore, SSO_STORAGE_KEY)).user : null);
    this.listenForSessionChanges();
  }

  /** Value for the Authorization header ("Bearer <jwt>"), or '' when signed out. */
  get token(): string {
    const current = this._session();
    return current ? `Bearer ${current.jwt}` : '';
  }

  /** Remembers where to go after the SSO round trip (falls back to the dashboard). */
  setPendingReturnUrl(url: unknown): void {
    storageSet(sessionStore, RETURN_URL_KEY, sanitizeReturnUrl(url) ?? DEFAULT_SIGNED_IN_URL);
  }

  consumePendingReturnUrl(): string | null {
    const url = sanitizeReturnUrl(storageGet(sessionStore, RETURN_URL_KEY));
    storageRemove(sessionStore, RETURN_URL_KEY);
    return url;
  }

  /**
   * Confirms the session with the API in the background and loads the profile. Signed-in
   * pages render straight away from the local token (works offline); if the server says the
   * session is gone, the token is marked rejected and the page reloads into the sign-in flow.
   */
  verifySession(): void {
    const current = this._session();
    if (!current) {
      return;
    }
    this.apiService.getUserInfo().subscribe({
      next: (res) => {
        const user = toUser(res?.data);
        if (user && this._session()?.jwt === current.jwt) {
          this._user.set(user);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (this.isSessionRejected(err)) {
          storageSet(sessionStore, REJECTED_TOKEN_KEY, current.jwt);
          this.reload();
        }
      },
    });
  }

  /** Clears this app's cached data, then hands over to SSO, which ends the session for all Domain apps. */
  signOut(): void {
    this.storeService.clearAll();
    storageRemove(sessionStore, RETURN_URL_KEY);
    window.location.assign(this.signOutUrl);
  }

  /** The session from SSO's storage, ignoring a token the API already rejected in this tab. */
  private readValidSession(): SsoSession | null {
    const { session: current } = readSsoState(storageGet(localStore, SSO_STORAGE_KEY));
    return current && current.jwt !== storageGet(sessionStore, REJECTED_TOKEN_KEY) ? current : null;
  }

  /**
   * Signing in or out in another tab (SSO or this app) changes localStorage["sso"]. Reloading
   * then gives a clean start: guards re-run, cached data and in-memory state match the new user.
   * SSO rewrites that key on every store action, so only a real token change triggers this.
   */
  private listenForSessionChanges(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.zone.runOutsideAngular(() => {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key !== null && event.key !== SSO_STORAGE_KEY) {
          return;
        }
        const before = this._session()?.jwt ?? '';
        const after = this.readValidSession()?.jwt ?? '';
        if (before !== after) {
          this.reload();
        }
      });
    });
  }

  /**
   * awb answers 403 both for a bad session and for a bad AccessCode ("Access denied").
   * Only the former means the user must sign in again.
   */
  private isSessionRejected(err: HttpErrorResponse): boolean {
    if (err.status === 401) {
      return true;
    }
    return err.status === 403 && err.error?.message !== 'Access denied';
  }

  private reload(): void {
    window.location.reload();
  }

  private ssoUrl(path: 'sign-in' | 'sign-up' | 'logout'): string {
    const base = environment.sso.url.endsWith('/') ? environment.sso.url : environment.sso.url + '/';
    const query = SSO_APP_ID ? '?' + new URLSearchParams({ appId: SSO_APP_ID }).toString() : '';
    return base + path + query;
  }

  private initLocalID() {
    const li = storageGet(localStore, "li");
    if (li) {
      this.localId = li;
    } else {
      this.localId = (+new Date()).toString(36);
      storageSet(localStore, "li", this.localId);
    }
  }
  private initUID() {
    const uid = storageGet(localStore, "uid");
    if (uid) {
      this.uid = uid;
    }
  }
}
