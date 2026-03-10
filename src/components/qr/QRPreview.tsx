import { useEffect, useRef, useCallback } from "react";
import { QRConfig, generateQRMatrix, renderQRToCanvas, exportCanvasAsPNG, exportCanvasAsSVG, downloadSVG } from "@/lib/qr-engine";
import { Button } from "@/components/ui/button";
import { Download, Image, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface QRPreviewProps {
  config: QRConfig;
}

export function QRPreview({ config }: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<ReturnType<typeof generateQRMatrix> | null>(null);

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
    exportCanvasAsPNG(canvasRef.current, "qrcode.png");
  };

  const handleDownloadSVG = () => {
    if (!matrixRef.current) return;
    const svg = exportCanvasAsSVG(matrixRef.current, config);
    downloadSVG(svg, "qrcode.svg");
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        className="relative panel-section p-8 flex items-center justify-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto rounded-lg"
          style={{ maxWidth: "320px", maxHeight: "320px" }}
        />
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
