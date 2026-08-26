import {
  createHighResQRCanvas,
  getEncodedPayload,
  QRCapacityError,
  type QRConfig,
} from "@/lib/qr-engine";

/**
 * Actually decode the code we just drew.
 *
 * The reliability panel scores a design with heuristics — contrast ratios,
 * logo size, module shape. Useful, but it is an opinion. This reads the
 * rendered pixels back with the browser's own barcode decoder and compares the
 * result against the payload we meant to encode, which turns "this should
 * scan" into "this scanned".
 *
 * It matters most exactly where the heuristics are weakest: a logo covering
 * the centre, a low-contrast palette, or a decorative module shape that error
 * correction can no longer rescue.
 */

export type VerifyStatus = "verified" | "mismatch" | "unreadable" | "unsupported" | "error";

export interface VerifyResult {
  status: VerifyStatus;
  /** What the decoder read back, when it managed to read anything. */
  decoded?: string;
  /** What we intended to encode. */
  expected?: string;
}

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function getDetectorCtor(): BarcodeDetectorCtor | null {
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return typeof ctor === "function" ? ctor : null;
}

export function isVerificationSupported(): boolean {
  return typeof window !== "undefined" && getDetectorCtor() !== null;
}

/**
 * Decoders want a realistic scan target, not a 2400px plate. Rendering around
 * 600px mimics a phone camera framing the code and keeps detection fast.
 */
const VERIFY_RENDER_PX = 600;

export async function verifyQR(config: QRConfig): Promise<VerifyResult> {
  const Detector = getDetectorCtor();
  if (!Detector) return { status: "unsupported" };

  let expected: string;
  let canvas: HTMLCanvasElement;
  try {
    expected = getEncodedPayload(config);
    const ratio = Math.max(1, Math.round(VERIFY_RENDER_PX / Math.max(1, config.size)));
    canvas = await createHighResQRCanvas(config, ratio);
  } catch (cause) {
    if (cause instanceof QRCapacityError) return { status: "error" };
    return { status: "error" };
  }

  try {
    const detector = new Detector({ formats: ["qr_code"] });
    const found = await detector.detect(canvas);
    if (!found.length) return { status: "unreadable", expected };

    const decoded = found[0].rawValue;
    // Normalise line endings: vCard and iCalendar use CRLF, and decoders are
    // inconsistent about preserving it.
    const same = decoded.replace(/\r\n/g, "\n") === expected.replace(/\r\n/g, "\n");
    return { status: same ? "verified" : "mismatch", decoded, expected };
  } catch {
    return { status: "error", expected };
  }
}
