import { QRConfig } from "@/lib/qr-engine";
import { presets, applyPreset } from "@/lib/qr-presets";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Upload, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface PresetPanelProps {
  config: QRConfig;
  onChange: (config: QRConfig) => void;
  onPartialChange: (updates: Partial<QRConfig>) => void;
}

export function PresetPanel({ config, onChange, onPartialChange }: PresetPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onPartialChange({ logoUrl: reader.result as string, errorCorrection: "H" });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Style Presets */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Style Presets
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(applyPreset(config, preset))}
              className={cn(
                "group rounded-xl border p-3 text-left transition-all hover:border-primary/25 hover:bg-muted/50",
                "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    backgroundColor: preset.config.bgColor ?? "#FFFFFF",
                    borderColor: `${preset.config.color1}33`,
                  }}
                >
                  <div
                    className="h-5 w-5 rounded"
                    style={{
                      background:
                        preset.config.colorMode === "gradient"
                          ? `linear-gradient(135deg, ${preset.config.color1}, ${preset.config.color2})`
                          : preset.config.color1,
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{preset.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{preset.description}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.config.color1 }} />
                {preset.config.colorMode === "gradient" && preset.config.color2 && (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.config.color2 }} />
                )}
                <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {preset.config.moduleStyle}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Center Logo
        </Label>
        
        {config.logoUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <img
              src={config.logoUrl}
              alt="Logo"
              className="h-10 w-10 rounded object-contain"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">Logo uploaded</p>
              <p className="text-xs text-muted-foreground">Scale: {Math.round(config.logoScale * 100)}%</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPartialChange({ logoUrl: null })}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground hover:border-primary hover:text-foreground transition-all"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Upload logo image</span>
          </button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />

        {config.logoUrl && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Logo Scale: {Math.round(config.logoScale * 100)}%
            </label>
            <div>
              <input
                type="range"
                min={10}
                max={40}
                value={config.logoScale * 100}
                onChange={(e) => onPartialChange({ logoScale: Number(e.target.value) / 100 })}
                className="w-full accent-primary"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
