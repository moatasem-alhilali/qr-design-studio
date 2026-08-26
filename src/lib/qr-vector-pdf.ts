import { jsPDF } from "jspdf";

import {
  loadLogoImage,
  type ModuleStyle,
  type QRConfig,
  type QRMatrix,
} from "@/lib/qr-engine";

/**
 * True vector PDF output.
 *
 * The raster path embeds a bitmap, so quality is fixed at export time and a
 * print shop enlarging the file hits its ceiling. Here every module is drawn as
 * a PDF path, which stays sharp at any size and produces a far smaller file.
 *
 * Gradients have no vector equivalent in jsPDF, so a gradient design is
 * resolved per module: each module is filled with the gradient's colour at its
 * own position. At module scale that is visually indistinguishable from a
 * continuous ramp, and it keeps the output fully vector.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const normalised = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  return {
    r: parseInt(normalised.slice(1, 3), 16) || 0,
    g: parseInt(normalised.slice(3, 5), 16) || 0,
    b: parseInt(normalised.slice(5, 7), 16) || 0,
  };
}

function mix(a: RGB, b: RGB, t: number): RGB {
  const clamped = Math.min(1, Math.max(0, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * clamped),
    g: Math.round(a.g + (b.g - a.g) * clamped),
    b: Math.round(a.b + (b.b - a.b) * clamped),
  };
}

/** Regular polygon / arbitrary polygon fill via jsPDF's relative line API. */
function fillPolygon(pdf: jsPDF, points: Array<[number, number]>) {
  if (points.length < 3) return;
  const [start, ...rest] = points;
  const deltas: Array<[number, number]> = [];
  let [px, py] = start;
  for (const [x, y] of rest) {
    deltas.push([x - px, y - py]);
    px = x;
    py = y;
  }
  pdf.lines(deltas, start[0], start[1], [1, 1], "F", true);
}

function starPoints(cx: number, cy: number, outer: number, inner: number): Array<[number, number]> {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number];
  });
}

/** Heart approximated as a polygon; beziers via jsPDF.lines are error-prone. */
function heartPoints(cx: number, cy: number, size: number): Array<[number, number]> {
  return Array.from({ length: 40 }, (_, i) => {
    const t = (i / 40) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [cx + (x / 16) * size, cy - (y / 16) * size] as [number, number];
  });
}

function drawModule(pdf: jsPDF, x: number, y: number, cell: number, style: ModuleStyle) {
  const gap = cell * 0.1;
  const s = cell - gap;
  const o = gap / 2;
  const cx = x + cell / 2;
  const cy = y + cell / 2;

  switch (style) {
    case "square":
      pdf.rect(x + o, y + o, s, s, "F");
      break;
    case "tiny-squares":
      pdf.rect(x + o * 1.4, y + o * 1.4, s * 0.78, s * 0.78, "F");
      break;
    case "rounded":
      pdf.roundedRect(x + o, y + o, s, s, s * 0.3, s * 0.3, "F");
      break;
    case "extra-rounded":
      pdf.roundedRect(x + o, y + o, s, s, s * 0.5, s * 0.5, "F");
      break;
    case "dots":
      pdf.circle(cx, cy, s / 2.2, "F");
      break;
    case "bubble":
      pdf.circle(cx, cy, s / 2.45, "F");
      break;
    case "diamond":
      fillPolygon(pdf, [
        [cx, y + o],
        [x + cell - o, cy],
        [cx, y + cell - o],
        [x + o, cy],
      ]);
      break;
    case "triangle":
      fillPolygon(pdf, [
        [cx, y + o],
        [x + cell - o, y + cell - o],
        [x + o, y + cell - o],
      ]);
      break;
    case "star":
      fillPolygon(pdf, starPoints(cx, cy, s * 0.52, s * 0.24));
      break;
    case "heart":
      fillPolygon(pdf, heartPoints(cx, cy, s * 0.5));
      break;
    default:
      pdf.rect(x + o, y + o, s, s, "F");
  }
}

function isFinder(row: number, col: number, size: number): boolean {
  if (row < 7 && col < 7) return true;
  if (row < 7 && col >= size - 7) return true;
  if (row >= size - 7 && col < 7) return true;
  return false;
}

function finderRing(row: number, col: number, size: number): "inner" | "outer" | "mid" {
  for (const [pr, pc] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    const lr = row - pr;
    const lc = col - pc;
    if (lr < 0 || lr > 6 || lc < 0 || lc > 6) continue;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return "inner";
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return "outer";
    return "mid";
  }
  return "mid";
}

function drawFinder(pdf: jsPDF, x: number, y: number, cell: number, ring: string, config: QRConfig) {
  const gap = cell * 0.05;
  const s = cell - gap;
  const o = gap / 2;
  const cx = x + cell / 2;
  const cy = y + cell / 2;
  const inner = ring === "inner";
  const outer = ring === "outer";

  switch (config.cornerStyle) {
    case "circle":
      if (inner) pdf.circle(cx, cy, s / 2.2, "F");
      else pdf.rect(x, y, cell, cell, "F");
      break;
    case "rounded":
      pdf.roundedRect(x + o, y + o, s, s, s * 0.35, s * 0.35, "F");
      break;
    case "thick":
      pdf.rect(x, y, cell, cell, "F");
      break;
    case "minimal":
      pdf.roundedRect(x + o * 2, y + o * 2, s - o * 2, s - o * 2, s * 0.2, s * 0.2, "F");
      break;
    case "decorative":
      if (inner) pdf.circle(cx, cy, s / 2, "F");
      else pdf.roundedRect(x + o, y + o, s, s, s * 0.25, s * 0.25, "F");
      break;
    case "ring":
      if (inner) pdf.circle(cx, cy, s / 2.5, "F");
      else if (outer) pdf.roundedRect(x + o, y + o, s, s, s * 0.14, s * 0.14, "F");
      break;
    case "leaf":
      if (inner) pdf.circle(cx, cy, s / 2.3, "F");
      else pdf.roundedRect(x + o, y + o, s, s, s * 0.28, s * 0.28, "F");
      break;
    case "frame-dots":
      if (inner) pdf.circle(cx, cy, s / 2.1, "F");
      else if (outer) pdf.circle(cx, cy, s / 3.1, "F");
      break;
    default:
      pdf.rect(x, y, cell, cell, "F");
  }
}

export interface VectorPDFOptions {
  /** Page edge in points. Defaults to the design size converted at 96 DPI. */
  sizePt?: number;
}

/**
 * Draws one QR symbol into an existing document at (originX, originY) with the
 * given edge length. Shared by the single export and the print sheet.
 */
export async function drawQRVector(
  pdf: jsPDF,
  matrix: QRMatrix,
  config: QRConfig,
  originX: number,
  originY: number,
  edge: number,
): Promise<void> {
  const moduleCount = matrix.size;
  const quietZone = Math.max(0, Math.round(config.quietZone ?? 0));
  const cell = edge / (moduleCount + quietZone * 2);
  const symbolOrigin = quietZone * cell;

  if (!config.transparentBg) {
    const bg = hexToRgb(config.bgColor);
    pdf.setFillColor(bg.r, bg.g, bg.b);
    pdf.rect(originX, originY, edge, edge, "F");
  }

  const solid = hexToRgb(config.color1);
  const second = hexToRgb(config.color2);
  const isGradient = config.colorMode === "gradient";
  const angle = ((config.gradientAngle ?? 0) * Math.PI) / 180;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);

  if (!isGradient) pdf.setFillColor(solid.r, solid.g, solid.b);

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!matrix.modules[row][col]) continue;

      const x = originX + symbolOrigin + col * cell;
      const y = originY + symbolOrigin + row * cell;

      if (isGradient) {
        // Project the module centre onto the gradient axis, matching the
        // canvas linear-gradient geometry.
        const nx = (symbolOrigin + col * cell + cell / 2) / edge - 0.5;
        const ny = (symbolOrigin + row * cell + cell / 2) / edge - 0.5;
        const t = (nx * ux + ny * uy) + 0.5;
        const c = mix(solid, second, t);
        pdf.setFillColor(c.r, c.g, c.b);
      }

      if (isFinder(row, col, moduleCount)) {
        drawFinder(pdf, x, y, cell, finderRing(row, col, moduleCount), config);
      } else {
        drawModule(pdf, x, y, cell, config.moduleStyle);
      }
    }
  }

  if (config.logoUrl) {
    const logoEdge = edge * config.logoScale;
    const lx = originX + (edge - logoEdge) / 2;
    const ly = originY + (edge - logoEdge) / 2;
    const pad = logoEdge * 0.15;

    const plate = config.transparentBg ? { r: 255, g: 255, b: 255 } : hexToRgb(config.bgColor);
    pdf.setFillColor(plate.r, plate.g, plate.b);
    pdf.roundedRect(lx - pad, ly - pad, logoEdge + pad * 2, logoEdge + pad * 2, cell * 2, cell * 2, "F");

    try {
      const img = await loadLogoImage(config.logoUrl);
      // Preserve the logo's aspect ratio inside its box.
      const scale = Math.min(logoEdge / img.naturalWidth, logoEdge / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      pdf.addImage(img, "PNG", lx + (logoEdge - w) / 2, ly + (logoEdge - h) / 2, w, h, undefined, "FAST");
    } catch {
      // Plate stays; the symbol is still valid.
    }
  }
}

/** Single-symbol vector PDF, page sized to the design. */
export async function exportQRAsVectorPDF(
  matrix: QRMatrix,
  config: QRConfig,
  filename = "qrcode.pdf",
  options: VectorPDFOptions = {},
): Promise<void> {
  const edge = options.sizePt ?? config.size * (72 / 96);
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [edge, edge], compress: true });
  await drawQRVector(pdf, matrix, config, 0, 0, edge);
  pdf.save(filename);
}
