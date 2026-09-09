import type { AuthUser } from "@/features/auth/api/auth-api";

/**
 * Where the session lives between reloads.
 *
 * The token is a Sanctum bearer token, so it has to be readable by JavaScript
 * to be sent as a header — a cookie would need the API and the studio to share
 * a domain, which they do not. The cached user is only there so the header can
 * render a name on first paint instead of flashing "signed out"; the token is
 * always re-verified against `auth/me` before it is trusted.
 */

const TOKEN_KEY = "qr_design_studio_auth_token:v1";
const USER_KEY = "qr_design_studio_auth_user:v1";

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private mode or blocked storage: the session simply does not persist.
    return null;
  }
}

export function readCachedUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AuthUser;
    return typeof parsed?.email === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Nothing to do: the session stays in memory for this tab only.
  }
}

export function storeUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // As above.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // As above.
  }
}
