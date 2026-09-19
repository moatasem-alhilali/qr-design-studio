import JsBarcode from "jsbarcode";
import { ColorMode } from "./qr-engine";

export type BarcodeFormat =
  | "CODE128"
  | "CODE39"
  | "CODE93"
  | "EAN13"
  | "EAN8"
  | "UPC"
  | "ITF14"
  | "ITF"
  | "codabar";

export type BarcodeDataType = "text" | "url" | "email" | "phone" | "product";
export type BarcodeShape = "square" | "rounded" | "pill";
export type BarcodeTextAlign = "left" | "center" | "right";
export type BarcodeTextPosition = "top" | "bottom";

export interface BarcodeConfig {
  value: string;
  dataType: BarcodeDataType;
  format: BarcodeFormat;
  barShape: BarcodeShape;
  colorMode: ColorMode;
  color1: string;
  color2: string;
  bgColor: string;
  transparentBg: boolean;
  gradientAngle: number;
  barWidth: number;
  height: number;
  margin: number;
  showText: boolean;
  customText: string;
  textAlign: BarcodeTextAlign;
  textPosition: BarcodeTextPosition;
  textMargin: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  flat: boolean;
}

export interface BarcodeEncoding {
  data: string;
}

export interface BarcodeModel {
  encodings: BarcodeEncoding[];
  formattedValue: string;
  displayText: string;
  width: number;
  height: number;
  barAreaHeight: number;
  barY: number;
  textY: number;
  patternWidth: number;
  /** Blank space left and right of the bars, never below the symbology minimum. */
  quietX: number;
}

/**
 * Minimum horizontal quiet zone, in modules (narrow-bar widths). Scanners look
 * for this empty run to find where the symbol starts; when it is short they
 * keep retrying, which is what makes a barcode feel slow to read. The values
 * follow the GS1 / ISO specs (EAN-13 and UPC-A ask for 11 on the left).
 */
const MIN_QUIET_MODULES: Record<BarcodeFormat, number> = {
  CODE128: 10,
  CODE39: 10,
  CODE93: 10,
  EAN13: 11,
  EAN8: 7,
  UPC: 11,
  ITF14: 10,
  ITF: 10,
  codabar: 10,
};

/** Consecutive dark modules merged into one bar: [start module, run length]. */
function barRuns(data: string): Array<[number, number]> {
  const runs: Array<[number, number]> = [];
  let start = -1;
  for (let index = 0; index <= data.length; index++) {
    const dark = data[index] === "1";
    if (dark && start < 0) start = index;
    if (!dark && start >= 0) {
      runs.push([start, index - start]);
      start = -1;
    }
  }
  return runs;
}

/**
 * Square bars are drawn as whole runs. Drawing each module separately left
 * anti-aliased hairlines between neighbours once the image was scaled, and a
 * scanner reads those as extra spaces. Rounded and pill shapes keep their
 * per-module look, which is the point of choosing them.
 */
function barRects(model: BarcodeModel, config: BarcodeConfig): Array<[number, number]> {
  const rects: Array<[number, number]> = [];
  let x = model.quietX;
  for (const encoding of model.encodings) {
    if (config.barShape === "square") {
      for (const [start, length] of barRuns(encoding.data)) {
        rects.push([x + start * config.barWidth, length * config.barWidth]);
      }
    } else {
      for (let index = 0; index < encoding.data.length; index++) {
        if (encoding.data[index] === "1") rects.push([x + index * config.barWidth, config.barWidth]);
      }
    }
    x += encoding.data.length * config.barWidth;
  }
  return rects;
}

export const defaultBarcodeConfig: BarcodeConfig = {
  value: "590123412345",
  dataType: "product",
  format: "EAN13",
  barShape: "square",
  colorMode: "single",
  color1: "#111827",
  color2: "#0F766E",
  bgColor: "#FFFFFF",
  transparentBg: false,
  gradientAngle: 90,
  barWidth: 2,
  height: 120,
  margin: 16,
  showText: true,
  customText: "",
  textAlign: "center",
  textPosition: "bottom",
  textMargin: 8,
  fontSize: 18,
  fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
  fontWeight: "normal",
  fontStyle: "normal",
  flat: false,
};

export const barcodeFormatHints: Record<BarcodeFormat, string> = {
  CODE128: "Flexible. Works with most text, URLs, tracking IDs, and mixed content.",
  CODE39: "Uppercase letters, numbers, spaces, and a few symbols. Common for labels.",
  CODE93: "Compact alphanumeric barcode with broader ASCII support than Code 39.",
  EAN13: "Retail format for 12 or 13 digits.",
  EAN8: "Compact retail format for 7 or 8 digits.",
  UPC: "Retail format for 11 or 12 digits.",
  ITF14: "Shipping carton format for 13 or 14 digits.",
  ITF: "Numeric only, must contain an even number of digits.",
  codabar: "Digits with start/stop markers A-D. Useful for legacy inventory systems.",
};

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function getBarcodePlaceholder(dataType: BarcodeDataType) {
  switch (dataType) {
    case "url":
      return "https://example.com/product/123";
    case "email":
      return "hello@example.com";
    case "phone":
      return "+966500000000";
    case "product":
      return "590123412345";
    default:
      return "SKU-2026-ALPHA";
  }
}

export function getSuggestedBarcodeFormat(dataType: BarcodeDataType): BarcodeFormat {
  switch (dataType) {
    case "product":
      return "EAN13";
    case "phone":
      return "CODE128";
    case "email":
      return "CODE128";
    case "url":
      return "CODE128";
    default:
      return "CODE128";
  }
}

export function formatBarcodeValue(config: BarcodeConfig): string {
  const raw = config.value?.trim() || getBarcodePlaceholder(config.dataType);

  let value = raw;
  switch (config.dataType) {
    case "url":
      value = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      break;
    case "email":
      value = raw.startsWith("mailto:") ? raw : `mailto:${raw}`;
      break;
    case "phone":
      value = raw.startsWith("tel:") ? raw : `tel:${raw.replace(/[^\d+]/g, "")}`;
      break;
    case "product":
      value = normalizeDigits(raw);
      break;
    default:
      value = raw;
  }

  switch (config.format) {
    case "EAN13":
      return normalizeDigits(value).slice(0, 13);
    case "EAN8":
      return normalizeDigits(value).slice(0, 8);
    case "UPC":
      return normalizeDigits(value).slice(0, 12);
    case "ITF14":
      return normalizeDigits(value).slice(0, 14);
    case "ITF": {
      const digits = normalizeDigits(value);
      return digits.length % 2 === 0 ? digits : digits.slice(0, -1);
    }
    case "CODE39":
      return value.toUpperCase();
    case "codabar":
      return value.toUpperCase();
    default:
      return value;
  }
}

function getFontOptions(config: BarcodeConfig) {
  const parts = [];
  if (config.fontWeight === "bold") parts.push("bold");
  if (config.fontStyle === "italic") parts.push("italic");
  return parts.join(" ");
}

function measureTextHeight(config: BarcodeConfig) {
  if (!config.showText) return 0;
  return config.fontSize + config.textMargin + 6;
}

function getRadius(config: BarcodeConfig, width: number) {
  if (config.barShape === "pill") return width / 2;
  if (config.barShape === "rounded") return Math.min(width * 0.32, 4);
  return 0;
}

export function generateBarcodeModel(config: BarcodeConfig): BarcodeModel {
  const formattedValue = formatBarcodeValue(config);
  const output: { encodings?: BarcodeEncoding[] } = {};

  JsBarcode(output as never, formattedValue, {
    format: config.format,
    width: config.barWidth,
    height: config.height,
    displayValue: false,
    margin: config.margin,
    fontSize: config.fontSize,
    textMargin: config.textMargin,
    font: config.fontFamily,
    fontOptions: getFontOptions(config),
    textAlign: config.textAlign,
    textPosition: config.textPosition,
    flat: config.flat,
    valid: () => {},
  });

  const encodings = output.encodings || [];
  if (encodings.length === 0) {
    throw new Error("Unable to encode barcode");
  }

  const patternWidth = encodings.reduce((sum, encoding) => sum + encoding.data.length * config.barWidth, 0);
  const textHeight = measureTextHeight(config);
  const quietX = Math.max(config.margin, MIN_QUIET_MODULES[config.format] * config.barWidth);
  const width = patternWidth + quietX * 2;
  const height = config.height + config.margin * 2 + textHeight;
  const barY = config.margin + (config.showText && config.textPosition === "top" ? textHeight : 0);
  const textY =
    config.showText
      ? config.textPosition === "top"
        ? config.fontSize
        : barY + config.height + config.textMargin + config.fontSize
      : 0;

  return {
    encodings,
    formattedValue,
    displayText: config.customText.trim() || formattedValue,
    width,
    height,
    barAreaHeight: config.height,
    barY,
    textY,
    patternWidth,
    quietX,
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function getFillStyle(ctx: CanvasRenderingContext2D, width: number, height: number, config: BarcodeConfig) {
  if (config.colorMode === "gradient") {
    const angle = (config.gradientAngle * Math.PI) / 180;
    const x1 = width / 2 - (Math.cos(angle) * width) / 2;
    const y1 = height / 2 - (Math.sin(angle) * height) / 2;
    const x2 = width / 2 + (Math.cos(angle) * width) / 2;
    const y2 = height / 2 + (Math.sin(angle) * height) / 2;
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, config.color1);
    gradient.addColorStop(1, config.color2);
    return gradient;
  }

  return config.color1;
}

export function renderBarcodeToCanvas(canvas: HTMLCanvasElement, model: BarcodeModel, config: BarcodeConfig) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = model.width;
  canvas.height = model.height;

  if (config.transparentBg) {
    ctx.clearRect(0, 0, model.width, model.height);
  } else {
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, model.width, model.height);
  }

  ctx.fillStyle = getFillStyle(ctx, model.width, model.height, config);

  const radius = getRadius(config, config.barWidth);
  for (const [barX, barWidth] of barRects(model, config)) {
    if (radius > 0) {
      roundRect(ctx, barX, model.barY, barWidth, config.height, radius);
      ctx.fill();
    } else {
      ctx.fillRect(barX, model.barY, barWidth, config.height);
    }
  }

  if (config.showText) {
    ctx.fillStyle = config.colorMode === "gradient" ? config.color1 : config.color1;
    ctx.font = `${getFontOptions(config)} ${config.fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = "alphabetic";
    if (config.textAlign === "left") {
      ctx.textAlign = "left";
      ctx.fillText(model.displayText, model.quietX, model.textY);
    } else if (config.textAlign === "right") {
      ctx.textAlign = "right";
      ctx.fillText(model.displayText, model.width - model.quietX, model.textY);
    } else {
      ctx.textAlign = "center";
      ctx.fillText(model.displayText, model.width / 2, model.textY);
    }
  }
}

export function exportBarcodeAsSVG(model: BarcodeModel, config: BarcodeConfig) {
  const radius = getRadius(config, config.barWidth);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${model.width} ${model.height}" width="${model.width}" height="${model.height}">`;

  if (!config.transparentBg) {
    svg += `<rect width="${model.width}" height="${model.height}" fill="${config.bgColor}"/>`;
  }

  if (config.colorMode === "gradient") {
    const angle = (config.gradientAngle * Math.PI) / 180;
    const x1 = 50 - Math.cos(angle) * 50;
    const y1 = 50 - Math.sin(angle) * 50;
    const x2 = 50 + Math.cos(angle) * 50;
    const y2 = 50 + Math.sin(angle) * 50;
    svg += `<defs><linearGradient id="barcode-gradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
    svg += `<stop offset="0%" stop-color="${config.color1}"/>`;
    svg += `<stop offset="100%" stop-color="${config.color2}"/>`;
    svg += `</linearGradient></defs>`;
  }

  const fill = config.colorMode === "gradient" ? "url(#barcode-gradient)" : config.color1;
  // crispEdges stops viewers from softening bar edges into grey when scaling.
  const rendering = radius > 0 ? "" : ` shape-rendering="crispEdges"`;
  svg += `<g fill="${fill}"${rendering}>`;
  for (const [barX, barWidth] of barRects(model, config)) {
    svg += `<rect x="${barX}" y="${model.barY}" width="${barWidth}" height="${config.height}"${radius > 0 ? ` rx="${radius}"` : ""}/>`;
  }
  svg += `</g>`;

  if (config.showText) {
    const anchor = config.textAlign === "left" ? "start" : config.textAlign === "right" ? "end" : "middle";
    const textX = config.textAlign === "left" ? model.quietX : config.textAlign === "right" ? model.width - model.quietX : model.width / 2;
    const fontWeight = config.fontWeight === "bold" ? "700" : "400";
    const fontStyle = config.fontStyle === "italic" ? "italic" : "normal";
    svg += `<text x="${textX}" y="${model.textY}" text-anchor="${anchor}" font-family="${config.fontFamily}" font-size="${config.fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${config.color1}">${escapeXml(model.displayText)}</text>`;
  }

  svg += "</svg>";
  return svg;
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
