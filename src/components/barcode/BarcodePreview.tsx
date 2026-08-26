import { useCallback, useEffect, useRef } from "react";
import { Download, FileCode2, FileImage, FileText } from "lucide-react";

import { BarcodeConfig, exportBarcodeAsSVG, generateBarcodeModel, renderBarcodeToCanvas } from "@/lib/barcode-engine";
import { FrameConfig } from "@/lib/types";
import { downloadSVG, exportCanvasAsPDF, exportCanvasAsPNG } from "@/lib/qr-engine";
import { Sheet } from "@/components/workshop/Sheet";
import { Stamp } from "@/components/workshop/Stamp";
import { ColourBar } from "@/components/workshop/InkWell";
import { exportFramedSvg, getFrameMetrics, getTypography, renderFramedCanvas, scaleFrameConfig, withAlpha } from "@/components/code/frame-utils";
import { useI18n } from "@/shared/i18n/i18n";

interface BarcodePreviewProps {
  config: BarcodeConfig;
  frame?: FrameConfig;
}

/** Aim every raster export at roughly this many pixels on the long edge. */
const TARGET_EXPORT_PX = 2400;

export function BarcodePreview({ config, frame }: BarcodePreviewProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<ReturnType<typeof generateBarcodeModel> | null>(null);
  const hasFrame = Boolean(frame && frame.type !== "none");
  const frameMetrics =
    hasFrame && frame && modelRef.current
      ? getFrameMetrics(frame, modelRef.current.width, modelRef.current.height)
      : null;
  const typography = hasFrame && frame ? getTypography(frame) : null;
  const isScannerFrame = frame?.type === "scanner";

  const render = useCallback(() => {
    if (!canvasRef.current) return;
    const model = generateBarcodeModel(config);
    modelRef.current = model;
    renderBarcodeToCanvas(canvasRef.current, model, config);
  }, [config]);

  useEffect(() => {
    try {
      render();
    } catch {
      // invalid data, ignore
    }
  }, [render, hasFrame, frame?.type]);

  /**
   * Both raster exports build a fresh print-resolution bitmap. Reusing the
   * on-screen canvas would ship a screen-resolution file, which is what made
   * the previous PNG exports look soft.
   */
  const buildExportCanvas = useCallback(() => {
    const baseModel = generateBarcodeModel(config);
    const scale = Math.min(8, Math.max(3, Math.ceil(TARGET_EXPORT_PX / Math.max(1, baseModel.width))));

    const highResConfig: BarcodeConfig = {
      ...config,
      barWidth: config.barWidth * scale,
      height: config.height * scale,
      margin: config.margin * scale,
      textMargin: config.textMargin * scale,
      fontSize: config.fontSize * scale,
    };

    const sourceCanvas = document.createElement("canvas");
    renderBarcodeToCanvas(sourceCanvas, generateBarcodeModel(highResConfig), highResConfig);

    if (!hasFrame || !frame) {
      return { canvas: sourceCanvas, logicalWidth: baseModel.width, logicalHeight: baseModel.height };
    }

    const logicalMetrics = getFrameMetrics(frame, baseModel.width, baseModel.height);
    const framedCanvas = document.createElement("canvas");
    renderFramedCanvas(framedCanvas, sourceCanvas, scaleFrameConfig(frame, scale), scale);

    return {
      canvas: framedCanvas,
      logicalWidth: logicalMetrics.width,
      logicalHeight: logicalMetrics.height,
    };
  }, [config, frame, hasFrame]);

  const handleDownloadPNG = () => {
    exportCanvasAsPNG(buildExportCanvas().canvas, "barcode.png");
  };

  const handleDownloadPDF = () => {
    const { canvas, logicalWidth, logicalHeight } = buildExportCanvas();
    exportCanvasAsPDF(canvas, "barcode.pdf", { logicalWidth, logicalHeight });
  };

  const handleDownloadSVG = () => {
    if (!modelRef.current) return;
    const svg = exportBarcodeAsSVG(modelRef.current, config);
    downloadSVG(
      hasFrame && frame ? exportFramedSvg(svg, frame, modelRef.current.width, modelRef.current.height) : svg,
      "barcode.svg",
    );
  };

  const proofSurface = {
    backgroundColor: config.transparentBg ? "transparent" : config.bgColor,
    boxShadow:
      "0 1px 2px hsl(var(--cast) / 0.3), 0 10px 24px -10px hsl(var(--cast) / 0.5), 0 24px 44px -30px hsl(var(--cast) / 0.6)",
  };

  const canvasSizing = { maxWidth: "min(460px, 100%)", maxHeight: "280px" };

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

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] text-ink-faint">
          <span className="text-ink-mid">{t.home.proof}</span>
          <span aria-hidden>·</span>
          <span className="font-semibold text-ink">{config.format}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{config.barWidth}px {t.barcodeControls.bars}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{config.height}px {t.barcodeControls.height}</span>
        </div>
      </div>

      <hr className="perf" />

      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <span className="spec flex items-center gap-1.5">
          <Download className="h-3.5 w-3.5" aria-hidden />
          {t.home.download}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <Stamp onClick={handleDownloadPNG}>
            <FileImage className="h-3.5 w-3.5" />
            PNG
          </Stamp>
          <Stamp onClick={handleDownloadPDF} solid>
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
