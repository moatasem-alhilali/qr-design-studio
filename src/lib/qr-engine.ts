import qrcode from "qrcode-generator";

export type ModuleStyle = "square" | "rounded" | "dots" | "diamond" | "extra-rounded";
export type CornerStyle = "square" | "rounded" | "circle" | "thick" | "minimal" | "decorative";
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
  const ecl = config.logoUrl ? "H" : config.errorCorrection;
  const eclMap = { L: 1, M: 0, Q: 3, H: 2 } as const;
  const qr = qrcode(0, (["L", "M", "Q", "H"] as const).indexOf(ecl) >= 0 ? (["L", "M", "Q", "H"][eclMap[ecl]] as "L" | "M" | "Q" | "H") : "H");
  
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

export function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  matrix: QRMatrix,
  config: QRConfig
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { size: moduleCount, modules } = matrix;
  const canvasSize = config.size;
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const cellSize = canvasSize / moduleCount;

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
        drawModule(ctx, x, y, cellSize, config.moduleStyle);
      }
    }
  }

  // Draw logo
  if (config.logoUrl) {
    const logoSize = canvasSize * config.logoScale;
    const logoX = (canvasSize - logoSize) / 2;
    const logoY = (canvasSize - logoSize) / 2;
    
    // White background behind logo
    const pad = logoSize * 0.15;
    ctx.fillStyle = config.transparentBg ? "rgba(255,255,255,0.95)" : config.bgColor;
    roundRect(ctx, logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2, cellSize * 2);
    ctx.fill();
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
    };
    img.src = config.logoUrl;
  }
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: ModuleStyle
): void {
  const gap = size * 0.1;
  const s = size - gap;
  const offset = gap / 2;

  switch (style) {
    case "square":
      ctx.fillRect(x + offset, y + offset, s, s);
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
  const gap = cellSize * 0.05;
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
    default:
      ctx.fillRect(x, y, cellSize, cellSize);
  }
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

export function exportCanvasAsPNG(canvas: HTMLCanvasElement, filename = "qrcode.png"): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function exportCanvasAsSVG(matrix: QRMatrix, config: QRConfig): string {
  const { size: moduleCount, modules } = matrix;
  const cellSize = config.size / moduleCount;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${config.size} ${config.size}" width="${config.size}" height="${config.size}">`;
  
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
        case "rounded":
          svg += `<rect x="${x + offset}" y="${y + offset}" width="${s}" height="${s}" rx="${s * 0.3}" fill="${fill}"/>`;
          break;
        case "diamond": {
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;
          const hs = s / 2;
          svg += `<polygon points="${cx},${y + offset} ${x + cellSize - offset},${cy} ${cx},${y + cellSize - offset} ${x + offset},${cy}" fill="${fill}"/>`;
          break;
        }
        case "extra-rounded":
          svg += `<rect x="${x + offset}" y="${y + offset}" width="${s}" height="${s}" rx="${s * 0.5}" fill="${fill}"/>`;
          break;
        default:
          svg += `<rect x="${x + offset}" y="${y + offset}" width="${s}" height="${s}" fill="${fill}"/>`;
      }
    }
  }

  svg += "</svg>";
  return svg;
}

export function downloadSVG(svgString: string, filename = "qrcode.svg"): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}
