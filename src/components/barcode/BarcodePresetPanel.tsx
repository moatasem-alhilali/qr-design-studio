import { barcodePresets, applyBarcodePreset } from "@/lib/barcode-presets";
import { BarcodeConfig } from "@/lib/barcode-engine";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { translateBarcodePreset, useI18n } from "@/shared/i18n/i18n";

interface BarcodePresetPanelProps {
  config: BarcodeConfig;
  onChange: (config: BarcodeConfig) => void;
}

export function BarcodePresetPanel({ config, onChange }: BarcodePresetPanelProps) {
  const { locale, t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.barcodePresets}
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {barcodePresets.map((preset) => {
            const translatedPreset = translateBarcodePreset(locale, preset.name, preset.description);

            return (
              <button
                key={preset.name}
                onClick={() => onChange(applyBarcodePreset(config, preset))}
                className={cn(
                  "group rounded-xl border p-3 text-start transition-all hover:border-primary/25 hover:bg-muted/50",
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
                  <p className="truncate text-sm font-medium text-foreground">{translatedPreset.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{translatedPreset.description}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.config.color1 }} />
                {preset.config.colorMode === "gradient" && preset.config.color2 && (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.config.color2 }} />
                )}
                <span className="ms-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {preset.config.format}
                </span>
              </div>
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
