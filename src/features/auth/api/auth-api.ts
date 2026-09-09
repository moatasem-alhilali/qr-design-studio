import { requestConsole } from "@/shared/api/console-client";

/**
 * Typed client for the Laravel users module.
 *
 * Unlike analytics, nothing here is fire-and-forget. A failed sign-in has to
 * reach the form as a message the user can act on, so every call resolves to a
 * typed `ApiError` instead of being swallowed.
 */

export { ApiError as AuthApiError, type FieldErrors } from "@/shared/api/console-client";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string | null;
}

export interface AuthSession {
  token: string;
  tokenType: string;
  user: AuthUser;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function register(input: RegisterInput): Promise<AuthSession> {
  return requestConsole<AuthSession>("auth/register", { method: "POST", body: input });
}

export function login(input: LoginInput): Promise<AuthSession> {
  return requestConsole<AuthSession>("auth/login", { method: "POST", body: input });
}

export function fetchCurrentUser(token: string): Promise<AuthUser> {
  return requestConsole<AuthUser>("auth/me", { method: "GET", token });
}

export function logout(token: string): Promise<unknown> {
  return requestConsole<unknown>("auth/logout", { method: "POST", body: {}, token });
}
