import { trackAnalyticsEvent } from "@/features/analytics/api/track-analytics";

/**
 * What people actually do in the studio.
 *
 * Until now the site measured traffic and nothing else: which pages were
 * opened, for how long. That answers "are people arriving?" but never "is the
 * thing any good?" — which data types matter, whether logos get used, whether
 * a design ever reaches an export.
 *
 * The names are a closed list on purpose. Free-form event names rot within
 * weeks: three spellings of the same action, and no way to know which one the
 * dashboard is counting.
 */
export type ProductEvent =
  /** A design's data type was chosen — url, wifi, vcard, and so on. */
  | "data_type_selected"
  /** A logo image was added to the design. */
  | "logo_uploaded"
  /** The logo cut, plate or outline was changed. */
  | "logo_styled"
  /** A style preset or template was applied. */
  | "preset_applied"
  | "template_applied"
  /** An export finished, with its format. */
  | "export_completed"
  /** A print sheet was produced. */
  | "print_sheet_created"
  /** The scan-reliability panel was asked to fix the design. */
  | "scan_tuned"
  /** A batch run finished. */
  | "batch_generated"
  /** Account lifecycle. */
  | "account_registered"
  | "account_signed_in"
  /** Saved designs. */
  | "project_created"
  | "project_opened"
  /** The share link was copied. */
  | "share_link_copied";

/** Scalars only. Never design content, payloads, logos or personal data. */
export type EventProps = Record<string, string | number | boolean | null>;

function newEventId(): string {
  try {
    if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // Falls through to the timestamp form below.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Records one product event.
 *
 * Consent is enforced downstream in `trackAnalyticsEvent`, and every failure
 * there is swallowed — measuring the studio must never be able to break it.
 */
export function trackProductEvent(name: ProductEvent, props: EventProps = {}): void {
  if (typeof window === "undefined") return;

  trackAnalyticsEvent({
    type: "event",
    eventName: name,
    eventId: newEventId(),
    occurredAt: new Date().toISOString(),
    path: window.location.pathname,
    props,
  });
}

/**
 * How long an exploratory choice has to hold before it counts.
 *
 * Picking a data type or a logo cut is a browsing gesture: somebody tries six
 * shapes in four seconds to see what they look like. Recording each tap would
 * write six rows to say one thing, and the winner — the shape they kept — is
 * the only one that was ever a decision.
 */
const SETTLE_MS = 1500;

const pending = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Records a choice only once the user stops changing their mind.
 *
 * Grouped by event name by default, so rapid changes to the *same* control
 * collapse into the last one. Pass a `key` to keep separate controls apart.
 */
export function trackSettledChoice(
  name: ProductEvent,
  props: EventProps = {},
  key: string = name,
): void {
  if (typeof window === "undefined") return;

  const existing = pending.get(key);
  if (existing !== undefined) clearTimeout(existing);

  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      trackProductEvent(name, props);
    }, SETTLE_MS),
  );
}
