import {
  generateQRMatrix,
  getLogoGeometry,
  type CornerStyle,
  type ModuleStyle,
  type QRConfig,
} from './qr-engine';
import { FrameConfig } from './types';
import type { ScanReliabilityResult, ScanIssue } from './types';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(c1: string, c2: string): number {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Module and finder faces a scanner resolves without hesitation.
 *
 * Everything outside these lists either thins the module (so the dark area a
 * camera integrates over shrinks) or reshapes the finder patterns, which are
 * the first thing a decoder looks for.
 */
const FAST_MODULE_STYLES: ModuleStyle[] = ['square', 'rounded'];
const FAST_CORNER_STYLES: CornerStyle[] = ['square', 'rounded', 'thick'];

/**
 * How much of the symbol the logo plate erases, as a share of the symbol's
 * area rather than of the whole sheet.
 *
 * The old check just compared `logoScale` against a fixed number, which is now
 * wrong in both directions: padding grows the erased area well beyond the
 * artwork, and a circular plate erases roughly a fifth less than a square one
 * at the same size. Error correction has a real budget — this measures what is
 * actually being spent against it.
 */
function logoCoverage(config: QRConfig, moduleCount: number): number {
  if (!config.logoUrl) return 0;

  // Geometry on a unit sheet, so every number below is a fraction of the edge.
  const geometry = getLogoGeometry(1, config);
  const plateShape = config.logoPlateShape ?? 'rounded';
  // A circle inscribed in a square covers pi/4 of it; a rounded square sits
  // between the two and is close enough to treat as square.
  const shapeFactor = plateShape === 'circle' ? Math.PI / 4 : 1;
  const plateArea = geometry.plateSize * geometry.plateSize * shapeFactor;

  const quietZone = Math.max(0, Math.round(config.quietZone ?? 0));
  const symbolEdge = moduleCount / (moduleCount + quietZone * 2);
  const symbolArea = symbolEdge * symbolEdge;
  if (symbolArea <= 0) return 0;

  return Math.min(1, plateArea / symbolArea);
}

/**
 * Coverage ceilings. Error correction at H repairs about 30% of the codewords,
 * but a single blob in the middle is harder on a decoder than the same amount
 * of scattered damage, so the usable ceiling sits below the headline number.
 */
const COVERAGE_INFO = 0.16;
const COVERAGE_WARNING = 0.22;
const COVERAGE_ERROR = 0.28;

/** Coverage the optimiser shrinks a logo back down to. */
const COVERAGE_TARGET = 0.15;

/**
 * Module counts a phone locks onto instantly versus ones it has to hunt for.
 * Version 10 is 57 modules across: at that point the camera has to be closer
 * and steadier, which is exactly what "slow to scan" feels like in the hand.
 */
const DENSE_VERSION = 10;
const VERY_DENSE_VERSION = 16;

function versionOf(moduleCount: number): number {
  return Math.max(1, Math.round((moduleCount - 17) / 4));
}

function moduleCountFor(config: QRConfig): number {
  try {
    return generateQRMatrix(config).size;
  } catch {
    // Over capacity: the preview reports that on its own, and there is no
    // symbol to measure.
    return 0;
  }
}

export function analyzeScanReliability(config: QRConfig, frame?: FrameConfig): ScanReliabilityResult {
  const issues: ScanIssue[] = [];
  let score = 100;

  const moduleCount = moduleCountFor(config);
  const version = moduleCount ? versionOf(moduleCount) : 0;
  const coverage = moduleCount ? logoCoverage(config, moduleCount) : 0;

  const bgColor = config.transparentBg ? '#FFFFFF' : config.bgColor;
  const contrast = contrastRatio(config.color1, bgColor);

  if (contrast < 2) {
    score -= 30;
    issues.push({ type: 'contrast', severity: 'error', message: 'Very low contrast between QR and background', suggestion: 'Use a much darker foreground or lighter background' });
  } else if (contrast < 3) {
    score -= 15;
    issues.push({ type: 'contrast', severity: 'warning', message: 'Low contrast may cause scan issues', suggestion: 'Increase contrast between foreground and background colors' });
  }

  if (coverage > COVERAGE_ERROR) {
    score -= 30;
    issues.push({ type: 'logo', severity: 'error', message: 'Logo erases more of the code than error correction can rebuild', suggestion: 'Shrink the logo, cut its padding, or switch the plate to a circle' });
  } else if (coverage > COVERAGE_WARNING) {
    score -= 20;
    issues.push({ type: 'logo', severity: 'warning', message: 'Logo is large and may obstruct QR data', suggestion: 'Shrink the logo, cut its padding, or switch the plate to a circle' });
  } else if (coverage > COVERAGE_INFO) {
    score -= 8;
    issues.push({ type: 'logo', severity: 'info', message: 'Logo size is near the safe limit', suggestion: 'Consider reducing logo scale slightly' });
  }

  // A logo with no plate behind it leaves artwork touching live modules, and a
  // decoder that cannot find a clean edge between them slows down or gives up.
  if (config.logoUrl && !(config.logoPlate ?? true) && (config.logoBorderWidth ?? 0) <= 0) {
    score -= 8;
    issues.push({ type: 'logo', severity: 'info', message: 'Logo sits directly on the modules', suggestion: 'Turn the backing plate on, or add an outline, to keep the artwork separate' });
  }

  if (config.logoUrl && config.errorCorrection !== 'H') {
    score -= 15;
    issues.push({ type: 'logo', severity: 'warning', message: 'Logo requires high error correction', suggestion: 'Set error correction to H when using a logo' });
  }

  if (!FAST_MODULE_STYLES.includes(config.moduleStyle)) {
    score -= 10;
    issues.push({ type: 'style', severity: 'info', message: 'Decorative modules slow a camera down', suggestion: 'Square or rounded modules read fastest' });
  }

  // The finder patterns are what a scanner hunts for first. Restyling them past
  // recognition is the most expensive decoration on the sheet.
  if (!FAST_CORNER_STYLES.includes(config.cornerStyle)) {
    score -= 12;
    issues.push({ type: 'style', severity: 'warning', message: 'Corner style distorts the finder patterns', suggestion: 'Square, rounded or thick corners let a scanner lock on immediately' });
  }

  // Density is the real driver of how long a phone hovers before it reads.
  if (version >= VERY_DENSE_VERSION) {
    score -= 20;
    issues.push({ type: 'density', severity: 'warning', message: 'Very dense grid; the camera has to get close', suggestion: 'Shorten the content — a short link keeps the grid coarse and reads instantly' });
  } else if (version >= DENSE_VERSION) {
    score -= 10;
    issues.push({ type: 'density', severity: 'info', message: 'Dense grid slows the first read', suggestion: 'Shorten the content — a short link keeps the grid coarse and reads instantly' });
  }

  const fgRgb = hexToRgb(config.color1);
  if (fgRgb[0] > 200 && fgRgb[1] > 200 && fgRgb[2] > 200 && !config.transparentBg) {
    score -= 20;
    issues.push({ type: 'color', severity: 'error', message: 'Foreground color is too light', suggestion: 'Use a darker foreground color for better scanning' });
  }

  if (config.size < 200) {
    score -= 10;
    issues.push({ type: 'spacing', severity: 'warning', message: 'QR code is very small', suggestion: 'Increase size to at least 300px for reliable printing' });
  }

  score = Math.max(0, Math.min(100, score));
  const grade = score >= 85 ? 'Excellent' : score >= 65 ? 'Good' : score >= 45 ? 'Warning' : 'Risky';
  return { score, grade, issues, moduleCount, version, logoCoverage: coverage };
}

/* ------------------------------------------------------------- optimiser */

/** What the optimiser changed, so the panel can say it in the user's language. */
export type ScanFixCode =
  | 'modules'
  | 'corners'
  | 'contrast'
  | 'background'
  | 'quietZone'
  | 'size'
  | 'logo'
  | 'errorCorrection';

export interface ScanOptimization {
  updates: Partial<QRConfig>;
  applied: ScanFixCode[];
}

/** Contrast the optimiser aims for. Well past the 3:1 a decoder needs to cope. */
const TARGET_CONTRAST = 6;

function toHex(r: number, g: number, b: number): string {
  const channel = (value: number) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

/**
 * Walks a colour toward black until it clears the contrast target, keeping its
 * hue. Returns null when the colour already passes, so callers can tell whether
 * anything actually changed.
 */
function darkenForContrast(color: string, background: string, target: number): string | null {
  if (contrastRatio(color, background) >= target) return null;

  let [r, g, b] = hexToRgb(color);
  for (let step = 0; step < 20; step++) {
    r *= 0.82;
    g *= 0.82;
    b *= 0.82;
    const candidate = toHex(r, g, b);
    if (contrastRatio(candidate, background) >= target) return candidate;
  }
  return '#111111';
}

/**
 * One pass over everything that makes a code slow to read, applied as a single
 * edit so it lands in one undo step.
 *
 * It is deliberately conservative about looks: colours keep their hue, and a
 * decorative face is nudged to the nearest fast equivalent rather than reset to
 * plain black squares.
 */
export function optimizeForScanning(config: QRConfig): ScanOptimization {
  const updates: Partial<QRConfig> = {};
  const applied: ScanFixCode[] = [];

  if (!FAST_MODULE_STYLES.includes(config.moduleStyle)) {
    updates.moduleStyle = 'rounded';
    applied.push('modules');
  }

  if (!FAST_CORNER_STYLES.includes(config.cornerStyle)) {
    updates.cornerStyle = 'rounded';
    applied.push('corners');
  }

  // A transparent sheet is a gamble on whatever it gets placed over, so the
  // background is only forced opaque when the ink cannot carry the contrast.
  let background = config.transparentBg ? '#FFFFFF' : config.bgColor;
  const inks = config.colorMode === 'gradient' ? [config.color1, config.color2] : [config.color1];
  const inkFails = inks.some((ink) => contrastRatio(ink, background) < TARGET_CONTRAST);

  if (inkFails && config.transparentBg) {
    updates.transparentBg = false;
    updates.bgColor = '#FFFFFF';
    background = '#FFFFFF';
    applied.push('background');
  }

  const darkened1 = darkenForContrast(config.color1, background, TARGET_CONTRAST);
  if (darkened1) updates.color1 = darkened1;
  if (config.colorMode === 'gradient') {
    const darkened2 = darkenForContrast(config.color2, background, TARGET_CONTRAST);
    if (darkened2) updates.color2 = darkened2;
    if (darkened1 || darkened2) applied.push('contrast');
  } else if (darkened1) {
    applied.push('contrast');
  }

  if ((config.quietZone ?? 0) < 4) {
    updates.quietZone = 4;
    applied.push('quietZone');
  }

  if (config.size < 300) {
    updates.size = 300;
    applied.push('size');
  }

  if (config.logoUrl) {
    // Measured against the design as it will be *after* the edits above, not as
    // it is now: widening the quiet zone shrinks the symbol, so the same plate
    // ends up covering a larger share of it.
    const tuned = { ...config, ...updates };
    const moduleCount = moduleCountFor(tuned);
    const coverage = moduleCount ? logoCoverage(tuned, moduleCount) : 0;

    if (!(config.logoPlate ?? true)) {
      updates.logoPlate = true;
      applied.push('logo');
    }

    if (coverage > COVERAGE_WARNING) {
      // Coverage scales with the square of the plate, so the scale shrinks by
      // the square root of the ratio to land on the target.
      const shrink = Math.sqrt(COVERAGE_TARGET / coverage);
      updates.logoScale = Math.max(0.1, Math.round(config.logoScale * shrink * 100) / 100);
      if (!applied.includes('logo')) applied.push('logo');
    }
  } else if (config.errorCorrection === 'H') {
    // Without a logo there is nothing eating the codewords, and Q still repairs
    // a quarter of them — worth taking when it drops the grid a whole version.
    const atQ = moduleCountFor({ ...config, errorCorrection: 'Q' });
    const atH = moduleCountFor(config);
    if (atQ && atH && atQ < atH) {
      updates.errorCorrection = 'Q';
      applied.push('errorCorrection');
    }
  }

  return { updates, applied };
}
