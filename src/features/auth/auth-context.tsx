import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  AuthApiError,
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from "@/features/auth/api/auth-api";
import {
  clearSession,
  readCachedUser,
  readToken,
  storeSession,
  storeUser,
} from "@/features/auth/services/auth-storage";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  /** True until the stored token has been checked against the API. */
  loading: boolean;
  signedIn: boolean;
  register: (input: RegisterInput) => Promise<AuthUser>;
  login: (input: LoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [user, setUser] = useState<AuthUser | null>(() => (readToken() ? readCachedUser() : null));
  const [loading, setLoading] = useState<boolean>(() => readToken() !== null);
  const verifiedRef = useRef(false);

  /*
    A stored token proves nothing on its own: it may have been revoked from
    another device, or the account deleted from the console. It is verified
    once on boot, and a rejection clears the session rather than leaving the
    UI showing a name that no longer signs anything.
  */
  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const stored = readToken();
    if (!stored) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchCurrentUser(stored)
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        storeUser(fresh);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // A network blip must not sign the user out; only a real rejection does.
        if (error instanceof AuthApiError && error.isOffline) return;
        clearSession();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const adoptSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    storeSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
    setLoading(false);
    return nextUser;
  }, []);

  const register = useCallback(
    async (input: RegisterInput) => {
      const session = await registerRequest(input);
      return adoptSession(session.token, session.user);
    },
    [adoptSession],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await loginRequest(input);
      return adoptSession(session.token, session.user);
    },
    [adoptSession],
  );

  const logout = useCallback(async () => {
    const current = token;
    // The local session goes first: if the request fails, the user is still
    // signed out on this device, which is what they asked for.
    clearSession();
    setToken(null);
    setUser(null);

    if (!current) return;
    try {
      await logoutRequest(current);
    } catch {
      // The token stays valid server-side until it expires. Nothing to show.
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, signedIn: Boolean(token && user), register, login, logout }),
    [loading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
