import { QRConfig } from './qr-engine';
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

export function analyzeScanReliability(config: QRConfig, frame?: FrameConfig): ScanReliabilityResult {
  const issues: ScanIssue[] = [];
  let score = 100;

  const bgColor = config.transparentBg ? '#FFFFFF' : config.bgColor;
  const contrast = contrastRatio(config.color1, bgColor);

  if (contrast < 2) {
    score -= 30;
    issues.push({ type: 'contrast', severity: 'error', message: 'Very low contrast between QR and background', suggestion: 'Use a much darker foreground or lighter background' });
  } else if (contrast < 3) {
    score -= 15;
    issues.push({ type: 'contrast', severity: 'warning', message: 'Low contrast may cause scan issues', suggestion: 'Increase contrast between foreground and background colors' });
  }

  if (config.logoUrl && config.logoScale > 0.3) {
    score -= 20;
    issues.push({ type: 'logo', severity: 'warning', message: 'Logo is large and may obstruct QR data', suggestion: 'Reduce logo scale to under 25%' });
  } else if (config.logoUrl && config.logoScale > 0.25) {
    score -= 10;
    issues.push({ type: 'logo', severity: 'info', message: 'Logo size is near the safe limit', suggestion: 'Consider reducing logo scale slightly' });
  }

  if (config.logoUrl && config.errorCorrection !== 'H') {
    score -= 15;
    issues.push({ type: 'logo', severity: 'warning', message: 'Logo requires high error correction', suggestion: 'Set error correction to H when using a logo' });
  }

  if (config.moduleStyle === 'diamond') {
    score -= 10;
    issues.push({ type: 'style', severity: 'info', message: 'Diamond modules may reduce scanner compatibility', suggestion: 'Use rounded or dots for better compatibility' });
  }

  if (config.data.length > 200) {
    score -= 10;
    issues.push({ type: 'density', severity: 'warning', message: 'Long data increases QR density', suggestion: 'Use a shorter URL or dynamic QR for long content' });
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
  return { score, grade, issues };
}
