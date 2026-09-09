/**
 * Typed client for the Laravel users module.
 *
 * Endpoints mirror the analytics client's shape:
 *   {VITE_API_URL}/api/v1/qr-design-studio/auth/{action}
 *
 * Unlike analytics, nothing here is fire-and-forget. A failed sign-in has to
 * reach the form as a message the user can act on, so every call resolves to a
 * typed error instead of being swallowed.
 */

const DEFAULT_API_URL = "https://console.moatasem.dev";

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

/** Field name -> messages, as Laravel's validator returns them. */
export type FieldErrors = Record<string, string[]>;

export class AuthApiError extends Error {
  readonly status: number;
  /** The backend's own `code`, e.g. `INVALID_CREDENTIALS`. */
  readonly code: string | null;
  readonly fieldErrors: FieldErrors;

  constructor(message: string, status: number, code: string | null = null, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  /** True when the network never reached the API, as opposed to a rejection. */
  get isOffline(): boolean {
    return this.status === 0;
  }
}

function authEndpoint(action: string): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined) || DEFAULT_API_URL;
  const base = configured.replace(/\/+$/, "");
  const prefix = base.endsWith("/api/v1") ? base : `${base}/api/v1`;

  return `${prefix}/qr-design-studio/auth/${action}`;
}

/**
 * The console wraps successful and business-rule responses in
 * `{ success, message, data, code }`, but Laravel's own auth middleware
 * rejects a bad token with a bare `{ message }`. Both have to be understood,
 * or an expired session surfaces as "something went wrong".
 */
interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  code?: string | null;
  data?: T | FieldErrors;
}

async function request<T>(
  action: string,
  init: { method: "GET" | "POST"; body?: unknown; token?: string | null },
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  let response: Response;
  try {
    response = await fetch(authEndpoint(action), {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    throw new AuthApiError("network", 0);
  }

  let envelope: ApiEnvelope<T> = {};
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // A gateway error page is not JSON. The status still tells the story.
  }

  if (!response.ok || envelope.success === false) {
    const fieldErrors: FieldErrors = {};
    const data = envelope.data;
    // On a 422 the envelope's `data` is the validator's field map, not a payload.
    if (response.status === 422 && data && typeof data === "object" && !Array.isArray(data)) {
      for (const [field, messages] of Object.entries(data as FieldErrors)) {
        if (Array.isArray(messages)) fieldErrors[field] = messages.map(String);
      }
    }

    throw new AuthApiError(
      envelope.message ?? "request_failed",
      response.status,
      envelope.code ?? null,
      fieldErrors,
    );
  }

  return envelope.data as T;
}

export function register(input: RegisterInput): Promise<AuthSession> {
  return request<AuthSession>("register", { method: "POST", body: input });
}

export function login(input: LoginInput): Promise<AuthSession> {
  return request<AuthSession>("login", { method: "POST", body: input });
}

export function fetchCurrentUser(token: string): Promise<AuthUser> {
  return request<AuthUser>("me", { method: "GET", token });
}

export function logout(token: string): Promise<unknown> {
  return request<unknown>("logout", { method: "POST", body: {}, token });
}
