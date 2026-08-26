import { useRef } from "react";
import { Trash2, Upload } from "lucide-react";

import { QRConfig } from "@/lib/qr-engine";
import { presets, applyPreset } from "@/lib/qr-presets";
import { Dial } from "@/components/workshop/Dial";
import { translateQRPreset, useI18n } from "@/shared/i18n/i18n";

interface PresetPanelProps {
  config: QRConfig;
  onChange: (config: QRConfig) => void;
  onPartialChange: (updates: Partial<QRConfig>) => void;
}

export function PresetPanel({ config, onChange, onPartialChange }: PresetPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { locale, t } = useI18n();

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
      {/*
        Standing ink mixes, kept as swatch chips on the shelf. Each one shows
        the actual ink it lays down rather than an abstract icon.
      */}
      <div className="space-y-2">
        <p className="spec">{t.qrControls.stylePresets}</p>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => {
            const translated = translateQRPreset(locale, preset.name, preset.description);
            const swatch =
              preset.config.colorMode === "gradient"
                ? `linear-gradient(135deg, ${preset.config.color1}, ${preset.config.color2})`
                : preset.config.color1 ?? "#000";

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange(applyPreset(config, preset))}
                title={translated.description}
                className="group flex items-stretch gap-0 overflow-hidden rounded-[3px] text-start transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
                style={{
                  background: "linear-gradient(180deg, hsl(var(--paper)), hsl(var(--paper-sunk)))",
                  boxShadow:
                    "0 1px 0 hsl(var(--lit) / 0.7) inset, 0 1px 2px hsl(var(--cast) / 0.24), 0 4px 10px -4px hsl(var(--cast) / 0.34)",
                }}
              >
                {/* Ink stripe down the edge of the chip */}
                <span className="w-2.5 shrink-0" style={{ background: swatch }} aria-hidden />
                <span className="min-w-0 flex-1 px-2.5 py-2">
                  <span className="block truncate text-[0.78rem] font-semibold text-ink">{translated.name}</span>
                  <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-faint">
                    {preset.config.moduleStyle ? t.values.moduleStyles[preset.config.moduleStyle] : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* The logo plate that gets dropped into the middle of the form. */}
      <div className="space-y-3">
        <p className="spec">{t.qrControls.centerLogo}</p>

        {config.logoUrl ? (
          <div className="sheet-sunk flex items-center gap-3 p-3">
            <img
              src={config.logoUrl}
              alt={t.qrControls.logoAlt}
              className="h-11 w-11 shrink-0 bg-paper object-contain p-1"
              style={{ boxShadow: "0 1px 3px hsl(var(--cast) / 0.4)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8rem] font-medium text-ink">{t.qrControls.logoUploaded}</p>
              <p className="font-mono text-[10px] text-ink-faint">
                {t.qrControls.scale}: {Math.round(config.logoScale * 100)}%
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPartialChange({ logoUrl: null })}
              aria-label={t.qrControls.logoAlt}
              className="tool shrink-0 px-2.5 py-2"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-[3px] px-4 py-6 text-ink-mid transition-colors hover:text-ink"
            style={{
              background: "hsl(var(--paper-sunk))",
              boxShadow:
                "0 2px 4px hsl(var(--cast) / 0.24) inset, 0 0 0 2px hsl(var(--ink) / 0.12) inset",
            }}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">{t.qrControls.uploadLogo}</span>
          </button>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

        {config.logoUrl && (
          <div className="flex justify-center pt-1">
            <Dial
              value={Math.round(config.logoScale * 100)}
              min={10}
              max={40}
              step={1}
              onChange={(percent) => onPartialChange({ logoScale: percent / 100 })}
              label={t.qrControls.logoScale}
              unit="%"
              size={84}
            />
          </div>
        )}
      </div>
    </div>
  );
}
