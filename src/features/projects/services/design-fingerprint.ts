import { defaultConfig, type QRConfig } from "@/lib/qr-engine";
import { defaultFrameConfig, type FrameConfig } from "@/lib/types";

/**
 * A stable identity for a design.
 *
 * Sync has to answer one question cheaply and often: "has this changed since I
 * last saved it?" Comparing whole documents means keeping a second copy of an
 * embedded logo in memory, so a short digest stands in for the document.
 *
 * This is change detection, not security, so a fast non-cryptographic hash is
 * the right tool — a collision would mean skipping one save, not exposing
 * anything.
 */

/** JSON with keys in a fixed order, so two equal designs hash the same. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

  return `{${entries.join(",")}}`;
}

/** FNV-1a, 32-bit, rendered as hex. */
function hash(input: string): string {
  let value = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value.toString(16).padStart(8, "0");
}

export function fingerprintDesign(config: QRConfig, frame: FrameConfig): string {
  // Length is mixed in so two documents that collide on the hash still have to
  // agree on size before sync treats them as identical.
  const serialized = stableStringify({ config, frame });
  return `${hash(serialized)}-${serialized.length.toString(36)}`;
}

const PRISTINE = fingerprintDesign(defaultConfig, defaultFrameConfig);

/**
 * True when the design is still the untouched default.
 *
 * Signing in should not litter an account with a project for a design the user
 * never actually edited.
 */
export function isPristineDesign(config: QRConfig, frame: FrameConfig): boolean {
  return fingerprintDesign(config, frame) === PRISTINE;
}
