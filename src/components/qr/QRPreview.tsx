import { useEffect, useRef, useCallback } from "react";
import { QRConfig, generateQRMatrix, renderQRToCanvas, exportCanvasAsPNG, exportCanvasAsSVG, downloadSVG } from "@/lib/qr-engine";
import { Button } from "@/components/ui/button";
import { Download, Image, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { FrameConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QRPreviewProps {
  config: QRConfig;
  frame?: FrameConfig;
}

interface FrameMetrics {
  borderWidth: number;
  borderRadius: number;
  width: number;
  height: number;
  qrX: number;
  qrY: number;
  topTextY: number;
  bottomTextY: number;
}

function getFrameMetrics(frame: FrameConfig, qrSize: number): FrameMetrics {
  const borderWidth = frame.type === "bold" ? 4 : frame.type === "premium" ? 3 : 2;
  const borderRadius =
    frame.type === "rounded" || frame.type === "social" || frame.type === "premium"
      ? 16
      : frame.type === "minimal"
        ? 8
        : 0;
  const textSpacing = 8;
  const textLineHeight = Math.ceil(frame.fontSize * 1.2);
  const topTextBlock = frame.textTop ? textLineHeight + textSpacing : 0;
  const bottomTextBlock = frame.textBottom ? textSpacing + textLineHeight : 0;
  const width = qrSize + frame.padding * 2 + borderWidth * 2;
  const height = width + topTextBlock + bottomTextBlock;
  const qrX = borderWidth + frame.padding;
  const qrY = borderWidth + frame.padding + topTextBlock;
  const topTextY = borderWidth + frame.padding;
  const bottomTextY = qrY + qrSize + textSpacing;

  return {
    borderWidth,
    borderRadius,
    width,
    height,
    qrX,
    qrY,
    topTextY,
    bottomTextY,
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

function renderFramedCanvas(
  targetCanvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  config: QRConfig,
  frame: FrameConfig,
) {
  const metrics = getFrameMetrics(frame, config.size);
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  targetCanvas.width = metrics.width;
  targetCanvas.height = metrics.height;

  ctx.clearRect(0, 0, metrics.width, metrics.height);
  ctx.fillStyle = frame.bgColor;
  roundRect(ctx, 0, 0, metrics.width, metrics.height, metrics.borderRadius);
  ctx.fill();

  if (metrics.borderWidth > 0) {
    const inset = metrics.borderWidth / 2;
    ctx.strokeStyle = frame.borderColor;
    ctx.lineWidth = metrics.borderWidth;
    roundRect(
      ctx,
      inset,
      inset,
      metrics.width - metrics.borderWidth,
      metrics.height - metrics.borderWidth,
      Math.max(0, metrics.borderRadius - inset),
    );
    ctx.stroke();
  }

  ctx.drawImage(sourceCanvas, metrics.qrX, metrics.qrY, config.size, config.size);

  ctx.fillStyle = frame.textColor;
  ctx.font = `600 ${frame.fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  if (frame.textTop) {
    ctx.fillText(frame.textTop, metrics.width / 2, metrics.topTextY);
  }

  if (frame.textBottom) {
    ctx.fillText(frame.textBottom, metrics.width / 2, metrics.bottomTextY);
  }
}

function exportFramedSvg(matrix: ReturnType<typeof generateQRMatrix>, config: QRConfig, frame: FrameConfig) {
  const metrics = getFrameMetrics(frame, config.size);
  const qrSvg = exportCanvasAsSVG(matrix, config);
  const innerSvg = stripOuterSvg(qrSvg);
  const inset = metrics.borderWidth / 2;
  const radius = Math.max(0, metrics.borderRadius - inset);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${metrics.width} ${metrics.height}" width="${metrics.width}" height="${metrics.height}">`;
  svg += `<rect x="${inset}" y="${inset}" width="${metrics.width - metrics.borderWidth}" height="${metrics.height - metrics.borderWidth}" rx="${radius}" fill="${frame.bgColor}" stroke="${frame.borderColor}" stroke-width="${metrics.borderWidth}"/>`;

  if (frame.textTop) {
    svg += `<text x="${metrics.width / 2}" y="${metrics.topTextY}" text-anchor="middle" dominant-baseline="hanging" font-family="Inter, system-ui, sans-serif" font-size="${frame.fontSize}" font-weight="600" fill="${frame.textColor}">${escapeXml(frame.textTop)}</text>`;
  }

  svg += `<g transform="translate(${metrics.qrX} ${metrics.qrY})">${innerSvg}</g>`;

  if (frame.textBottom) {
    svg += `<text x="${metrics.width / 2}" y="${metrics.bottomTextY}" text-anchor="middle" dominant-baseline="hanging" font-family="Inter, system-ui, sans-serif" font-size="${frame.fontSize}" font-weight="600" fill="${frame.textColor}">${escapeXml(frame.textBottom)}</text>`;
  }

  svg += "</svg>";
  return svg;
}

export function QRPreview({ config, frame }: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<ReturnType<typeof generateQRMatrix> | null>(null);
  const hasFrame = Boolean(frame && frame.type !== "none");
  const frameMetrics = hasFrame && frame ? getFrameMetrics(frame, config.size) : null;

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
        {hasFrame && frame ? (
          <div
            className="overflow-hidden"
            style={{
              backgroundColor: frame.bgColor,
              border: `${frameMetrics?.borderWidth ?? 0}px solid ${frame.borderColor}`,
              borderRadius: frameMetrics?.borderRadius ?? 0,
              padding: frame.padding,
            }}
          >
            {frame.textTop && (
              <p
                className="mb-2 text-center font-semibold"
                style={{ color: frame.textColor, fontSize: frame.fontSize }}
              >
                {frame.textTop}
              </p>
            )}
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-lg"
              style={{ maxWidth: "320px", maxHeight: "320px" }}
            />
            {frame.textBottom && (
              <p
                className="mt-2 text-center font-semibold"
                style={{ color: frame.textColor, fontSize: frame.fontSize }}
              >
                {frame.textBottom}
              </p>
            )}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto rounded-lg"
            style={{ maxWidth: "320px", maxHeight: "320px" }}
          />
        )}
      </motion.div>

      <div className="flex gap-2 flex-wrap justify-center">
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
        <p className="text-xs text-muted-foreground font-mono">
          {config.size}×{config.size}px · Error correction: {config.errorCorrection}
        </p>
      </div>
    </div>
  );
}
