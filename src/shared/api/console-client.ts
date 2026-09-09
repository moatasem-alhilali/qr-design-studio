/**
 * One HTTP client for every call into the Laravel console.
 *
 * Endpoints all share the module prefix:
 *   {VITE_API_URL}/api/v1/qr-design-studio/{module}/{action}
 *
 * The console wraps its answers in `{ success, message, data, code }`, but
 * Laravel's own auth middleware rejects a bad token with a bare `{ message }`.
 * Both shapes are understood here so no caller has to guess, and an expired
 * session never surfaces as "something went wrong".
 */

const DEFAULT_API_URL = "https://console.moatasem.dev";

/** Field name -> messages, as Laravel's validator returns them. */
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  /** The backend's own `code`, e.g. `INVALID_CREDENTIALS` or `PROJECT_CONFLICT`. */
  readonly code: string | null;
  readonly fieldErrors: FieldErrors;
  /** Extra payload the backend attached, such as the current row on a conflict. */
  readonly data: unknown;

  constructor(
    message: string,
    status: number,
    code: string | null = null,
    fieldErrors: FieldErrors = {},
    data: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.data = data;
  }

  /** True when the network never reached the API, as opposed to a rejection. */
  get isOffline(): boolean {
    return this.status === 0;
  }

  /** The session is gone: signed out elsewhere, revoked, or expired. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }
}

export function consoleEndpoint(path: string): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined) || DEFAULT_API_URL;
  const base = configured.replace(/\/+$/, "");
  const prefix = base.endsWith("/api/v1") ? base : `${base}/api/v1`;

  return `${prefix}/qr-design-studio/${path.replace(/^\/+/, "")}`;
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  code?: string | null;
  data?: T | FieldErrors;
}

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
}

export async function requestConsole<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(consoleEndpoint(path), {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    throw new ApiError("network", 0);
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

    throw new ApiError(
      envelope.message ?? "request_failed",
      response.status,
      envelope.code ?? null,
      fieldErrors,
      envelope.data ?? null,
    );
  }

  return envelope.data as T;
}
