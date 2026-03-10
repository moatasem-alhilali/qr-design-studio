import { useEffect, useRef, useCallback } from "react";
import { QRConfig, generateQRMatrix, renderQRToCanvas, exportCanvasAsPNG, exportCanvasAsSVG, downloadSVG } from "@/lib/qr-engine";
import { Button } from "@/components/ui/button";
import { Image, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { FrameConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QRPreviewProps {
  config: QRConfig;
  frame?: FrameConfig;
}

interface FrameMetrics {
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
  qrX: number;
  qrY: number;
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

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripOuterSvg(svg: string) {
  return svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
}

function withAlpha(color: string, alpha: number) {
  if (!color.startsWith("#")) return color;

  const normalized = color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;

  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTypography(frame: FrameConfig) {
  return {
    badgeSize: Math.max(10, Math.round(frame.fontSize * 0.72)),
    topSize: Math.max(11, Math.round(frame.fontSize * 0.86)),
    bottomSize: frame.fontSize + 2,
  };
}

function getFrameMetrics(frame: FrameConfig, qrSize: number): FrameMetrics {
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

  const panelWidth = qrSize + panelPadding * 2;
  const panelHeight = qrSize + panelPadding * 2;
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
  const qrX = panelX + panelPadding;
  const qrY = panelY + panelPadding;
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
    qrX,
    qrY,
  };
}

function getBadgeWidth(frame: FrameConfig) {
  const { badgeSize } = getTypography(frame);
  return Math.max(92, frame.badgeText.length * (badgeSize * 0.62) + 28);
}

function renderFramedCanvas(
  targetCanvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  config: QRConfig,
  frame: FrameConfig,
) {
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  const metrics = getFrameMetrics(frame, config.size);
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

  ctx.drawImage(sourceCanvas, metrics.qrX, metrics.qrY, config.size, config.size);

  if (frame.textBottom) {
    ctx.fillStyle = frame.textColor;
    ctx.font = `700 ${type.bottomSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(frame.textBottom, metrics.width / 2, metrics.bottomTextY);
  }
}

function exportFramedSvg(matrix: ReturnType<typeof generateQRMatrix>, config: QRConfig, frame: FrameConfig) {
  const metrics = getFrameMetrics(frame, config.size);
  const type = getTypography(frame);
  const qrSvg = exportCanvasAsSVG(matrix, config);
  const innerSvg = stripOuterSvg(qrSvg);
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
  svg += `<g transform="translate(${metrics.qrX} ${metrics.qrY})">${innerSvg}</g>`;

  if (frame.textBottom) {
    svg += `<text x="${metrics.width / 2}" y="${metrics.bottomTextY}" text-anchor="middle" dominant-baseline="hanging" font-family="Inter, system-ui, sans-serif" font-size="${type.bottomSize}" font-weight="700" fill="${frame.textColor}">${escapeXml(frame.textBottom)}</text>`;
  }

  svg += "</svg>";
  return svg;
}

export function QRPreview({ config, frame }: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<ReturnType<typeof generateQRMatrix> | null>(null);
  const hasFrame = Boolean(frame && frame.type !== "none");
  const frameMetrics = hasFrame && frame ? getFrameMetrics(frame, config.size) : null;
  const typography = hasFrame && frame ? getTypography(frame) : null;

  const render = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const matrix = generateQRMatrix(config);
      matrixRef.current = matrix;
      renderQRToCanvas(canvasRef.current, matrix, config);
    } catch {
      // invalid data, ignore
    }
  }, [config]);

  useEffect(() => {
    render();
  }, [render]);

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    if (hasFrame && frame) {
      const exportCanvas = document.createElement("canvas");
      renderFramedCanvas(exportCanvas, canvasRef.current, config, frame);
      exportCanvasAsPNG(exportCanvas, "qrcode.png");
      return;
    }
    exportCanvasAsPNG(canvasRef.current, "qrcode.png");
  };

  const handleDownloadSVG = () => {
    if (!matrixRef.current) return;
    const svg = hasFrame && frame
      ? exportFramedSvg(matrixRef.current, config, frame)
      : exportCanvasAsSVG(matrixRef.current, config);
    downloadSVG(svg, "qrcode.svg");
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        className={cn(
          "relative flex items-center justify-center",
          hasFrame ? "p-2" : "panel-section p-8",
        )}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {hasFrame && frame && frameMetrics && typography ? (
          <div
            className="w-fit"
            style={{
              backgroundColor: frame.bgColor,
              border: `${frame.borderWidth}px solid ${frame.borderColor}`,
              borderRadius: frame.cornerRadius,
              padding: frame.padding,
              boxShadow: frame.shadow ? `0 ${Math.max(8, frame.shadow / 2)}px ${frame.shadow * 2}px -${Math.round(frame.shadow / 2)}px ${withAlpha(frame.accentColor, 0.24)}` : "none",
            }}
          >
            <div className="flex flex-col items-center gap-2.5">
              {frame.badgeText && (
                <span
                  className="rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wide"
                  style={{
                    backgroundColor: frame.badgeColor,
                    color: frame.badgeTextColor,
                  }}
                >
                  {frame.badgeText}
                </span>
              )}

              {frame.textTop && (
                <p
                  className="text-center font-semibold uppercase tracking-[0.18em]"
                  style={{ color: frame.textColor, fontSize: typography.topSize }}
                >
                  {frame.textTop}
                </p>
              )}

              {frame.type !== "minimal" && (
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: Math.min(frameMetrics.panelWidth * 0.4, 120),
                    backgroundColor: frame.accentColor,
                  }}
                />
              )}

              <div
                className="rounded-[24px] border p-3"
                style={{
                  backgroundColor: frame.qrBackgroundColor,
                  borderColor: withAlpha(frame.borderColor, 0.2),
                  borderRadius: frameMetrics.panelRadius,
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto rounded-2xl"
                  style={{ maxWidth: "320px", maxHeight: "320px" }}
                />
              </div>

              {frame.textBottom && (
                <p
                  className="text-center font-bold tracking-tight"
                  style={{ color: frame.textColor, fontSize: typography.bottomSize }}
                >
                  {frame.textBottom}
                </p>
              )}
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto rounded-lg"
            style={{ maxWidth: "320px", maxHeight: "320px" }}
          />
        )}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={handleDownloadPNG} variant="outline" size="sm" className="gap-2">
          <Image className="h-4 w-4" />
          PNG
        </Button>
        <Button onClick={handleDownloadSVG} variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          SVG
        </Button>
      </div>

      <div className="text-center">
        <p className="font-mono text-xs text-muted-foreground">
          {config.size}×{config.size}px · Error correction: {config.errorCorrection}
        </p>
      </div>
    </div>
  );
}
