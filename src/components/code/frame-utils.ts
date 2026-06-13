import { FrameConfig } from "@/lib/types";

export interface FrameMetrics {
  width: number;
  height: number;
  badgeHeight: number;
  badgeY: number;
  topTextY: number;
  topTextHeight: number;
  bottomTextY: number;
  bottomTextHeight: number;
  accentX: number;
  accentY: number;
  accentWidth: number;
  accentHeight: number;
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
  panelRadius: number;
  contentX: number;
  contentY: number;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

export function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function stripOuterSvg(svg: string) {
  return svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
}

export function withAlpha(color: string, alpha: number) {
  if (!color.startsWith("#")) return color;

  const normalized = color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;

  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getTypography(frame: FrameConfig) {
  return {
    badgeSize: Math.max(10, Math.round(frame.fontSize * 0.72)),
    topSize: Math.max(11, Math.round(frame.fontSize * 0.86)),
    bottomSize: frame.fontSize + 2,
  };
}

export function scaleFrameConfig(frame: FrameConfig, scale: number): FrameConfig {
  return {
    ...frame,
    padding: Math.round(frame.padding * scale),
    fontSize: Math.round(frame.fontSize * scale),
    borderWidth: Math.max(1, Math.round(frame.borderWidth * scale)),
    cornerRadius: Math.round(frame.cornerRadius * scale),
    shadow: Math.round(frame.shadow * scale),
  };
}

export function getFrameMetrics(frame: FrameConfig, contentWidth: number, contentHeight: number): FrameMetrics {
  const outerPadding = frame.padding;
  const panelPadding = 12;
  const gap = 10;
  const showAccentBar = frame.type !== "minimal";
  const type = getTypography(frame);

  const badgeHeight = frame.badgeText ? Math.max(28, type.badgeSize + 12) : 0;
  const topTextHeight = frame.textTop ? Math.ceil(type.topSize * 1.35) : 0;
  const bottomTextHeight = frame.textBottom ? Math.ceil(type.bottomSize * 1.35) : 0;
  const accentHeight = showAccentBar ? 4 : 0;
  const accentBlock = showAccentBar ? accentHeight + gap : 0;
  const badgeBlock = badgeHeight ? badgeHeight + gap : 0;
  const topTextBlock = topTextHeight ? topTextHeight + gap : 0;

  const panelWidth = contentWidth + panelPadding * 2;
  const panelHeight = contentHeight + panelPadding * 2;
  const width = panelWidth + outerPadding * 2 + frame.borderWidth * 2;
  const height =
    panelHeight +
    outerPadding * 2 +
    frame.borderWidth * 2 +
    badgeBlock +
    topTextBlock +
    accentBlock +
    (bottomTextHeight ? gap + bottomTextHeight : 0);

  const panelX = frame.borderWidth + outerPadding;
  const badgeY = frame.borderWidth + outerPadding;
  const topTextY = badgeY + badgeBlock;
  const accentY = frame.borderWidth + outerPadding + badgeBlock + topTextBlock;
  const panelY = frame.borderWidth + outerPadding + badgeBlock + topTextBlock + accentBlock;
  const contentX = panelX + panelPadding;
  const contentY = panelY + panelPadding;
  const bottomTextY = panelY + panelHeight + gap;
  const accentWidth = Math.min(panelWidth * 0.4, 120);
  const accentX = (width - accentWidth) / 2;
  const panelRadius = Math.max(16, frame.cornerRadius - 10);

  return {
    width,
    height,
    badgeHeight,
    badgeY,
    topTextY,
    topTextHeight,
    bottomTextY,
    bottomTextHeight,
    accentX,
    accentY,
    accentWidth,
    accentHeight,
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    panelRadius,
    contentX,
    contentY,
  };
}

function getBadgeWidth(frame: FrameConfig) {
  const { badgeSize } = getTypography(frame);
  return Math.max(92, frame.badgeText.length * (badgeSize * 0.62) + 28);
}

export function renderFramedCanvas(targetCanvas: HTMLCanvasElement, sourceCanvas: HTMLCanvasElement, frame: FrameConfig) {
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  const metrics = getFrameMetrics(frame, sourceCanvas.width, sourceCanvas.height);
  const type = getTypography(frame);
  const outerRadius = frame.cornerRadius;
  const inset = frame.borderWidth / 2;

  targetCanvas.width = metrics.width;
  targetCanvas.height = metrics.height;
  ctx.clearRect(0, 0, metrics.width, metrics.height);

  if (frame.shadow > 0) {
    ctx.save();
    ctx.shadowColor = withAlpha(frame.accentColor, 0.22);
    ctx.shadowBlur = frame.shadow;
    ctx.shadowOffsetY = Math.max(4, Math.round(frame.shadow * 0.35));
    ctx.fillStyle = frame.bgColor;
    roundRect(
      ctx,
      inset,
      inset,
      metrics.width - frame.borderWidth,
      metrics.height - frame.borderWidth,
      Math.max(0, outerRadius - inset),
    );
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = frame.bgColor;
  roundRect(
    ctx,
    inset,
    inset,
    metrics.width - frame.borderWidth,
    metrics.height - frame.borderWidth,
    Math.max(0, outerRadius - inset),
  );
  ctx.fill();

  if (frame.borderWidth > 0) {
    ctx.strokeStyle = frame.borderColor;
    ctx.lineWidth = frame.borderWidth;
    roundRect(
      ctx,
      inset,
      inset,
      metrics.width - frame.borderWidth,
      metrics.height - frame.borderWidth,
      Math.max(0, outerRadius - inset),
    );
    ctx.stroke();
  }

  if (frame.badgeText) {
    const badgeWidth = getBadgeWidth(frame);
    const badgeX = (metrics.width - badgeWidth) / 2;
    ctx.fillStyle = frame.badgeColor;
    roundRect(ctx, badgeX, metrics.badgeY, badgeWidth, metrics.badgeHeight, metrics.badgeHeight / 2);
    ctx.fill();

    ctx.fillStyle = frame.badgeTextColor;
    ctx.font = `700 ${type.badgeSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(frame.badgeText, metrics.width / 2, metrics.badgeY + metrics.badgeHeight / 2);
  }

  if (frame.textTop) {
    ctx.fillStyle = frame.textColor;
    ctx.font = `600 ${type.topSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(frame.textTop, metrics.width / 2, metrics.topTextY);
  }

  if (metrics.accentHeight > 0) {
    ctx.fillStyle = frame.accentColor;
    roundRect(ctx, metrics.accentX, metrics.accentY, metrics.accentWidth, metrics.accentHeight, metrics.accentHeight / 2);
    ctx.fill();
  }

  ctx.fillStyle = frame.qrBackgroundColor;
  roundRect(ctx, metrics.panelX, metrics.panelY, metrics.panelWidth, metrics.panelHeight, metrics.panelRadius);
  ctx.fill();

  ctx.strokeStyle = withAlpha(frame.borderColor, 0.2);
  ctx.lineWidth = 1;
  roundRect(ctx, metrics.panelX + 0.5, metrics.panelY + 0.5, metrics.panelWidth - 1, metrics.panelHeight - 1, metrics.panelRadius - 0.5);
  ctx.stroke();

  if (frame.type === "scanner") {
    drawScannerDecorationsCanvas(ctx, metrics, frame);
  }

  ctx.drawImage(sourceCanvas, metrics.contentX, metrics.contentY, sourceCanvas.width, sourceCanvas.height);

  if (frame.textBottom) {
    ctx.fillStyle = frame.textColor;
    ctx.font = `700 ${type.bottomSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(frame.textBottom, metrics.width / 2, metrics.bottomTextY);
  }
}

export function exportFramedSvg(innerSvg: string, frame: FrameConfig, contentWidth: number, contentHeight: number) {
  const metrics = getFrameMetrics(frame, contentWidth, contentHeight);
  const type = getTypography(frame);
  const badgeWidth = frame.badgeText ? getBadgeWidth(frame) : 0;
  const badgeX = (metrics.width - badgeWidth) / 2;
  const outerInset = frame.borderWidth / 2;
  const outerRadius = Math.max(0, frame.cornerRadius - outerInset);
  const shadowId = `frame-shadow-${frame.type}`;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${metrics.width} ${metrics.height}" width="${metrics.width}" height="${metrics.height}">`;
  svg += "<defs>";
  if (frame.shadow > 0) {
    svg += `<filter id="${shadowId}" x="-20%" y="-20%" width="140%" height="160%">`;
    svg += `<feDropShadow dx="0" dy="${Math.max(4, Math.round(frame.shadow * 0.35))}" stdDeviation="${Math.max(4, Math.round(frame.shadow / 3))}" flood-color="${frame.accentColor}" flood-opacity="0.22" />`;
    svg += "</filter>";
  }
  svg += "</defs>";

  svg += `<rect x="${outerInset}" y="${outerInset}" width="${metrics.width - frame.borderWidth}" height="${metrics.height - frame.borderWidth}" rx="${outerRadius}" fill="${frame.bgColor}" stroke="${frame.borderColor}" stroke-width="${frame.borderWidth}"${frame.shadow > 0 ? ` filter="url(#${shadowId})"` : ""} />`;

  if (frame.badgeText) {
    svg += `<rect x="${badgeX}" y="${metrics.badgeY}" width="${badgeWidth}" height="${metrics.badgeHeight}" rx="${metrics.badgeHeight / 2}" fill="${frame.badgeColor}" />`;
    svg += `<text x="${metrics.width / 2}" y="${metrics.badgeY + metrics.badgeHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, system-ui, sans-serif" font-size="${type.badgeSize}" font-weight="700" fill="${frame.badgeTextColor}">${escapeXml(frame.badgeText)}</text>`;
  }

  if (frame.textTop) {
    svg += `<text x="${metrics.width / 2}" y="${metrics.topTextY}" text-anchor="middle" dominant-baseline="hanging" font-family="Inter, system-ui, sans-serif" font-size="${type.topSize}" font-weight="600" fill="${frame.textColor}">${escapeXml(frame.textTop)}</text>`;
  }

  if (metrics.accentHeight > 0) {
    svg += `<rect x="${metrics.accentX}" y="${metrics.accentY}" width="${metrics.accentWidth}" height="${metrics.accentHeight}" rx="${metrics.accentHeight / 2}" fill="${frame.accentColor}" />`;
  }

  svg += `<rect x="${metrics.panelX}" y="${metrics.panelY}" width="${metrics.panelWidth}" height="${metrics.panelHeight}" rx="${metrics.panelRadius}" fill="${frame.qrBackgroundColor}" stroke="${withAlpha(frame.borderColor, 0.2)}" stroke-width="1" />`;
  if (frame.type === "scanner") {
    svg += scannerDecorationsSvg(metrics, frame);
  }
  svg += `<g transform="translate(${metrics.contentX} ${metrics.contentY})">${stripOuterSvg(innerSvg)}</g>`;

  if (frame.textBottom) {
    svg += `<text x="${metrics.width / 2}" y="${metrics.bottomTextY}" text-anchor="middle" dominant-baseline="hanging" font-family="Inter, system-ui, sans-serif" font-size="${type.bottomSize}" font-weight="700" fill="${frame.textColor}">${escapeXml(frame.textBottom)}</text>`;
  }

  svg += "</svg>";
  return svg;
}

function drawScannerDecorationsCanvas(ctx: CanvasRenderingContext2D, metrics: FrameMetrics, frame: FrameConfig) {
  const inset = 16;
  const corner = 26;
  const left = metrics.panelX + inset;
  const right = metrics.panelX + metrics.panelWidth - inset;
  const top = metrics.panelY + inset;
  const bottom = metrics.panelY + metrics.panelHeight - inset;

  ctx.save();
  ctx.strokeStyle = frame.borderColor;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";

  const segments = [
    [left, top + corner, left, top, left + corner, top],
    [right - corner, top, right, top, right, top + corner],
    [left, bottom - corner, left, bottom, left + corner, bottom],
    [right - corner, bottom, right, bottom, right, bottom - corner],
  ] as const;

  for (const [x1, y1, x2, y2, x3, y3] of segments) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  }

  const centerX = metrics.width / 2;
  const chevronTop = metrics.panelY - 14;
  for (let i = 0; i < 2; i++) {
    const y = chevronTop - i * 12;
    ctx.beginPath();
    ctx.moveTo(centerX - 14, y);
    ctx.lineTo(centerX, y + 10);
    ctx.lineTo(centerX + 14, y);
    ctx.stroke();
  }
  ctx.restore();
}

function scannerDecorationsSvg(metrics: FrameMetrics, frame: FrameConfig) {
  const inset = 16;
  const corner = 26;
  const left = metrics.panelX + inset;
  const right = metrics.panelX + metrics.panelWidth - inset;
  const top = metrics.panelY + inset;
  const bottom = metrics.panelY + metrics.panelHeight - inset;
  const centerX = metrics.width / 2;
  const chevronTop = metrics.panelY - 14;

  let svg = `<g stroke="${frame.borderColor}" stroke-width="6" stroke-linecap="round" fill="none">`;
  svg += `<path d="M ${left} ${top + corner} L ${left} ${top} L ${left + corner} ${top}" />`;
  svg += `<path d="M ${right - corner} ${top} L ${right} ${top} L ${right} ${top + corner}" />`;
  svg += `<path d="M ${left} ${bottom - corner} L ${left} ${bottom} L ${left + corner} ${bottom}" />`;
  svg += `<path d="M ${right - corner} ${bottom} L ${right} ${bottom} L ${right} ${bottom - corner}" />`;
  for (let i = 0; i < 2; i++) {
    const y = chevronTop - i * 12;
    svg += `<path d="M ${centerX - 14} ${y} L ${centerX} ${y + 10} L ${centerX + 14} ${y}" />`;
  }
  svg += `</g>`;
  return svg;
}
