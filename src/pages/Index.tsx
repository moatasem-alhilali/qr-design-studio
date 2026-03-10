import { useState, useCallback, useEffect } from "react";
import { QRConfig, defaultConfig } from "@/lib/qr-engine";
import { QRPreview } from "@/components/qr/QRPreview";
import { DataInput } from "@/components/qr/DataInput";
import { StyleControls } from "@/components/qr/StyleControls";
import { PresetPanel } from "@/components/qr/PresetPanel";
import { QRFrameEditor } from "@/components/qr/QRFrameEditor";
import { ScanReliabilityPanel } from "@/components/qr/ScanReliabilityPanel";
import { AnimatedQR, AnimationStyle } from "@/components/qr/AnimatedQR";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QrCode, Palette, Sparkles, ShieldCheck, Save, Zap, Square } from "lucide-react";
import { motion } from "framer-motion";
import { FrameConfig, defaultFrameConfig } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { saveQRCode, getQRCode, updateQRCode } from "@/lib/services/qr-service";
import { createShortLink, getRedirectUrl, updateShortLink } from "@/lib/services/dynamic-qr-service";
import { qrTemplates } from "@/lib/qr-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const Index = () => {
  const [config, setConfig] = useState<QRConfig>(defaultConfig);
  const [frameConfig, setFrameConfig] = useState<FrameConfig>(defaultFrameConfig);
  const [animation, setAnimation] = useState<AnimationStyle>("none");
  const [qrType, setQrType] = useState<"static" | "dynamic">("static");
  const [dynamicUrl, setDynamicUrl] = useState("");
  const [qrName, setQrName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [shortCode, setShortCode] = useState<string | null>(null);
  const { user, isConfigured } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
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
    const eId = searchParams.get("edit");
    if (eId && isConfigured && user) {
      setEditId(eId);
      getQRCode(eId).then((qr) => {
        if (qr) {
          setConfig(qr.config);
          setFrameConfig(qr.frameConfig || defaultFrameConfig);
          setQrType(qr.type);
          setQrName(qr.name);
          setShortCode(qr.shortCode || null);
          if (qr.destinationUrl) setDynamicUrl(qr.destinationUrl);
        }
      });
    }
  }, [searchParams, user, isConfigured]);

  const handleChange = useCallback((updates: Partial<QRConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleFullChange = useCallback((newConfig: QRConfig) => {
    setConfig(newConfig);
  }, []);

  const handleSave = async () => {
    if (!user) { toast.error("Sign in to save QR codes"); return; }
    if (!qrName.trim()) { toast.error("Enter a name for your QR code"); return; }
    setSaving(true);
    try {
      const destUrl = dynamicUrl || config.data;

      if (qrType === "dynamic") {
        if (editId) {
          if (shortCode) {
            const redirectUrl = getRedirectUrl(shortCode);
            await updateShortLink(shortCode, { destinationUrl: destUrl, isActive: true });
            await updateQRCode(editId, {
              type: "dynamic",
              name: qrName,
              config: { ...config, data: redirectUrl },
              frameConfig,
              shortCode,
              destinationUrl: destUrl,
            });
          } else {
            const nextShortCode = await createShortLink(destUrl, editId);
            const redirectUrl = getRedirectUrl(nextShortCode);
            await updateQRCode(editId, {
              type: "dynamic",
              name: qrName,
              config: { ...config, data: redirectUrl },
              frameConfig,
              shortCode: nextShortCode,
              destinationUrl: destUrl,
            });
            setShortCode(nextShortCode);
          }
        } else {
          const nextShortCode = await createShortLink(destUrl, "");
          const redirectUrl = getRedirectUrl(nextShortCode);
          const dynamicConfig = { ...config, data: redirectUrl };
          const qrId = await saveQRCode({
            userId: user.uid, name: qrName, type: "dynamic",
            config: dynamicConfig, frameConfig, shortCode: nextShortCode, destinationUrl: destUrl,
            isActive: true, totalScans: 0, favorite: false, archived: false,
          });
          await updateShortLink(nextShortCode, { qrCodeId: qrId });
          setShortCode(nextShortCode);
        }
      } else {
        if (editId) {
          if (shortCode) {
            await updateShortLink(shortCode, { isActive: false });
          }
          await updateQRCode(editId, { type: "static", config, frameConfig, name: qrName });
        } else {
          await saveQRCode({
            userId: user.uid, name: qrName, type: "static",
            config, frameConfig, isActive: true, totalScans: 0,
            favorite: false, archived: false,
          });
        }
      }
      toast.success(editId ? "QR code updated!" : "QR code saved!");
      if (!editId) navigate("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save"));
    }
    setSaving(false);
  };

  const renderFramePreview = () => {
    if (frameConfig.type === "none") return <QRPreview config={config} />;

    const borderWidth = frameConfig.type === "bold" ? 4 : frameConfig.type === "premium" ? 3 : 2;
    const borderRadius = frameConfig.type === "rounded" || frameConfig.type === "social" || frameConfig.type === "premium" ? 16 : frameConfig.type === "minimal" ? 8 : 0;

    return (
      <div
        className="overflow-hidden"
        style={{
          backgroundColor: frameConfig.bgColor,
          border: `${borderWidth}px solid ${frameConfig.borderColor}`,
          borderRadius,
          padding: frameConfig.padding,
        }}
      >
        {frameConfig.textTop && (
          <p className="text-center mb-2 font-semibold" style={{ color: frameConfig.textColor, fontSize: frameConfig.fontSize }}>
            {frameConfig.textTop}
          </p>
        )}
        <QRPreview config={config} />
        {frameConfig.textBottom && (
          <p className="text-center mt-2 font-semibold" style={{ color: frameConfig.textColor, fontSize: frameConfig.fontSize }}>
            {frameConfig.textBottom}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container px-4 py-6">
      {/* Desktop layout */}
      <div className="hidden lg:grid lg:grid-cols-[300px_1fr_300px] gap-6 items-start">
        {/* Left Panel */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <ScrollArea className="h-[calc(100vh-6rem)]">
            <div className="space-y-6 pr-2">
              {/* QR Type Toggle */}
              <div className="panel-section">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">QR Type</Label>
                <div className="flex gap-2">
                  {(["static", "dynamic"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setQrType(t)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all",
                        qrType === t ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {t === "dynamic" && <Zap className="h-3 w-3 inline mr-1" />}
                      {t}
                    </button>
                  ))}
                </div>
                {qrType === "dynamic" && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs text-muted-foreground">Destination URL</Label>
                    <Input value={dynamicUrl} onChange={(e) => setDynamicUrl(e.target.value)} placeholder="https://final-destination.com" className="text-xs" />
                    <p className="text-[10px] text-muted-foreground">The QR will point to a redirect URL. You can change the destination later.</p>
                  </div>
                )}
              </div>

              <div className="panel-section">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" /> Data
                </h2>
                <DataInput config={config} onChange={handleChange} />
              </div>

              <div className="panel-section">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Style
                </h2>
                <StyleControls config={config} onChange={handleChange} />
              </div>
            </div>
          </ScrollArea>
        </motion.div>

        {/* Center Preview */}
        <motion.div className="flex flex-col items-center justify-center py-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <AnimatedQR animation={animation} onAnimationChange={setAnimation}>
            {renderFramePreview()}
          </AnimatedQR>

          {/* Save Section */}
          {isConfigured && user && (
            <div className="mt-6 w-full max-w-xs space-y-3">
              <Input value={qrName} onChange={(e) => setQrName(e.target.value)} placeholder="QR code name..." className="text-sm" />
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : editId ? "Update" : "Save QR Code"}
              </Button>
            </div>
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
                <PresetPanel config={config} onChange={handleFullChange} onPartialChange={handleChange} />
              </TabsContent>
              <TabsContent value="frame" className="panel-section">
                <QRFrameEditor frame={frameConfig} onChange={setFrameConfig} />
              </TabsContent>
              <TabsContent value="quality" className="panel-section">
                <ScanReliabilityPanel config={config} frame={frameConfig} />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </motion.div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden space-y-6">
        <div className="flex gap-2">
          {(["static", "dynamic"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setQrType(t)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all",
                qrType === t ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <AnimatedQR animation={animation} onAnimationChange={setAnimation}>
            <QRPreview config={config} />
          </AnimatedQR>
        </div>

        {isConfigured && user && (
          <div className="flex gap-2">
            <Input value={qrName} onChange={(e) => setQrName(e.target.value)} placeholder="QR name..." className="text-sm" />
            <Button onClick={handleSave} disabled={saving} size="sm"><Save className="h-4 w-4" /></Button>
          </div>
        )}

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="data" className="text-[10px]">Data</TabsTrigger>
            <TabsTrigger value="style" className="text-[10px]">Style</TabsTrigger>
            <TabsTrigger value="presets" className="text-[10px]">Presets</TabsTrigger>
            <TabsTrigger value="frame" className="text-[10px]">Frame</TabsTrigger>
            <TabsTrigger value="quality" className="text-[10px]">Quality</TabsTrigger>
          </TabsList>
          <TabsContent value="data" className="panel-section mt-3">
            {qrType === "dynamic" && (
              <div className="mb-4 space-y-2">
                <Label className="text-xs text-muted-foreground">Destination URL</Label>
                <Input value={dynamicUrl} onChange={(e) => setDynamicUrl(e.target.value)} placeholder="https://..." className="text-xs" />
              </div>
            )}
            <DataInput config={config} onChange={handleChange} />
          </TabsContent>
          <TabsContent value="style" className="panel-section mt-3">
            <StyleControls config={config} onChange={handleChange} />
          </TabsContent>
          <TabsContent value="presets" className="panel-section mt-3">
            <PresetPanel config={config} onChange={handleFullChange} onPartialChange={handleChange} />
          </TabsContent>
          <TabsContent value="frame" className="panel-section mt-3">
            <QRFrameEditor frame={frameConfig} onChange={setFrameConfig} />
          </TabsContent>
          <TabsContent value="quality" className="panel-section mt-3">
            <ScanReliabilityPanel config={config} frame={frameConfig} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
