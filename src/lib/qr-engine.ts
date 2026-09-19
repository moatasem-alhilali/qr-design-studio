import qrcode from "qrcode-generator";
import { jsPDF } from "jspdf";

import { byteLength, defaultFields, formatQRPayload, type DataType, type QRFields } from "@/lib/qr-payloads";
import { finderOrigins, finderPath, finderPathToSvg, hasSolidFinder, traceFinderOnCanvas } from "@/lib/qr-finder";

/*
  qrcode-generator encodes byte mode with `charCodeAt(i) & 0xff`, truncating
  every character to a single byte — so "م" (U+0645) went in as 0x45, the
  letter "E". Any Arabic content, in any data type, came back out of a scanner
  as Latin gibberish.

  The CommonJS build at least offers a UTF-8 encoder under
  `stringToBytesFuncs`; the ESM build that bundlers actually resolve does not
  ship one at all, so we install our own. TextEncoder is the right tool: it is
  native, and it handles surrogate pairs (emoji) correctly.

  The library reads this property at call time, so replacing it here covers
  every code the studio generates.
*/
qrcode.stringToBytes = (value: string) => Array.from(new TextEncoder().encode(value));

export type ModuleStyle = "square" | "rounded" | "dots" | "diamond" | "extra-rounded" | "tiny-squares" | "heart" | "star" | "triangle" | "bubble";
export type CornerStyle = "square" | "rounded" | "circle" | "thick" | "minimal" | "decorative" | "ring" | "leaf" | "frame-dots";
export type ColorMode = "single" | "gradient";
/**
 * How the logo artwork itself is cut. "original" letterboxes the picture
 * untouched — every other value crops it to fill the box, the way an avatar
 * cropper does, so a tall logo does not end up as a thin sliver in a circle.
 */
export type LogoShape = "original" | "square" | "rounded" | "circle";
/** Geometry of the plate sitting behind the logo, and of its outline. */
export type LogoPlateShape = "square" | "rounded" | "circle";
export type { DataType, QRFields };

export interface QRConfig {
  data: string;
  dataType: DataType;
  /** Extra values for the structured data types. See `qr-payloads`. */
  fields: QRFields;
  /**
   * Blank margin around the symbol, in modules. The QR specification requires
   * four; without it a code placed on a coloured or busy background loses its
   * boundary and scanners struggle to find the finder patterns.
   */
  quietZone: number;
  moduleStyle: ModuleStyle;
  cornerStyle: CornerStyle;
  colorMode: ColorMode;
  color1: string;
  color2: string;
  bgColor: string;
  transparentBg: boolean;
  gradientAngle: number;
  logoUrl: string | null;
  logoScale: number;
  /** Cut applied to the artwork. See `LogoShape`. */
  logoShape: LogoShape;
  /** Corner radius for the "rounded" shapes, as a percentage of the box side. */
  logoRadius: number;
  /** Breathing room between artwork and plate edge, as a percentage of the box. */
  logoPadding: number;
  /** Whether the backing plate is filled at all. */
  logoPlate: boolean;
  logoPlateShape: LogoPlateShape;
  /** Plate fill. `null` follows the sheet background. */
  logoPlateColor: string | null;
  /** Outline around the plate, as a percentage of the plate side. */
  logoBorderWidth: number;
  logoBorderColor: string;
  size: number;
  errorCorrection: "L" | "M" | "Q" | "H";
}

export const defaultConfig: QRConfig = {
  data: "https://qrcode.moatasem.dev/",
  dataType: "url",
  fields: { ...defaultFields },
  quietZone: 4,
  moduleStyle: "rounded",
  cornerStyle: "rounded",
  colorMode: "single",
  color1: "#6C3AED",
  color2: "#EC4899",
  bgColor: "#FFFFFF",
  transparentBg: false,
  gradientAngle: 135,
  logoUrl: null,
  logoScale: 0.25,
  logoShape: "original",
  logoRadius: 15,
  logoPadding: 15,
  logoPlate: true,
  logoPlateShape: "rounded",
  logoPlateColor: null,
  logoBorderWidth: 0,
  logoBorderColor: "#FFFFFF",
  size: 400,
  errorCorrection: "H",
};

/**
 * Rendering resolution policy.
 *
 * `config.size` is the *logical* design size. Bitmaps are always rasterized at
 * an integer multiple of that size, and every module is snapped to a whole
 * number of device pixels, so module edges stay hard instead of grey and
 * smeared by fractional cell widths.
 */
const MAX_PREVIEW_CANVAS_PX = 1600;
const MAX_EXPORT_CANVAS_PX = 8192;
const TARGET_EXPORT_PX = 2400;

const FALLBACK_DATA = "https://qrcode.moatasem.dev/";

function formatData(config: QRConfig): string {
  if (!config.data.trim()) return FALLBACK_DATA;
  return formatQRPayload({ data: config.data, dataType: config.dataType, fields: config.fields });
}

/** The exact string that gets encoded — used by the verifier and the readouts. */
export function getEncodedPayload(config: QRConfig): string {
  return formatData(config);
}

/**
 * Raised when the payload cannot fit in any QR version at the chosen error
 * correction level. The engine used to let this surface as a bare throw that
 * every caller swallowed, so the preview silently kept displaying the previous
 * code and users exported a file containing the wrong data.
 */
export class QRCapacityError extends Error {
  readonly bytes: number;

  constructor(bytes: number) {
    super(`Payload of ${bytes} bytes exceeds QR capacity`);
    this.name = "QRCapacityError";
    this.bytes = bytes;
  }
}

export interface QRMatrix {
  modules: boolean[][];
  size: number;
}

export function generateQRMatrix(config: QRConfig): QRMatrix {
  // A logo always covers modules, so force the highest error correction level.
  const ecl: QRConfig["errorCorrection"] = config.logoUrl ? "H" : config.errorCorrection;
  const qr = qrcode(0, ecl);

  const formattedData = formatData(config);
  try {
    qr.addData(formattedData);
    qr.make();
  } catch {
    // qrcode-generator throws a bare string when nothing can hold the payload.
    throw new QRCapacityError(byteLength(formattedData));
  }

  const moduleCount = qr.getModuleCount();
  const modules: boolean[][] = [];
  for (let r = 0; r < moduleCount; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < moduleCount; c++) {
      row.push(qr.isDark(r, c));
    }
    modules.push(row);
  }
  return { modules, size: moduleCount };
}

export interface QRPixelMetrics {
  /** Width/height of one module in device pixels. Always an integer. */
  cellSize: number;
  /** Width/height of the rasterized bitmap in device pixels. */
  canvasSize: number;
}

export function getQRPixelMetrics(moduleCount: number, logicalSize: number, pixelRatio: number): QRPixelMetrics {
  const target = Math.max(1, logicalSize) * Math.max(1, pixelRatio);
  const cellSize = Math.max(1, Math.round(target / Math.max(1, moduleCount)));
  return { cellSize, canvasSize: cellSize * moduleCount };
}

export interface QRLayout extends QRPixelMetrics {
  /** Quiet-zone width in modules. */
  quietZone: number;
  /** Modules across the whole bitmap, symbol plus both margins. */
  modulesAcross: number;
  /** Pixel offset of the symbol's top-left module. */
  origin: number;
}

/**
 * Single source of truth for how a symbol maps onto pixels. Everything that
 * draws or measures a QR goes through this so the canvas, the SVG and the
 * readouts cannot drift apart.
 */
export function getQRLayout(moduleCount: number, config: QRConfig, pixelRatio: number): QRLayout {
  const quietZone = Math.max(0, Math.round(config.quietZone ?? 0));
  const modulesAcross = moduleCount + quietZone * 2;
  const { cellSize, canvasSize } = getQRPixelMetrics(modulesAcross, config.size, pixelRatio);
  return { quietZone, modulesAcross, cellSize, canvasSize, origin: quietZone * cellSize };
}

export function getPreviewPixelRatio(logicalSize: number): number {
  const size = Math.max(1, logicalSize);
  const dpr = typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1;
  const desired = Math.min(4, Math.max(2, Math.ceil(dpr * 1.5)));
  const maxRatio = Math.max(1, Math.floor(MAX_PREVIEW_CANVAS_PX / size));
  return Math.max(1, Math.min(desired, maxRatio));
}

export function getExportPixelRatio(logicalSize: number): number {
  const size = Math.max(1, logicalSize);
  const desired = Math.max(3, Math.ceil(TARGET_EXPORT_PX / size));
  const maxRatio = Math.max(1, Math.floor(MAX_EXPORT_CANVAS_PX / size));
  return Math.max(1, Math.min(desired, maxRatio));
}

function isFinderPattern(row: number, col: number, size: number): boolean {
  // Top-left
  if (row < 7 && col < 7) return true;
  // Top-right
  if (row < 7 && col >= size - 7) return true;
  // Bottom-left
  if (row >= size - 7 && col < 7) return true;
  return false;
}

function isFinderPatternOuter(row: number, col: number, size: number): boolean {
  // Check if it's the outer ring of any finder pattern
  const positions = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];
  for (const [pr, pc] of positions) {
    const lr = row - pr;
    const lc = col - pc;
    if (lr >= 0 && lr < 7 && lc >= 0 && lc < 7) {
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    }
  }
  return false;
}

function isFinderPatternInner(row: number, col: number, size: number): boolean {
  const positions = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];
  for (const [pr, pc] of positions) {
    const lr = row - pr;
    const lc = col - pc;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
  }
  return false;
}

/**
 * Decoded logos are cached so a render that already has the bitmap can finish
 * synchronously. Without this, exports fire before `img.onload` and the logo is
 * missing from the exported file even though the preview shows it.
 */
const logoImageCache = new Map<string, HTMLImageElement>();

function getCachedLogo(url: string): HTMLImageElement | null {
  const cached = logoImageCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) return cached;
  return null;
}

export function loadLogoImage(url: string): Promise<HTMLImageElement> {
  const cached = getCachedLogo(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    // Remote logos need CORS to keep the canvas untainted; data URLs never do.
    if (!url.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => {
      logoImageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error("Logo failed to load"));
    img.src = url;
  });
}

export interface QRRenderOptions {
  /** Multiplies `config.size` to produce the bitmap resolution. */
  pixelRatio?: number;
  /** Already-decoded logo. When omitted the cache is consulted. */
  logoImage?: HTMLImageElement | null;
  /** Called once an asynchronously loaded logo has been drawn. */
  onLogoReady?: () => void;
}

export function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  matrix: QRMatrix,
  config: QRConfig,
  options: QRRenderOptions = {}
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { size: moduleCount, modules } = matrix;
  const pixelRatio = options.pixelRatio ?? getPreviewPixelRatio(config.size);
  const { cellSize, canvasSize, origin } = getQRLayout(moduleCount, config, pixelRatio);

  canvas.width = canvasSize;
  canvas.height = canvasSize;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Background
  if (config.transparentBg) {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
  } else {
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
  }

  // Create gradient or solid color
  let fillStyle: string | CanvasGradient;
  if (config.colorMode === "gradient") {
    const angle = (config.gradientAngle * Math.PI) / 180;
    const x1 = canvasSize / 2 - (Math.cos(angle) * canvasSize) / 2;
    const y1 = canvasSize / 2 - (Math.sin(angle) * canvasSize) / 2;
    const x2 = canvasSize / 2 + (Math.cos(angle) * canvasSize) / 2;
    const y2 = canvasSize / 2 + (Math.sin(angle) * canvasSize) / 2;
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, config.color1);
    gradient.addColorStop(1, config.color2);
    fillStyle = gradient;
  } else {
    fillStyle = config.color1;
  }

  ctx.fillStyle = fillStyle;

  const solidFinders = hasSolidFinder(config.cornerStyle);

  // Draw modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!modules[row][col]) continue;

      const x = origin + col * cellSize;
      const y = origin + row * cellSize;

      if (isFinderPattern(row, col, moduleCount)) {
        if (!solidFinders) drawFinderModule(ctx, x, y, cellSize, row, col, moduleCount, config, fillStyle);
      } else {
        ctx.fillStyle = fillStyle;
        drawModule(ctx, x, y, cellSize, config.moduleStyle);
      }
    }
  }

  // Finder patterns as whole shapes, so a scanner locks on at once. See qr-finder.
  if (solidFinders) {
    ctx.fillStyle = fillStyle;
    for (const [row, col] of finderOrigins(moduleCount)) {
      traceFinderOnCanvas(ctx, finderPath(config.cornerStyle, origin + col * cellSize, origin + row * cellSize, cellSize));
      ctx.fill("evenodd");
    }
  }

  // Draw logo
  if (config.logoUrl) {
    const logoUrl = config.logoUrl;
    const ready = options.logoImage ?? getCachedLogo(logoUrl);

    drawLogoPlate(ctx, canvasSize, config);

    if (ready) {
      drawLogoImage(ctx, canvasSize, config, ready);
    } else {
      // Preview path: repaint the logo as soon as the bitmap is available.
      loadLogoImage(logoUrl)
        .then((img) => {
          if (canvas.width !== canvasSize || config.logoUrl !== logoUrl) return;
          drawLogoPlate(ctx, canvasSize, config);
          drawLogoImage(ctx, canvasSize, config, img);
          options.onLogoReady?.();
        })
        .catch(() => {
          // Broken logo: leave the plate, the QR itself is still valid.
        });
    }
  }
}

/**
 * Renders and resolves only once the logo is actually painted. Every export
 * path must use this — the synchronous variant can return before the logo
 * bitmap exists, which is what left a blank white square in exported PDFs.
 */
export async function renderQRToCanvasAsync(
  canvas: HTMLCanvasElement,
  matrix: QRMatrix,
  config: QRConfig,
  options: QRRenderOptions = {}
): Promise<void> {
  let logoImage = options.logoImage ?? null;
  if (config.logoUrl && !logoImage) {
    try {
      logoImage = await loadLogoImage(config.logoUrl);
    } catch {
      logoImage = null;
    }
  }
  renderQRToCanvas(canvas, matrix, config, { ...options, logoImage });
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export interface LogoGeometry {
  /** Square box the artwork is fitted into or cropped to. */
  logoSize: number;
  logoX: number;
  logoY: number;
  /** Plate box: the logo box grown by the padding on every side. */
  plateSize: number;
  plateX: number;
  plateY: number;
  /** Corner radius of the artwork cut. Zero is a hard square. */
  logoCornerRadius: number;
  /** Corner radius of the plate, and of the outline that follows it. */
  plateCornerRadius: number;
  /** Outline thickness in the caller's unit. Zero when the outline is off. */
  borderWidth: number;
}

function cornerRadius(shape: LogoShape | LogoPlateShape, side: number, radiusPercent: number): number {
  if (shape === "circle") return side / 2;
  if (shape === "rounded") return (clampNumber(radiusPercent, 0, 50) / 100) * side;
  return 0;
}

/**
 * Single source of truth for where the logo, its plate and its outline sit,
 * expressed in whatever unit the caller works in — canvas pixels, SVG user
 * units, or PDF points. Every renderer goes through this, so the preview, the
 * PNG, the SVG and the vector PDF cannot drift apart.
 */
export function getLogoGeometry(edge: number, config: QRConfig): LogoGeometry {
  const logoSize = edge * config.logoScale;
  const pad = logoSize * (clampNumber(config.logoPadding ?? 15, 0, 40) / 100);
  const plateSize = logoSize + pad * 2;
  const radius = config.logoRadius ?? 15;
  const shape = config.logoShape ?? "original";
  const plateShape = config.logoPlateShape ?? "rounded";

  return {
    logoSize,
    logoX: (edge - logoSize) / 2,
    logoY: (edge - logoSize) / 2,
    plateSize,
    plateX: (edge - plateSize) / 2,
    plateY: (edge - plateSize) / 2,
    logoCornerRadius: cornerRadius(shape === "original" ? "square" : shape, logoSize, radius),
    plateCornerRadius: cornerRadius(plateShape, plateSize, radius),
    borderWidth: plateSize * (clampNumber(config.logoBorderWidth ?? 0, 0, 12) / 100),
  };
}

/** Plate fill. A null colour follows the sheet, which is the original behaviour. */
export function resolveLogoPlateColor(config: QRConfig): string {
  if (config.logoPlateColor) return config.logoPlateColor;
  return config.transparentBg ? "rgba(255,255,255,0.95)" : config.bgColor;
}

export interface LogoDrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Placement of the artwork inside its box. "original" fits the whole picture
 * in and letterboxes it; every other shape covers the box and lets the cut do
 * the cropping, so a tall logo does not become a sliver inside a circle.
 */
export function getLogoDrawRect(
  geometry: LogoGeometry,
  config: QRConfig,
  naturalWidth: number,
  naturalHeight: number
): LogoDrawRect {
  const w = naturalWidth || geometry.logoSize;
  const h = naturalHeight || geometry.logoSize;
  const fit = (config.logoShape ?? "original") === "original";
  const scale = fit
    ? Math.min(geometry.logoSize / w, geometry.logoSize / h)
    : Math.max(geometry.logoSize / w, geometry.logoSize / h);
  const width = w * scale;
  const height = h * scale;

  return {
    x: geometry.logoX + (geometry.logoSize - width) / 2,
    y: geometry.logoY + (geometry.logoSize - height) / 2,
    width,
    height,
  };
}

function traceBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (r <= 0) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    return;
  }
  roundRect(ctx, x, y, w, h, r);
}

function drawLogoPlate(ctx: CanvasRenderingContext2D, canvasSize: number, config: QRConfig): void {
  const geometry = getLogoGeometry(canvasSize, config);
  const filled = config.logoPlate ?? true;
  if (!filled && geometry.borderWidth <= 0) return;

  ctx.save();
  if (filled) {
    ctx.fillStyle = resolveLogoPlateColor(config);
    traceBox(ctx, geometry.plateX, geometry.plateY, geometry.plateSize, geometry.plateSize, geometry.plateCornerRadius);
    ctx.fill();
  }

  if (geometry.borderWidth > 0) {
    // A centred stroke straddles its path, so inset by half a line width to
    // keep the outline inside the plate instead of eating into the modules.
    const inset = geometry.borderWidth / 2;
    ctx.strokeStyle = config.logoBorderColor;
    ctx.lineWidth = geometry.borderWidth;
    traceBox(
      ctx,
      geometry.plateX + inset,
      geometry.plateY + inset,
      geometry.plateSize - geometry.borderWidth,
      geometry.plateSize - geometry.borderWidth,
      Math.max(0, geometry.plateCornerRadius - inset)
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawLogoImage(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  config: QRConfig,
  img: HTMLImageElement
): void {
  const geometry = getLogoGeometry(canvasSize, config);
  const rect = getLogoDrawRect(geometry, config, img.naturalWidth, img.naturalHeight);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if ((config.logoShape ?? "original") !== "original") {
    traceBox(ctx, geometry.logoX, geometry.logoY, geometry.logoSize, geometry.logoSize, geometry.logoCornerRadius);
    ctx.clip();
  }
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

/**
 * Rasterizes the logo with its cut already applied, on a transparent square.
 * jsPDF has no clipping path we can rely on, so the vector export embeds this
 * bitmap rather than trying to rebuild the shape in PDF operators.
 */
export function composeLogoBitmap(
  img: HTMLImageElement,
  config: QRConfig,
  sizePx = 1024
): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const shape = config.logoShape ?? "original";
  // The box maps onto the whole bitmap, so the geometry is stated directly
  // rather than derived from a sheet edge.
  const geometry: LogoGeometry = {
    logoSize: sizePx,
    logoX: 0,
    logoY: 0,
    plateSize: sizePx,
    plateX: 0,
    plateY: 0,
    logoCornerRadius: cornerRadius(shape === "original" ? "square" : shape, sizePx, config.logoRadius ?? 15),
    plateCornerRadius: 0,
    borderWidth: 0,
  };
  const rect = getLogoDrawRect(geometry, config, img.naturalWidth, img.naturalHeight);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (shape !== "original") {
    traceBox(ctx, 0, 0, sizePx, sizePx, geometry.logoCornerRadius);
    ctx.clip();
  }
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
  return canvas;
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: ModuleStyle
): void {
  // Snap the inter-module gap to whole pixels so square modules stay crisp.
  const gap = size >= 10 ? Math.round(size * 0.1) : size * 0.1;
  const s = size - gap;
  const offset = gap / 2;

  switch (style) {
    case "square":
      ctx.fillRect(x + offset, y + offset, s, s);
      break;
    case "tiny-squares":
      ctx.fillRect(x + offset * 1.4, y + offset * 1.4, s * 0.78, s * 0.78);
      break;
    case "rounded":
      roundRect(ctx, x + offset, y + offset, s, s, s * 0.3);
      ctx.fill();
      break;
    case "dots":
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, s / 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + offset);
      ctx.lineTo(x + size - offset, y + size / 2);
      ctx.lineTo(x + size / 2, y + size - offset);
      ctx.lineTo(x + offset, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + offset);
      ctx.lineTo(x + size - offset, y + size - offset);
      ctx.lineTo(x + offset, y + size - offset);
      ctx.closePath();
      ctx.fill();
      break;
    case "star":
      drawStar(ctx, x + size / 2, y + size / 2, s * 0.52, s * 0.24, 5);
      ctx.fill();
      break;
    case "heart":
      drawHeart(ctx, x + size / 2, y + size / 2 + s * 0.02, s * 0.46);
      ctx.fill();
      break;
    case "bubble":
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, s / 2.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + size / 2 - s * 0.14, y + size / 2 - s * 0.14, s / 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fill();
      ctx.restore();
      break;
    case "extra-rounded":
      roundRect(ctx, x + offset, y + offset, s, s, s * 0.5);
      ctx.fill();
      break;
  }
}

function drawFinderModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  row: number,
  col: number,
  moduleCount: number,
  config: QRConfig,
  fillStyle: string | CanvasGradient
): void {
  const style = config.cornerStyle;

  // For decorative corners, draw the whole finder pattern at once
  // For others, draw cell by cell with corner styling
  const gap = cellSize >= 20 ? Math.round(cellSize * 0.05) : cellSize * 0.05;
  const s = cellSize - gap;
  const offset = gap / 2;

  ctx.fillStyle = fillStyle;

  switch (style) {
    case "circle":
      if (isFinderPatternInner(row, col, moduleCount)) {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, s / 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (isFinderPatternOuter(row, col, moduleCount)) {
        ctx.fillRect(x, y, cellSize, cellSize);
      } else {
        ctx.fillRect(x, y, cellSize, cellSize);
      }
      break;
    case "rounded":
      roundRect(ctx, x + offset, y + offset, s, s, s * 0.35);
      ctx.fill();
      break;
    case "thick":
      ctx.fillRect(x, y, cellSize, cellSize);
      break;
    case "minimal":
      roundRect(ctx, x + offset * 2, y + offset * 2, s - offset * 2, s - offset * 2, s * 0.2);
      ctx.fill();
      break;
    case "decorative":
      if (isFinderPatternInner(row, col, moduleCount)) {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, s / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        roundRect(ctx, x + offset, y + offset, s, s, s * 0.25);
        ctx.fill();
      }
      break;
    case "ring":
      if (isFinderPatternInner(row, col, moduleCount)) {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, s / 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (isFinderPatternOuter(row, col, moduleCount)) {
        roundRect(ctx, x + offset, y + offset, s, s, s * 0.14);
        ctx.fill();
      }
      break;
    case "leaf":
      if (isFinderPatternInner(row, col, moduleCount)) {
        ctx.beginPath();
        ctx.moveTo(x + cellSize / 2, y + offset);
        ctx.quadraticCurveTo(x + sizeLike(cellSize, 0.92), y + cellSize / 2, x + cellSize / 2, y + cellSize - offset);
        ctx.quadraticCurveTo(x + sizeLike(cellSize, 0.08), y + cellSize / 2, x + cellSize / 2, y + offset);
        ctx.fill();
      } else {
        roundRect(ctx, x + offset, y + offset, s, s, s * 0.28);
        ctx.fill();
      }
      break;
    case "frame-dots":
      if (isFinderPatternInner(row, col, moduleCount)) {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, s / 2.1, 0, Math.PI * 2);
        ctx.fill();
      } else if (isFinderPatternOuter(row, col, moduleCount)) {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, s / 3.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    default:
      ctx.fillRect(x, y, cellSize, cellSize);
  }
}

function sizeLike(size: number, ratio: number) {
  return size * ratio;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerRadius: number, innerRadius: number, points: number) {
  const step = Math.PI / points;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const top = cy - size * 0.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.45);
  ctx.bezierCurveTo(cx + size, cy - size * 0.1, cx + size * 0.75, top - size * 0.75, cx, top - size * 0.1);
  ctx.bezierCurveTo(cx - size * 0.75, top - size * 0.75, cx - size, cy - size * 0.1, cx, cy + size * 0.45);
  ctx.closePath();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Builds an offscreen, print-resolution bitmap with the logo already painted. */
export async function createHighResQRCanvas(
  config: QRConfig,
  pixelRatio = getExportPixelRatio(config.size)
): Promise<HTMLCanvasElement> {
  const matrix = generateQRMatrix(config);
  const canvas = document.createElement("canvas");
  await renderQRToCanvasAsync(canvas, matrix, config, { pixelRatio });
  return canvas;
}

export function exportCanvasAsPNG(canvas: HTMLCanvasElement, filename = "qrcode.png"): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export interface PDFExportOptions {
  /** Page size in CSS pixels. Defaults to the bitmap size (1:1 at 96 DPI). */
  logicalWidth?: number;
  logicalHeight?: number;
}

export function exportCanvasAsPDF(
  canvas: HTMLCanvasElement,
  filename = "qrcode.pdf",
  options: PDFExportOptions = {}
): void {
  const pxToPt = 72 / 96;
  const logicalWidth = options.logicalWidth ?? canvas.width;
  const logicalHeight = options.logicalHeight ?? canvas.height;
  const pageWidth = logicalWidth * pxToPt;
  const pageHeight = logicalHeight * pxToPt;

  const pdf = new jsPDF({
    orientation: pageWidth >= pageHeight ? "landscape" : "portrait",
    unit: "pt",
    format: [pageWidth, pageHeight],
    compress: true,
  });

  // The bitmap is several times larger than the page box, so the embedded
  // image keeps a high effective DPI instead of being a screen-resolution scan.
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  pdf.save(filename);
}

export function exportCanvasAsSVG(matrix: QRMatrix, config: QRConfig): string {
  const { size: moduleCount, modules } = matrix;
  // Vector output is not on a pixel grid, so the cell keeps full precision and
  // the symbol plus its quiet zone lands exactly on the stated viewBox.
  const quietZone = Math.max(0, Math.round(config.quietZone ?? 0));
  const cellSize = config.size / (moduleCount + quietZone * 2);
  const origin = quietZone * cellSize;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${config.size} ${config.size}" width="${config.size}" height="${config.size}">`;

  if (!config.transparentBg) {
    svg += `<rect width="${config.size}" height="${config.size}" fill="${config.bgColor}"/>`;
  }

  // Gradient definition
  if (config.colorMode === "gradient") {
    const angle = config.gradientAngle;
    const rad = (angle * Math.PI) / 180;
    const x1 = 50 - Math.cos(rad) * 50;
    const y1 = 50 - Math.sin(rad) * 50;
    const x2 = 50 + Math.cos(rad) * 50;
    const y2 = 50 + Math.sin(rad) * 50;
    svg += `<defs><linearGradient id="qrg" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
    svg += `<stop offset="0%" stop-color="${config.color1}"/>`;
    svg += `<stop offset="100%" stop-color="${config.color2}"/>`;
    svg += `</linearGradient></defs>`;
  }

  const fill = config.colorMode === "gradient" ? "url(#qrg)" : config.color1;
  const solidFinders = hasSolidFinder(config.cornerStyle);

  if (solidFinders) {
    for (const [row, col] of finderOrigins(moduleCount)) {
      const d = finderPathToSvg(finderPath(config.cornerStyle, origin + col * cellSize, origin + row * cellSize, cellSize));
      svg += `<path d="${d}" fill-rule="evenodd" fill="${fill}"/>`;
    }
  }

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!modules[row][col]) continue;
      const x = origin + col * cellSize;
      const y = origin + row * cellSize;
      const gap = cellSize * 0.1;
      const s = cellSize - gap;
      const offset = gap / 2;

      // Finder patterns follow the corner style, exactly as the canvas does.
      // Skipping this is what made SVG exports look different from the PNG.
      if (isFinderPattern(row, col, moduleCount)) {
        if (solidFinders) continue;
        svg += svgFinderModule(x, y, cellSize, row, col, moduleCount, config, fill);
        continue;
      }

      switch (config.moduleStyle) {
        case "dots":
          svg += `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${s / 2.2}" fill="${fill}"/>`;
          break;
        case "tiny-squares":
          svg += `<rect x="${x + offset * 1.4}" y="${y + offset * 1.4}" width="${s * 0.78}" height="${s * 0.78}" fill="${fill}"/>`;
          break;
        case "rounded":
          svg += `<rect x="${x + offset}" y="${y + offset}" width="${s}" height="${s}" rx="${s * 0.3}" fill="${fill}"/>`;
          break;
        case "diamond": {
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;
          svg += `<polygon points="${cx},${y + offset} ${x + cellSize - offset},${cy} ${cx},${y + cellSize - offset} ${x + offset},${cy}" fill="${fill}"/>`;
          break;
        }
        case "triangle":
          svg += `<polygon points="${x + cellSize / 2},${y + offset} ${x + cellSize - offset},${y + cellSize - offset} ${x + offset},${y + cellSize - offset}" fill="${fill}"/>`;
          break;
        case "star":
          svg += svgStar(x + cellSize / 2, y + cellSize / 2, s * 0.52, s * 0.24, fill);
          break;
        case "heart":
          svg += svgHeart(x + cellSize / 2, y + cellSize / 2 + s * 0.02, s * 0.46, fill);
          break;
        case "bubble":
          svg += `<g><circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${s / 2.45}" fill="${fill}"/><circle cx="${x + cellSize / 2 - s * 0.14}" cy="${y + cellSize / 2 - s * 0.14}" r="${s / 6}" fill="rgba(255,255,255,0.24)"/></g>`;
          break;
        case "extra-rounded":
          svg += `<rect x="${x + offset}" y="${y + offset}" width="${s}" height="${s}" rx="${s * 0.5}" fill="${fill}"/>`;
          break;
        default:
          svg += `<rect x="${x + offset}" y="${y + offset}" width="${s}" height="${s}" fill="${fill}"/>`;
      }
    }
  }

  if (config.logoUrl) {
    // Measured against the full sheet, matching how the canvas sizes it.
    const geometry = getLogoGeometry(config.size, config);
    const href = escapeXmlAttr(config.logoUrl);
    const shape = config.logoShape ?? "original";

    if (config.logoPlate ?? true) {
      svg += svgBox(
        geometry.plateX,
        geometry.plateY,
        geometry.plateSize,
        geometry.plateCornerRadius,
        `fill="${resolveLogoPlateColor(config)}"`
      );
    }

    if (geometry.borderWidth > 0) {
      // SVG strokes are centred too, so the outline is inset the same way the
      // canvas insets it.
      const inset = geometry.borderWidth / 2;
      svg += svgBox(
        geometry.plateX + inset,
        geometry.plateY + inset,
        geometry.plateSize - geometry.borderWidth,
        Math.max(0, geometry.plateCornerRadius - inset),
        `fill="none" stroke="${config.logoBorderColor}" stroke-width="${geometry.borderWidth}"`
      );
    }

    if (shape === "original") {
      svg += `<image x="${geometry.logoX}" y="${geometry.logoY}" width="${geometry.logoSize}" height="${geometry.logoSize}" preserveAspectRatio="xMidYMid meet" href="${href}" xlink:href="${href}"/>`;
    } else {
      svg += `<defs><clipPath id="qrlogoclip">${svgBox(geometry.logoX, geometry.logoY, geometry.logoSize, geometry.logoCornerRadius, "")}</clipPath></defs>`;

      // The cover rect is stated outright whenever the bitmap has been decoded,
      // because "slice" is unreliable for an uploaded *SVG* logo: browsers let
      // the referenced document's own aspect rules win, and the cut ends up
      // letterboxed here while the canvas preview shows it filling. Falling
      // back to "slice" only matters before anything has rendered the logo.
      const decoded = getCachedLogo(config.logoUrl);
      const placement = decoded
        ? (() => {
            const rect = getLogoDrawRect(geometry, config, decoded.naturalWidth, decoded.naturalHeight);
            return `x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" preserveAspectRatio="none"`;
          })()
        : `x="${geometry.logoX}" y="${geometry.logoY}" width="${geometry.logoSize}" height="${geometry.logoSize}" preserveAspectRatio="xMidYMid slice"`;

      svg += `<image ${placement} clip-path="url(#qrlogoclip)" href="${href}" xlink:href="${href}"/>`;
    }
  }

  svg += "</svg>";
  return svg;
}

/** A rect, a rounded rect or a circle, whichever the radius asks for. */
function svgBox(x: number, y: number, side: number, radius: number, attrs: string): string {
  const suffix = attrs ? ` ${attrs}` : "";
  if (radius >= side / 2) {
    return `<circle cx="${x + side / 2}" cy="${y + side / 2}" r="${side / 2}"${suffix}/>`;
  }
  const rx = radius > 0 ? ` rx="${radius}"` : "";
  return `<rect x="${x}" y="${y}" width="${side}" height="${side}"${rx}${suffix}/>`;
}

function escapeXmlAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadSVG(svgString: string, filename = "qrcode.svg"): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Vector twin of `drawFinderModule`. Kept deliberately parallel to it — the two
 * must agree module for module or SVG and PNG exports of the same design stop
 * looking like the same design.
 */
function svgFinderModule(
  x: number,
  y: number,
  cellSize: number,
  row: number,
  col: number,
  moduleCount: number,
  config: QRConfig,
  fill: string,
): string {
  const gap = cellSize * 0.05;
  const s = cellSize - gap;
  const offset = gap / 2;
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  const inner = isFinderPatternInner(row, col, moduleCount);
  const outer = isFinderPatternOuter(row, col, moduleCount);

  const box = (rx: number, pad = offset, side = s) =>
    `<rect x="${x + pad}" y="${y + pad}" width="${side}" height="${side}" rx="${rx}" fill="${fill}"/>`;
  const disc = (r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  const solid = () => `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}"/>`;

  switch (config.cornerStyle) {
    case "circle":
      return inner ? disc(s / 2.2) : solid();
    case "rounded":
      return box(s * 0.35);
    case "thick":
      return solid();
    case "minimal":
      return `<rect x="${x + offset * 2}" y="${y + offset * 2}" width="${s - offset * 2}" height="${s - offset * 2}" rx="${s * 0.2}" fill="${fill}"/>`;
    case "decorative":
      return inner ? disc(s / 2) : box(s * 0.25);
    case "ring":
      if (inner) return disc(s / 2.5);
      return outer ? box(s * 0.14) : "";
    case "leaf":
      if (inner) {
        const d = [
          `M ${cx} ${y + offset}`,
          `Q ${x + cellSize * 0.92} ${cy} ${cx} ${y + cellSize - offset}`,
          `Q ${x + cellSize * 0.08} ${cy} ${cx} ${y + offset}`,
          "Z",
        ].join(" ");
        return `<path d="${d}" fill="${fill}"/>`;
      }
      return box(s * 0.28);
    case "frame-dots":
      if (inner) return disc(s / 2.1);
      return outer ? disc(s / 3.1) : "";
    default:
      return solid();
  }
}

function svgStar(cx: number, cy: number, outerRadius: number, innerRadius: number, fill: string) {
  const points: string[] = [];
  const step = Math.PI / 5;
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return `<polygon points="${points.join(" ")}" fill="${fill}"/>`;
}

function svgHeart(cx: number, cy: number, size: number, fill: string) {
  const top = cy - size * 0.2;
  const d = [
    `M ${cx} ${cy + size * 0.45}`,
    `C ${cx + size} ${cy - size * 0.1}, ${cx + size * 0.75} ${top - size * 0.75}, ${cx} ${top - size * 0.1}`,
    `C ${cx - size * 0.75} ${top - size * 0.75}, ${cx - size} ${cy - size * 0.1}, ${cx} ${cy + size * 0.45}`,
    "Z",
  ].join(" ");
  return `<path d="${d}" fill="${fill}"/>`;
}
