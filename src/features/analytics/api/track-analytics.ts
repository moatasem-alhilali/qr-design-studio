import {
  getSessionId,
  getVisitorId,
  hasAnalyticsConsent,
} from "@/features/analytics/services/analytics-identifiers";

export type AnalyticsEventType = "session_start" | "page_view" | "page_leave" | "event";

export interface AnalyticsPayload {
  type: AnalyticsEventType;
  pageViewId?: number | null;
  path?: string | null;
  url?: string | null;
  title?: string | null;
  referrer?: string | null;
  locale?: string | null;
  startedAt?: string | null;
  enteredAt?: string | null;
  durationSeconds?: number | null;
  scrollDepth?: number | null;
  eventName?: string | null;
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
    id?: string | null;
  };
  gclid?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  msclkid?: string | null;
  affiliate?: string | null;
  ref?: string | null;
  affiliate_code?: string | null;
  ref_code?: string | null;
  metadata?: {
    screenWidth?: number;
    screenHeight?: number;
    viewportWidth?: number;
    viewportHeight?: number;
    language?: string;
  };
}

const DEFAULT_API_URL = "https://console.moatasem.dev";
const SENSITIVE_QUERY_PARAMS = new Set([
  "password",
  "pass",
  "token",
  "secret",
  "jwt",
  "auth",
  "session",
  "access_token",
  "refresh_token",
  "id_token",
  "api_key",
  "apikey",
]);

function analyticsEndpoint(): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined) || DEFAULT_API_URL;
  const base = configured.replace(/\/+$/, "");

  return base.endsWith("/api/v1")
    ? `${base}/qr-design-studio/analytics/track`
    : `${base}/api/v1/qr-design-studio/analytics/track`;
}

function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);

    SENSITIVE_QUERY_PARAMS.forEach((param) => url.searchParams.delete(param));

    return url.toString();
  } catch {
    return value.slice(0, 2048);
  }
}

export function getUtmParams(searchParams: URLSearchParams): Partial<AnalyticsPayload> {
  const value = (key: string) => searchParams.get(key);

  return {
    utm: {
      source: value("utm_source"),
      medium: value("utm_medium"),
      campaign: value("utm_campaign"),
      term: value("utm_term"),
      content: value("utm_content"),
      id: value("utm_id"),
    },
    gclid: value("gclid"),
    fbclid: value("fbclid"),
    ttclid: value("ttclid"),
    msclkid: value("msclkid"),
    affiliate: value("affiliate"),
    ref: value("ref"),
    affiliate_code: value("affiliate_code"),
    ref_code: value("ref_code"),
  };
}

export function safeAnalyticsMetadata(): AnalyticsPayload["metadata"] {
  if (typeof window === "undefined") return undefined;

  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    language: navigator.language,
  };
}

export function currentAnalyticsUrl(): string | null {
  if (typeof window === "undefined") return null;

  return safeUrl(window.location.href);
}

export function referrerAnalyticsUrl(): string | null {
  if (typeof document === "undefined") return null;

  return safeUrl(document.referrer);
}

export function trackAnalyticsEvent(payload: AnalyticsPayload): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const body = JSON.stringify({
    ...payload,
    url: safeUrl(payload.url),
    referrer: safeUrl(payload.referrer),
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
  });

  try {
    const endpoint = analyticsEndpoint();

    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        endpoint,
        new Blob([body], { type: "application/json" }),
      );

      if (sent) return;
    }

    void fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
      cache: "no-store",
      credentials: "omit",
    }).catch(() => undefined);
  } catch {
    // Analytics is non-critical and must never affect QR generation or exports.
  }
}
