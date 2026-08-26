import { useEffect, useRef, useCallback, useState } from "react";
import {
  QRConfig,
  generateQRMatrix,
  renderQRToCanvas,
  createHighResQRCanvas,
  exportCanvasAsPDF,
  exportCanvasAsPNG,
  exportCanvasAsSVG,
  downloadSVG,
  getExportPixelRatio,
  getQRPixelMetrics,
} from "@/lib/qr-engine";
import { Button } from "@/components/ui/button";
import { Image, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { FrameConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { exportFramedSvg, getFrameMetrics, getTypography, renderFramedCanvas, scaleFrameConfig, withAlpha } from "@/components/code/frame-utils";
import { useI18n } from "@/shared/i18n/i18n";

interface QRPreviewProps {
  config: QRConfig;
  frame?: FrameConfig;
}

export function QRPreview({ config, frame }: QRPreviewProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<ReturnType<typeof generateQRMatrix> | null>(null);
  const [exportPixels, setExportPixels] = useState(config.size);
  const [isExporting, setIsExporting] = useState(false);
  const hasFrame = Boolean(frame && frame.type !== "none");
  const frameMetrics = hasFrame && frame ? getFrameMetrics(frame, config.size, config.size) : null;
  const typography = hasFrame && frame ? getTypography(frame) : null;
  const isScannerFrame = frame?.type === "scanner";

  const render = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const matrix = generateQRMatrix(config);
      matrixRef.current = matrix;
      renderQRToCanvas(canvasRef.current, matrix, config);
      setExportPixels(
        getQRPixelMetrics(matrix.size, config.size, getExportPixelRatio(config.size)).canvasSize,
      );
    } catch {
      // invalid data, ignore
    }
  }, [config]);

  useEffect(() => {
    // Switching between plain and framed preview remounts the canvas element.
    render();
  }, [render, hasFrame, frame?.type]);

  /**
   * Every raster export goes through here so the bitmap is rendered fresh at
   * print resolution *and* the logo bitmap is guaranteed to be decoded and
   * painted before the file is written.
   */
  const buildExportCanvas = useCallback(async () => {
    const qrCanvas = await createHighResQRCanvas(config);

    if (!hasFrame || !frame) {
      return {
        canvas: qrCanvas,
        logicalWidth: config.size,
        logicalHeight: config.size,
      };
    }

    const scale = qrCanvas.width / config.size;
    const logicalMetrics = getFrameMetrics(frame, config.size, config.size);
    const framedCanvas = document.createElement("canvas");
    renderFramedCanvas(framedCanvas, qrCanvas, scaleFrameConfig(frame, scale), scale);

    return {
      canvas: framedCanvas,
      logicalWidth: logicalMetrics.width,
      logicalHeight: logicalMetrics.height,
    };
  }, [config, frame, hasFrame]);

  const runExport = useCallback(
    async (write: (result: Awaited<ReturnType<typeof buildExportCanvas>>) => void) => {
      if (isExporting) return;
      setIsExporting(true);
      try {
        write(await buildExportCanvas());
      } catch {
        // invalid data or a broken logo; nothing to download
      } finally {
        setIsExporting(false);
      }
    },
    [buildExportCanvas, isExporting],
  );

  const handleDownloadPNG = () => {
    void runExport(({ canvas }) => exportCanvasAsPNG(canvas, "qrcode.png"));
  };

  const handleDownloadPDF = () => {
    void runExport(({ canvas, logicalWidth, logicalHeight }) =>
      exportCanvasAsPDF(canvas, "qrcode.pdf", { logicalWidth, logicalHeight }),
    );
  };

  const handleDownloadSVG = () => {
    if (!matrixRef.current) return;
    const svg = hasFrame && frame
      ? exportFramedSvg(exportCanvasAsSVG(matrixRef.current, config), frame, config.size, config.size)
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

              {frame.type !== "minimal" && frame.type !== "scanner" && (
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: Math.min(frameMetrics.panelWidth * 0.4, 120),
                    backgroundColor: frame.accentColor,
                  }}
                />
              )}

              <div
                className="relative rounded-[24px] border p-3"
                style={{
                  backgroundColor: frame.qrBackgroundColor,
                  borderColor: withAlpha(frame.borderColor, 0.2),
                  borderRadius: frameMetrics.panelRadius,
                }}
              >
                {isScannerFrame && (
                  <>
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute left-4 top-4 h-8 w-8 rounded-tl-[18px] border-l-[6px] border-t-[6px]" style={{ borderColor: frame.borderColor }} />
                      <div className="absolute right-4 top-4 h-8 w-8 rounded-tr-[18px] border-r-[6px] border-t-[6px]" style={{ borderColor: frame.borderColor }} />
                      <div className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-[18px] border-b-[6px] border-l-[6px]" style={{ borderColor: frame.borderColor }} />
                      <div className="absolute bottom-4 right-4 h-8 w-8 rounded-br-[18px] border-b-[6px] border-r-[6px]" style={{ borderColor: frame.borderColor }} />
                    </div>
                    <div className="pointer-events-none absolute -top-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
                      <span className="block h-4 w-4 rotate-45 border-b-[5px] border-r-[5px]" style={{ borderColor: frame.borderColor }} />
                      <span className="block h-4 w-4 rotate-45 border-b-[5px] border-r-[5px]" style={{ borderColor: frame.borderColor }} />
                    </div>
                  </>
                )}
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
        <Button onClick={handleDownloadPNG} disabled={isExporting} variant="outline" size="sm" className="gap-2">
          <Image className="h-4 w-4" />
          PNG
        </Button>
        <Button onClick={handleDownloadPDF} disabled={isExporting} variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          PDF
        </Button>
        <Button onClick={handleDownloadSVG} variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          SVG
        </Button>
      </div>

      <div className="text-center">
        <p className="font-mono text-xs text-muted-foreground">
          {config.size}×{config.size}px → {exportPixels}×{exportPixels}px · {t.qrControls.errorCorrectionShort}: {config.logoUrl ? "H" : config.errorCorrection}
        </p>
      </div>
    </div>
  );
}
