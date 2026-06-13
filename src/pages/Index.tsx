import { useState, useCallback, useEffect } from "react";
import { QRConfig, defaultConfig } from "@/lib/qr-engine";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QrCode, Palette, Sparkles, ShieldCheck, Square, Barcode } from "lucide-react";
import { motion } from "framer-motion";
import { FrameConfig, defaultFrameConfig } from "@/lib/types";
import { qrTemplates } from "@/lib/qr-templates";
import { Label } from "@/components/ui/label";
import { BarcodeConfig, defaultBarcodeConfig } from "@/lib/barcode-engine";
import { cn } from "@/lib/utils";

const Index = () => {
  const [designType, setDesignType] = useState<"qr" | "barcode">("qr");
  const [config, setConfig] = useState<QRConfig>(defaultConfig);
  const [barcodeConfig, setBarcodeConfig] = useState<BarcodeConfig>(defaultBarcodeConfig);
  const [frameConfig, setFrameConfig] = useState<FrameConfig>(defaultFrameConfig);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const templateId = searchParams.get("template");
    if (templateId) {
      const tmpl = qrTemplates.find((t) => t.id === templateId);
      if (tmpl) {
        setConfig((prev) => ({ ...prev, ...tmpl.config, dataType: tmpl.dataType, data: "" }));
        if (tmpl.suggestedFrame) {
          setFrameConfig((prev) => ({ ...prev, type: "simple", textBottom: tmpl.suggestedFrame }));
        }
      }
    }
  }, []);

  const handleChange = useCallback((updates: Partial<QRConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleFullChange = useCallback((newConfig: QRConfig) => {
    setConfig(newConfig);
  }, []);

  const handleBarcodeChange = useCallback((updates: Partial<BarcodeConfig>) => {
    setBarcodeConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleFullBarcodeChange = useCallback((newConfig: BarcodeConfig) => {
    setBarcodeConfig(newConfig);
  }, []);

  return (
    <div className="container px-4 py-6">
      {/* Desktop layout */}
      <div className="hidden lg:grid lg:grid-cols-[300px_1fr_300px] gap-6 items-start">
        {/* Left Panel */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <ScrollArea className="h-[calc(100vh-6rem)]">
            <div className="space-y-6 pr-2">
              <div className="panel-section">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Generator</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "qr", label: "QR Code", icon: QrCode },
                    { value: "barcode", label: "Barcode", icon: Barcode },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setDesignType(value as "qr" | "barcode")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                        designType === value
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-section">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Mode</Label>
                <p className="text-sm text-foreground">{designType === "qr" ? "Static QR" : "Static Barcode"}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {designType === "qr"
                    ? "Generate static QR codes with custom styling, frames, and exports."
                    : "Generate printable barcodes with multiple symbologies, styling, labels, and exports."}
                </p>
              </div>

              <div className="panel-section">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  {designType === "qr" ? <QrCode className="h-4 w-4 text-primary" /> : <Barcode className="h-4 w-4 text-primary" />} Data
                </h2>
                {designType === "qr" ? (
                  <DataInput config={config} onChange={handleChange} />
                ) : (
                  <BarcodeDataInput config={barcodeConfig} onChange={handleBarcodeChange} />
                )}
              </div>

              <div className="panel-section">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Style
                </h2>
                {designType === "qr" ? (
                  <StyleControls config={config} onChange={handleChange} />
                ) : (
                  <BarcodeStyleControls config={barcodeConfig} onChange={handleBarcodeChange} />
                )}
              </div>
            </div>
          </ScrollArea>
        </motion.div>

        {/* Center Preview */}
        <motion.div className="flex flex-col items-center justify-center py-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          {designType === "qr" ? (
            <QRPreview config={config} frame={frameConfig} />
          ) : (
            <BarcodePreview config={barcodeConfig} frame={frameConfig} />
          )}
        </motion.div>

        {/* Right Panel */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <ScrollArea className="h-[calc(100vh-6rem)]">
            <Tabs defaultValue="presets" className="pr-2">
              <TabsList className="w-full grid grid-cols-3 mb-3">
                <TabsTrigger value="presets" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />Presets</TabsTrigger>
                <TabsTrigger value="frame" className="text-xs"><Square className="h-3 w-3 mr-1" />Frame</TabsTrigger>
                <TabsTrigger value="quality" className="text-xs"><ShieldCheck className="h-3 w-3 mr-1" />Quality</TabsTrigger>
              </TabsList>
              <TabsContent value="presets" className="panel-section">
                {designType === "qr" ? (
                  <PresetPanel config={config} onChange={handleFullChange} onPartialChange={handleChange} />
                ) : (
                  <BarcodePresetPanel config={barcodeConfig} onChange={handleFullBarcodeChange} />
                )}
              </TabsContent>
              <TabsContent value="frame" className="panel-section">
                <QRFrameEditor frame={frameConfig} onChange={setFrameConfig} />
              </TabsContent>
              <TabsContent value="quality" className="panel-section">
                {designType === "qr" ? (
                  <ScanReliabilityPanel config={config} frame={frameConfig} />
                ) : (
                  <BarcodeReliabilityPanel config={barcodeConfig} />
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </motion.div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden space-y-6">
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "qr", label: "QR Code", icon: QrCode },
            { value: "barcode", label: "Barcode", icon: Barcode },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setDesignType(value as "qr" | "barcode")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                designType === value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="panel-section">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Mode</Label>
          <p className="text-sm text-foreground">{designType === "qr" ? "Static QR" : "Static Barcode"}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {designType === "qr"
              ? "Generate static QR codes with custom styling, frames, and exports."
              : "Generate printable barcodes with multiple symbologies, styling, labels, and exports."}
          </p>
        </div>

        <div className="flex justify-center">
          {designType === "qr" ? (
            <QRPreview config={config} frame={frameConfig} />
          ) : (
            <BarcodePreview config={barcodeConfig} frame={frameConfig} />
          )}
        </div>

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="data" className="text-[10px]">Data</TabsTrigger>
            <TabsTrigger value="style" className="text-[10px]">Style</TabsTrigger>
            <TabsTrigger value="presets" className="text-[10px]">Presets</TabsTrigger>
            <TabsTrigger value="frame" className="text-[10px]">Frame</TabsTrigger>
            <TabsTrigger value="quality" className="text-[10px]">Quality</TabsTrigger>
          </TabsList>
          <TabsContent value="data" className="panel-section mt-3">
            {designType === "qr" ? (
              <DataInput config={config} onChange={handleChange} />
            ) : (
              <BarcodeDataInput config={barcodeConfig} onChange={handleBarcodeChange} />
            )}
          </TabsContent>
          <TabsContent value="style" className="panel-section mt-3">
            {designType === "qr" ? (
              <StyleControls config={config} onChange={handleChange} />
            ) : (
              <BarcodeStyleControls config={barcodeConfig} onChange={handleBarcodeChange} />
            )}
          </TabsContent>
          <TabsContent value="presets" className="panel-section mt-3">
            {designType === "qr" ? (
              <PresetPanel config={config} onChange={handleFullChange} onPartialChange={handleChange} />
            ) : (
              <BarcodePresetPanel config={barcodeConfig} onChange={handleFullBarcodeChange} />
            )}
          </TabsContent>
          <TabsContent value="frame" className="panel-section mt-3">
            <QRFrameEditor frame={frameConfig} onChange={setFrameConfig} />
          </TabsContent>
          <TabsContent value="quality" className="panel-section mt-3">
            {designType === "qr" ? (
              <ScanReliabilityPanel config={config} frame={frameConfig} />
            ) : (
              <BarcodeReliabilityPanel config={barcodeConfig} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
