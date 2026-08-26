import { Barcode, Layers3, Palette, QrCode, ShieldCheck, Sparkles, SquareDashed, Type } from "lucide-react";
import { motion } from "framer-motion";

import { QRPreview } from "@/components/qr/QRPreview";
import { DataInput } from "@/components/qr/DataInput";
import { StyleControls } from "@/components/qr/StyleControls";
import { PresetPanel } from "@/components/qr/PresetPanel";
import { QRFrameEditor } from "@/components/qr/QRFrameEditor";
import { ScanReliabilityPanel } from "@/components/qr/ScanReliabilityPanel";
import { BarcodePreview } from "@/components/barcode/BarcodePreview";
import { BarcodeDataInput } from "@/components/barcode/BarcodeDataInput";
import { BarcodeStyleControls } from "@/components/barcode/BarcodeStyleControls";
import { BarcodePresetPanel } from "@/components/barcode/BarcodePresetPanel";
import { BarcodeReliabilityPanel } from "@/components/barcode/BarcodeReliabilityPanel";
import { BenchDrawer } from "@/components/workshop/BenchDrawer";
import { Tool } from "@/components/workshop/Tool";
import { useDesignerState, type DesignType } from "@/features/designer/hooks/useDesignerState";
import { useI18n } from "@/shared/i18n/i18n";

const Index = () => {
  const { t } = useI18n();
  const {
    designType,
    config,
    barcodeConfig,
    frameConfig,
    setDesignType,
    setFrameConfig,
    handleChange,
    handleFullChange,
    handleBarcodeChange,
    handleFullBarcodeChange,
  } = useDesignerState();

  const isQR = designType === "qr";

  const generators = [
    { value: "qr", label: t.home.qrCode, icon: QrCode, hint: t.home.staticQr },
    { value: "barcode", label: t.home.barcode, icon: Barcode, hint: t.home.staticBarcode },
  ] as const;

  const dataReadout = isQR
    ? `${t.values.dataTypes[config.dataType]} · ${config.data.slice(0, 28) || "—"}`
    : `${barcodeConfig.format} · ${barcodeConfig.value.slice(0, 24) || "—"}`;

  const styleReadout = isQR
    ? `${t.values.moduleStyles[config.moduleStyle]} · ${config.size}px`
    : `${barcodeConfig.barWidth}× · ${barcodeConfig.height}px`;

  return (
    <div className="mx-auto w-full max-w-[1560px] px-4 py-6">
      {/*
        Two zones, the way a real bench is arranged: the press on the left with
        the sheet currently being pulled, the tool bench on the right. The press
        stays put while you work through the drawers.
      */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(340px,32vw,440px)]">
        <motion.section
          className="lg:sticky lg:top-[9.5rem]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          aria-label={t.home.press}
        >
          {isQR ? (
            <QRPreview config={config} frame={frameConfig} />
          ) : (
            <BarcodePreview config={barcodeConfig} frame={frameConfig} />
          )}
        </motion.section>

        <motion.aside
          className="sheet overflow-hidden pb-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          aria-label={t.home.bench}
        >
          {/* Which machine is loaded. Always visible — never behind a drawer. */}
          <div className="sheet-sunk m-3 mb-0 p-3">
            <p className="spec mb-2">{t.home.generator}</p>
            <div className="grid grid-cols-2 gap-2">
              {generators.map(({ value, label, icon: Icon, hint }) => (
                <Tool
                  key={value}
                  on={designType === value}
                  onClick={() => setDesignType(value as DesignType)}
                  className="py-3"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[0.78rem] font-semibold">{label}</span>
                  <span className="text-[0.62rem] opacity-70">{hint}</span>
                </Tool>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <BenchDrawer
              title={t.home.data}
              readout={dataReadout}
              icon={<Type className="h-3 w-3" />}
              defaultOpen
            >
              {isQR ? (
                <DataInput config={config} onChange={handleChange} />
              ) : (
                <BarcodeDataInput config={barcodeConfig} onChange={handleBarcodeChange} />
              )}
            </BenchDrawer>

            <BenchDrawer
              title={t.home.style}
              readout={styleReadout}
              icon={<Palette className="h-3 w-3" />}
              tape="cyan"
              defaultOpen
            >
              {isQR ? (
                <StyleControls config={config} onChange={handleChange} />
              ) : (
                <BarcodeStyleControls config={barcodeConfig} onChange={handleBarcodeChange} />
              )}
            </BenchDrawer>

            <BenchDrawer title={t.home.presets} icon={<Sparkles className="h-3 w-3" />} tape="magenta">
              {isQR ? (
                <PresetPanel config={config} onChange={handleFullChange} onPartialChange={handleChange} />
              ) : (
                <BarcodePresetPanel config={barcodeConfig} onChange={handleFullBarcodeChange} />
              )}
            </BenchDrawer>

            <BenchDrawer
              title={t.home.frame}
              readout={frameConfig.type === "none" ? undefined : frameConfig.type}
              icon={<SquareDashed className="h-3 w-3" />}
            >
              <QRFrameEditor frame={frameConfig} onChange={setFrameConfig} />
            </BenchDrawer>

            <BenchDrawer title={t.home.quality} icon={<ShieldCheck className="h-3 w-3" />} tape="cyan">
              {isQR ? (
                <ScanReliabilityPanel config={config} frame={frameConfig} />
              ) : (
                <BarcodeReliabilityPanel config={barcodeConfig} />
              )}
            </BenchDrawer>
          </div>

          <p className="flex items-center gap-2 px-4 py-4 text-[11px] leading-snug text-ink-faint">
            <Layers3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {isQR ? t.home.qrDescription : t.home.barcodeDescription}
          </p>
        </motion.aside>
      </div>
    </div>
  );
};

export default Index;
