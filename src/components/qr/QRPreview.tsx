import { useEffect, useRef, useCallback, useState } from "react";
import { FileImage, FileText, FileCode2 } from "lucide-react";

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
import { FrameConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/workshop/Sheet";
import { Stamp } from "@/components/workshop/Stamp";
import { ColourBar } from "@/components/workshop/InkWell";
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
  const [proof, setProof] = useState({ px: config.size, modules: 0 });
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
      setProof({
        px: getQRPixelMetrics(matrix.size, config.size, getExportPixelRatio(config.size)).canvasSize,
        modules: matrix.size,
      });
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
      return { canvas: qrCanvas, logicalWidth: config.size, logicalHeight: config.size };
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

  // The proof is a sheet of stock pasted onto the bench: its own contact
  // shadow, its own slight rotation.
  const proofSurface = {
    backgroundColor: config.transparentBg ? "transparent" : config.bgColor,
    boxShadow:
      "0 1px 2px hsl(var(--cast) / 0.3), 0 10px 24px -10px hsl(var(--cast) / 0.5), 0 24px 44px -30px hsl(var(--cast) / 0.6)",
  };

  const canvasSizing = { width: "clamp(200px, 30vw, 400px)", maxWidth: "100%" };

  return (
    <Sheet marks label={t.home.onPress} className="overflow-hidden">
      <div className="px-4 pb-5 pt-8 sm:px-8 sm:pb-7 sm:pt-10">
        <div className="flex min-h-[300px] items-center justify-center py-4">
          {hasFrame && frame && frameMetrics && typography ? (
            <div
              className="askew-1 w-fit"
              style={{
                backgroundColor: frame.bgColor,
                border: `${frame.borderWidth}px solid ${frame.borderColor}`,
                borderRadius: frame.cornerRadius,
                padding: frame.padding,
                boxShadow: frame.shadow
                  ? `0 ${Math.max(8, frame.shadow / 2)}px ${frame.shadow * 2}px -${Math.round(frame.shadow / 2)}px ${withAlpha(frame.accentColor, 0.24)}`
                  : "0 10px 24px -10px hsl(var(--cast) / 0.5)",
              }}
            >
              <div className="flex flex-col items-center gap-2.5">
                {frame.badgeText && (
                  <span
                    className="rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wide"
                    style={{ backgroundColor: frame.badgeColor, color: frame.badgeTextColor }}
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
                  className="relative border p-3"
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
                  <canvas ref={canvasRef} className="h-auto max-w-full" style={canvasSizing} />
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
            <div className="askew-1 p-3" style={proofSurface}>
              <canvas ref={canvasRef} className="block h-auto max-w-full" style={canvasSizing} />
            </div>
          )}
        </div>

        {/* Press readout: what will actually come off the machine. */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] text-ink-faint">
          <span className="text-ink-mid">{t.home.proof}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{config.size}px</span>
          <span aria-hidden>→</span>
          <span className="tabular-nums font-semibold text-ink">{proof.px}×{proof.px}px</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{proof.modules}×{proof.modules}</span>
          <span aria-hidden>·</span>
          <span>
            {t.qrControls.errorCorrectionShort}&nbsp;{config.logoUrl ? "H" : config.errorCorrection}
          </span>
        </div>
      </div>

      <hr className="perf" />

      {/* The stamp rack. */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <span className="spec">{t.home.pullProof}</span>
        <div className={cn("flex flex-wrap items-center gap-3", isExporting && "opacity-70")}>
          <Stamp onClick={handleDownloadPNG} disabled={isExporting}>
            <FileImage className="h-3.5 w-3.5" />
            PNG
          </Stamp>
          <Stamp onClick={handleDownloadPDF} disabled={isExporting} solid>
            <FileText className="h-3.5 w-3.5" />
            PDF
          </Stamp>
          <Stamp onClick={handleDownloadSVG}>
            <FileCode2 className="h-3.5 w-3.5" />
            SVG
          </Stamp>
        </div>
      </div>

      <ColourBar />
    </Sheet>
  );
}
