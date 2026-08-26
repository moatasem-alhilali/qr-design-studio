import qrcode from "qrcode-generator";
import { jsPDF } from "jspdf";

export type ModuleStyle = "square" | "rounded" | "dots" | "diamond" | "extra-rounded" | "tiny-squares" | "heart" | "star" | "triangle" | "bubble";
export type CornerStyle = "square" | "rounded" | "circle" | "thick" | "minimal" | "decorative" | "ring" | "leaf" | "frame-dots";
export type ColorMode = "single" | "gradient";
export type DataType = "url" | "wifi" | "email" | "phone" | "text" | "whatsapp" | "vcard";

export interface QRConfig {
  data: string;
  dataType: DataType;
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
  size: number;
  errorCorrection: "L" | "M" | "Q" | "H";
}

export const defaultConfig: QRConfig = {
  data: "https://qr-design-dun.vercel.app/",
  dataType: "url",
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

function formatData(config: QRConfig): string {
  const { data, dataType } = config;
  if (!data) return "https://qr-design-dun.vercel.app/";
  switch (dataType) {
    case "wifi":
      return `WIFI:T:WPA;S:${data};P:password;;`;
    case "email":
      return `mailto:${data}`;
    case "phone":
      return `tel:${data}`;
    case "whatsapp":
      return `https://wa.me/${data.replace(/[^0-9]/g, "")}`;
    case "vcard":
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${data}\nEND:VCARD`;
    default:
      return data;
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
  qr.addData(formattedData);
  qr.make();

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
  const { cellSize, canvasSize } = getQRPixelMetrics(moduleCount, config.size, pixelRatio);

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

  // Draw modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!modules[row][col]) continue;

      const x = col * cellSize;
      const y = row * cellSize;

      if (isFinderPattern(row, col, moduleCount)) {
        drawFinderModule(ctx, x, y, cellSize, row, col, moduleCount, config, fillStyle);
      } else {
        ctx.fillStyle = fillStyle;
        drawModule(ctx, x, y, cellSize, config.moduleStyle);
      }
    }
  }

  // Draw logo
  if (config.logoUrl) {
    const logoUrl = config.logoUrl;
    const ready = options.logoImage ?? getCachedLogo(logoUrl);

    drawLogoPlate(ctx, canvasSize, cellSize, config);

    if (ready) {
      drawLogoImage(ctx, canvasSize, config, ready);
    } else {
      // Preview path: repaint the logo as soon as the bitmap is available.
      loadLogoImage(logoUrl)
        .then((img) => {
          if (canvas.width !== canvasSize || config.logoUrl !== logoUrl) return;
          drawLogoPlate(ctx, canvasSize, cellSize, config);
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

function getLogoBox(canvasSize: number, config: QRConfig) {
  const logoSize = canvasSize * config.logoScale;
  return {
    logoSize,
    logoX: (canvasSize - logoSize) / 2,
    logoY: (canvasSize - logoSize) / 2,
  };
}

function drawLogoPlate(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  cellSize: number,
  config: QRConfig
): void {
  const { logoSize, logoX, logoY } = getLogoBox(canvasSize, config);
  const pad = logoSize * 0.15;
  ctx.save();
  ctx.fillStyle = config.transparentBg ? "rgba(255,255,255,0.95)" : config.bgColor;
  roundRect(ctx, logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2, cellSize * 2);
  ctx.fill();
  ctx.restore();
}

function drawLogoImage(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  config: QRConfig,
  img: HTMLImageElement
): void {
  const { logoSize, logoX, logoY } = getLogoBox(canvasSize, config);
  const naturalWidth = img.naturalWidth || logoSize;
  const naturalHeight = img.naturalHeight || logoSize;
  // Fit inside the box without distorting non-square logos.
  const scale = Math.min(logoSize / naturalWidth, logoSize / naturalHeight);
  const drawWidth = naturalWidth * scale;
  const drawHeight = naturalHeight * scale;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    logoX + (logoSize - drawWidth) / 2,
    logoY + (logoSize - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
  ctx.restore();
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
  const cellSize = config.size / moduleCount;
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

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!modules[row][col]) continue;
      const x = col * cellSize;
      const y = row * cellSize;
      const gap = cellSize * 0.1;
      const s = cellSize - gap;
      const offset = gap / 2;

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
    const logoSize = config.size * config.logoScale;
    const logoX = (config.size - logoSize) / 2;
    const logoY = (config.size - logoSize) / 2;
    const pad = logoSize * 0.15;
    const plateColor = config.transparentBg ? "rgba(255,255,255,0.95)" : config.bgColor;
    const href = escapeXmlAttr(config.logoUrl);
    svg += `<rect x="${logoX - pad}" y="${logoY - pad}" width="${logoSize + pad * 2}" height="${logoSize + pad * 2}" rx="${cellSize * 2}" fill="${plateColor}"/>`;
    svg += `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" href="${href}" xlink:href="${href}"/>`;
  }

  svg += "</svg>";
  return svg;
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
