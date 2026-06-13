export type AnalyticsConsent = "accepted" | "declined";

const STORAGE_VERSION = "v1";
const CONSENT_KEY = `qr_design_studio_analytics_consent:${STORAGE_VERSION}`;
const VISITOR_ID_KEY = `qr_design_studio_analytics_visitor_id:${STORAGE_VERSION}`;
const SESSION_ID_KEY = `qr_design_studio_analytics_session_id:${STORAGE_VERSION}`;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function newId(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be disabled or unavailable in private browsing; analytics stays best-effort.
  }
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (!canUseBrowserStorage()) return null;

  const value = safeGet(localStorage, CONSENT_KEY);
  return value === "accepted" || value === "declined" ? value : null;
}

export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === "accepted";
}

export function setAnalyticsConsent(consent: AnalyticsConsent): void {
  if (!canUseBrowserStorage()) return;

  safeSet(localStorage, CONSENT_KEY, consent);
}

export function getVisitorId(): string {
  if (!canUseBrowserStorage()) {
    memoryVisitorId ??= newId();
    return memoryVisitorId;
  }

  const existing = safeGet(localStorage, VISITOR_ID_KEY);

  if (existing && UUID_PATTERN.test(existing)) {
    return existing;
  }

  const id = newId();
  safeSet(localStorage, VISITOR_ID_KEY, id);

  return id;
}

export function getSessionId(): string {
  if (!canUseBrowserStorage()) {
    memorySessionId ??= newId();
    return memorySessionId;
  }

  const existing = safeGet(sessionStorage, SESSION_ID_KEY);

  if (existing && UUID_PATTERN.test(existing)) {
    return existing;
  }

  const id = newId();
  safeSet(sessionStorage, SESSION_ID_KEY, id);

  return id;
}

export function getSessionFlag(key: string): string | null {
  if (!canUseBrowserStorage()) return null;

  return safeGet(sessionStorage, key);
}

export function setSessionFlag(key: string, value: string): void {
  if (!canUseBrowserStorage()) return;

  safeSet(sessionStorage, key, value);
}
