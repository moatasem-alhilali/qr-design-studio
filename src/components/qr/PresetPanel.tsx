import { useRef } from "react";
import { Trash2, Upload } from "lucide-react";

import { QRConfig, type LogoPlateShape, type LogoShape } from "@/lib/qr-engine";
import { presets, applyPreset } from "@/lib/qr-presets";
import { Dial } from "@/components/workshop/Dial";
import { InkWell } from "@/components/workshop/InkWell";
import { Tool } from "@/components/workshop/Tool";
import { LogoShapeGlyph, PlateShapeGlyph } from "@/components/qr/glyphs";
import { trackProductEvent, trackSettledChoice } from "@/features/analytics/services/product-events";
import { translateQRPreset, useI18n } from "@/shared/i18n/i18n";

const logoShapes: LogoShape[] = ["original", "square", "rounded", "circle"];
const plateShapes: LogoPlateShape[] = ["square", "rounded", "circle"];

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
      // Size and type only — the image itself never leaves the browser.
      trackProductEvent("logo_uploaded", {
        fileType: file.type || "unknown",
        fileKb: Math.round(file.size / 1024),
      });
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
                onClick={() => {
                  onChange(applyPreset(config, preset));
                  trackSettledChoice("preset_applied", { preset: preset.name });
                }}
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
      </div>

      {/*
        The finishing bench for the logo. Uploading artwork is only half the
        job: a hard-edged rectangle dropped into a rounded code looks pasted on,
        so the cut, the plate behind it and its outline are all adjustable here.
      */}
      {config.logoUrl && (
        <>
          <div className="space-y-2">
            <p className="spec">{t.qrControls.logoShape}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {logoShapes.map((value) => (
                <Tool
                  key={value}
                  on={(config.logoShape ?? "original") === value}
                  onClick={() => {
                    onPartialChange({ logoShape: value });
                    trackSettledChoice("logo_styled", { shape: value });
                  }}
                >
                  <LogoShapeGlyph shape={value} />
                  {t.values.logoShapes[value]}
                </Tool>
              ))}
            </div>
            <p className="text-[11px] leading-snug text-ink-faint">{t.qrControls.logoShapeHint}</p>
          </div>

          <div className="space-y-3">
            <p className="spec">{t.qrControls.logoPlate}</p>

            <Tool
              wide
              on={config.logoPlate ?? true}
              onClick={() => onPartialChange({ logoPlate: !(config.logoPlate ?? true) })}
              className="w-full"
            >
              {(config.logoPlate ?? true) ? t.qrControls.logoPlateOn : t.qrControls.logoPlateOff}
            </Tool>

            <div className="grid grid-cols-3 gap-1.5">
              {plateShapes.map((value) => (
                <Tool
                  key={value}
                  on={(config.logoPlateShape ?? "rounded") === value}
                  onClick={() => onPartialChange({ logoPlateShape: value })}
                >
                  <PlateShapeGlyph shape={value} />
                  {t.values.logoPlateShapes[value]}
                </Tool>
              ))}
            </div>

            <div className="sheet-sunk flex flex-wrap items-start justify-center gap-x-5 gap-y-3 p-3">
              <InkWell
                value={config.logoPlateColor ?? config.bgColor}
                onChange={(hex) => onPartialChange({ logoPlateColor: hex })}
                label={t.qrControls.logoPlateColor}
                empty={config.logoPlateColor === null}
              />
              <InkWell
                value={config.logoBorderColor}
                onChange={(hex) => onPartialChange({ logoBorderColor: hex })}
                label={t.qrControls.logoBorderColor}
              />
            </div>

            <Tool
              wide
              on={config.logoPlateColor === null}
              onClick={() =>
                onPartialChange({ logoPlateColor: config.logoPlateColor === null ? config.bgColor : null })
              }
              className="w-full"
            >
              {t.qrControls.logoPlateMatchSheet}
            </Tool>
          </div>

          <div className="flex flex-wrap items-start justify-center gap-5 pt-1">
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
            {((config.logoShape ?? "original") === "rounded" ||
              (config.logoPlateShape ?? "rounded") === "rounded") && (
              <Dial
                value={config.logoRadius ?? 15}
                min={0}
                max={50}
                step={1}
                onChange={(logoRadius) => onPartialChange({ logoRadius })}
                label={t.qrControls.logoRadius}
                unit="%"
                size={84}
              />
            )}
            <Dial
              value={config.logoPadding ?? 15}
              min={0}
              max={40}
              step={1}
              onChange={(logoPadding) => onPartialChange({ logoPadding })}
              label={t.qrControls.logoPadding}
              unit="%"
              size={84}
            />
            <Dial
              value={config.logoBorderWidth ?? 0}
              min={0}
              max={12}
              step={1}
              onChange={(logoBorderWidth) => onPartialChange({ logoBorderWidth })}
              label={t.qrControls.logoBorder}
              unit="%"
              size={84}
            />
          </div>
        </>
      )}
    </div>
  );
}
