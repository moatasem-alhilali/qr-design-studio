import { BarcodeConfig, BarcodeFormat, formatBarcodeValue } from "./barcode-engine";

export interface BarcodeIssue {
  severity: "info" | "warning" | "error";
  message: string;
  suggestion: string;
}

export interface BarcodeReliabilityResult {
  score: number;
  grade: "Excellent" | "Good" | "Warning" | "Risky";
  issues: BarcodeIssue[];
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

function luminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(color1: string, color2: string) {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function isNumericFormat(format: BarcodeFormat) {
  return ["EAN13", "EAN8", "UPC", "ITF14", "ITF"].includes(format);
}

export function analyzeBarcodeReliability(config: BarcodeConfig): BarcodeReliabilityResult {
  const issues: BarcodeIssue[] = [];
  let score = 100;
  const value = formatBarcodeValue(config);

  const bg = config.transparentBg ? "#FFFFFF" : config.bgColor;
  const primaryContrast = contrastRatio(config.color1, bg);
  if (primaryContrast < 3) {
    score -= 30;
    issues.push({
      severity: "error",
      message: "Barcode contrast is too low",
      suggestion: "Use darker bars and a lighter background for scanner reliability",
    });
  } else if (primaryContrast < 4.5) {
    score -= 14;
    issues.push({
      severity: "warning",
      message: "Contrast is moderate and may fail on low-end scanners",
      suggestion: "Increase contrast between the bars and the background",
    });
  }

  if (config.colorMode === "gradient") {
    score -= 8;
    issues.push({
      severity: "info",
      message: "Gradients can reduce consistency across the barcode width",
      suggestion: "Prefer a single solid color for critical packaging or retail use",
    });
  }

  if (config.barWidth < 2) {
    score -= 18;
    issues.push({
      severity: "warning",
      message: "Very thin bars are harder to print and scan",
      suggestion: "Use bar width 2px or larger for production labels",
    });
  }

  if (config.margin < 10) {
    score -= 14;
    issues.push({
      severity: "warning",
      message: "Quiet zone is tight around the barcode",
      suggestion: "Increase margin to give scanners enough empty space around the symbol",
    });
  }

  if (config.height < 72) {
    score -= 12;
    issues.push({
      severity: "warning",
      message: "Short bar height reduces read reliability",
      suggestion: "Increase barcode height for handheld and distance scanning",
    });
  }

  if (config.showText && config.fontSize < 14) {
    score -= 6;
    issues.push({
      severity: "info",
      message: "Human-readable text is quite small",
      suggestion: "Increase font size if this barcode will be printed on physical labels",
    });
  }

  if (isNumericFormat(config.format) && /\D/.test(value)) {
    score -= 35;
    issues.push({
      severity: "error",
      message: "Selected format expects digits only",
      suggestion: "Remove letters and symbols or switch to Code 128 / Code 93",
    });
  }

  if (config.format === "ITF" && value.length % 2 !== 0) {
    score -= 30;
    issues.push({
      severity: "error",
      message: "ITF requires an even number of digits",
      suggestion: "Use an even digit count or choose a different format",
    });
  }

  const expectedLengths: Partial<Record<BarcodeFormat, number[]>> = {
    EAN13: [12, 13],
    EAN8: [7, 8],
    UPC: [11, 12],
    ITF14: [13, 14],
  };
  const validLengths = expectedLengths[config.format];
  if (validLengths && !validLengths.includes(value.length)) {
    score -= 30;
    issues.push({
      severity: "error",
      message: `${config.format} value length is invalid`,
      suggestion: `Use ${validLengths.join(" or ")} digits for ${config.format}`,
    });
  }

  if (config.barShape === "pill") {
    score -= 5;
    issues.push({
      severity: "info",
      message: "Pill bars are more decorative than standard bars",
      suggestion: "Use square or lightly rounded bars for mission-critical scanning",
    });
  }

  score = Math.max(0, Math.min(100, score));
  const grade = score >= 85 ? "Excellent" : score >= 65 ? "Good" : score >= 45 ? "Warning" : "Risky";
  return { score, grade, issues };
}
