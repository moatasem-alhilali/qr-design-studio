import { defaultConfig, type QRConfig } from "@/lib/qr-engine";
import { defaultFrameConfig, type FrameConfig } from "@/lib/types";

/**
 * A design is a job ticket: it survives a refresh, it can be handed to someone
 * as a file, and it can be sent as a link. Previously a reload lost everything,
 * which is a strange property for a design tool.
 */

const DESIGN_STORAGE_KEY = "qr_design_studio_design:v1";
const SHARE_PARAM = "d";

export interface DesignTicket {
  version: 1;
  config: QRConfig;
  frame: FrameConfig;
  savedAt?: string;
}

/** Merges a loaded ticket over the defaults so older files stay loadable. */
export function hydrateTicket(raw: unknown): DesignTicket | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<DesignTicket>;
  if (!candidate.config || typeof candidate.config !== "object") return null;

  return {
    version: 1,
    config: {
      ...defaultConfig,
      ...candidate.config,
      fields: { ...defaultConfig.fields, ...(candidate.config.fields ?? {}) },
    },
    frame: { ...defaultFrameConfig, ...(candidate.frame ?? {}) },
    savedAt: candidate.savedAt,
  };
}

export function saveDesignLocally(config: QRConfig, frame: FrameConfig): void {
  try {
    const ticket: DesignTicket = { version: 1, config, frame, savedAt: new Date().toISOString() };
    localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(ticket));
  } catch {
    // Storage full or blocked: autosave is a convenience, never a blocker.
  }
}

export function loadDesignLocally(): DesignTicket | null {
  try {
    const stored = localStorage.getItem(DESIGN_STORAGE_KEY);
    if (!stored) return null;
    return hydrateTicket(JSON.parse(stored));
  } catch {
    return null;
  }
}

export function clearSavedDesign(): void {
  try {
    localStorage.removeItem(DESIGN_STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}

/* ------------------------------------------------------------------ files */

export function downloadDesignTicket(config: QRConfig, frame: FrameConfig, filename = "qr-job-ticket.json"): void {
  const ticket: DesignTicket = { version: 1, config, frame, savedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function readDesignTicket(file: File): Promise<DesignTicket | null> {
  try {
    return hydrateTicket(JSON.parse(await file.text()));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- share link */

/** base64url over UTF-8, so Arabic content survives the round trip. */
function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Share links deliberately drop the logo. It is a data URL that can run to
 * hundreds of kilobytes, and browsers and chat apps truncate long URLs — a
 * link that silently breaks is worse than one that arrives without the logo.
 */
export function buildShareUrl(config: QRConfig, frame: FrameConfig, baseUrl = window.location.origin): string {
  const { logoUrl: _logoUrl, ...shareableConfig } = config;
  const payload = JSON.stringify({ version: 1, config: shareableConfig, frame });
  return `${baseUrl}/?${SHARE_PARAM}=${encodeBase64Url(payload)}`;
}

export function readShareParam(search: string): DesignTicket | null {
  const encoded = new URLSearchParams(search).get(SHARE_PARAM);
  if (!encoded) return null;
  try {
    return hydrateTicket(JSON.parse(decodeBase64Url(encoded)));
  } catch {
    return null;
  }
}

export function designHasLogo(config: QRConfig): boolean {
  return Boolean(config.logoUrl);
}
