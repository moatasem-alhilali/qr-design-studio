import { useState, useCallback } from "react";
import { QRConfig, defaultConfig } from "@/lib/qr-engine";
import { QRPreview } from "@/components/qr/QRPreview";
import { DataInput } from "@/components/qr/DataInput";
import { StyleControls } from "@/components/qr/StyleControls";
import { PresetPanel } from "@/components/qr/PresetPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QrCode, Palette, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const [config, setConfig] = useState<QRConfig>(defaultConfig);

  const handleChange = useCallback((updates: Partial<QRConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleFullChange = useCallback((newConfig: QRConfig) => {
    setConfig(newConfig);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              QR Studio
            </h1>
          </div>
          <span className="text-xs font-mono text-muted-foreground hidden sm:block">
            Design · Generate · Export
          </span>
        </div>
      </header>

      {/* Main Content - 3 column on desktop, stacked with tabs on mobile */}
      <div className="container px-4 py-6">
        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-[300px_1fr_280px] gap-6 items-start">
          {/* Left Panel */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-6 pr-2">
                <div className="panel-section">
                  <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-primary" />
                    Data
                  </h2>
                  <DataInput config={config} onChange={handleChange} />
                </div>
                <div className="panel-section">
                  <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Style
                  </h2>
                  <StyleControls config={config} onChange={handleChange} />
                </div>
              </div>
            </ScrollArea>
          </motion.div>

          {/* Center Preview */}
          <motion.div
            className="flex flex-col items-center justify-center py-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <QRPreview config={config} />
          </motion.div>

          {/* Right Panel */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="panel-section pr-2">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Presets & Logo
                </h2>
                <PresetPanel
                  config={config}
                  onChange={handleFullChange}
                  onPartialChange={handleChange}
                />
              </div>
            </ScrollArea>
          </motion.div>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden space-y-6">
          <div className="flex justify-center">
            <QRPreview config={config} />
          </div>

          <Tabs defaultValue="data" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
              <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
              <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
            </TabsList>
            <TabsContent value="data" className="panel-section mt-3">
              <DataInput config={config} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="style" className="panel-section mt-3">
              <StyleControls config={config} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="presets" className="panel-section mt-3">
              <PresetPanel
                config={config}
                onChange={handleFullChange}
                onPartialChange={handleChange}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
