import { barcodePresets, applyBarcodePreset } from "@/lib/barcode-presets";
import { BarcodeConfig } from "@/lib/barcode-engine";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BarcodePresetPanelProps {
  config: BarcodeConfig;
  onChange: (config: BarcodeConfig) => void;
}

export function BarcodePresetPanel({ config, onChange }: BarcodePresetPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Barcode Presets
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {barcodePresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(applyBarcodePreset(config, preset))}
              className={cn(
                "group rounded-xl border p-3 text-left transition-all hover:border-primary/25 hover:bg-muted/50",
                "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    backgroundColor: preset.config.bgColor ?? "#FFFFFF",
                    borderColor: `${preset.config.color1 ?? "#111827"}33`,
                  }}
                >
                  <div className="flex items-end gap-[2px]">
                    {[10, 16, 22, 15, 20, 12, 18].map((height, index) => (
                      <span
                        key={index}
                        className="block rounded-sm"
                        style={{
                          width: 3,
                          height,
                          background:
                            preset.config.colorMode === "gradient"
                              ? `linear-gradient(180deg, ${preset.config.color1}, ${preset.config.color2})`
                              : preset.config.color1 ?? "#111827",
                        }}
                      />
                    ))}
                  </div>
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
                  {preset.config.format}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
