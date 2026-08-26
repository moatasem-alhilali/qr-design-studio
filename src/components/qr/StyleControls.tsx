import { QRConfig, ModuleStyle, CornerStyle, ColorMode } from "@/lib/qr-engine";
import { Tool } from "@/components/workshop/Tool";
import { Dial } from "@/components/workshop/Dial";
import { InkWell } from "@/components/workshop/InkWell";
import { CornerGlyph, ModuleGlyph } from "@/components/qr/glyphs";
import { useI18n } from "@/shared/i18n/i18n";

const moduleStyles: ModuleStyle[] = [
  "square",
  "rounded",
  "dots",
  "diamond",
  "extra-rounded",
  "tiny-squares",
  "heart",
  "star",
  "triangle",
  "bubble",
];

const cornerStyles: CornerStyle[] = [
  "square",
  "rounded",
  "circle",
  "thick",
  "minimal",
  "decorative",
  "ring",
  "leaf",
  "frame-dots",
];

interface StyleControlsProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
}

export function StyleControls({ config, onChange }: StyleControlsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Module face — a specimen sheet of the actual geometry. */}
      <div className="space-y-2">
        <p className="spec">{t.qrControls.moduleShape}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {moduleStyles.map((value) => (
            <Tool key={value} on={config.moduleStyle === value} onClick={() => onChange({ moduleStyle: value })}>
              <ModuleGlyph style={value} />
              {t.values.moduleStyles[value]}
            </Tool>
          ))}
        </div>
      </div>

      {/* Finder pattern face. */}
      <div className="space-y-2">
        <p className="spec">{t.qrControls.cornerStyle}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {cornerStyles.map((value) => (
            <Tool key={value} on={config.cornerStyle === value} onClick={() => onChange({ cornerStyle: value })}>
              <CornerGlyph style={value} />
              {t.values.cornerStyles[value]}
            </Tool>
          ))}
        </div>
      </div>

      {/* The ink tray. */}
      <div className="space-y-3">
        <p className="spec">{t.home.inkTray}</p>

        <div className="grid grid-cols-2 gap-1.5">
          {(["single", "gradient"] as ColorMode[]).map((mode) => (
            <Tool key={mode} wide on={config.colorMode === mode} onClick={() => onChange({ colorMode: mode })}>
              {t.values.colorModes[mode]}
            </Tool>
          ))}
        </div>

        <div className="sheet-sunk flex flex-wrap items-start justify-center gap-x-5 gap-y-3 p-3">
          <InkWell
            value={config.color1}
            onChange={(hex) => onChange({ color1: hex })}
            label={t.qrControls.color1}
          />
          {config.colorMode === "gradient" && (
            <InkWell
              value={config.color2}
              onChange={(hex) => onChange({ color2: hex })}
              label={t.qrControls.color2}
            />
          )}
          <InkWell
            value={config.bgColor}
            onChange={(hex) => onChange({ bgColor: hex })}
            label={t.qrControls.background}
            empty={config.transparentBg}
          />
        </div>

        <Tool
          wide
          on={config.transparentBg}
          onClick={() => onChange({ transparentBg: !config.transparentBg })}
          className="w-full"
        >
          {t.qrControls.transparent}
        </Tool>
      </div>

      {/* Machined dials: the two continuous settings on the press. */}
      <div className="flex flex-wrap items-start justify-center gap-6 pt-1">
        <Dial
          value={config.size}
          min={200}
          max={1200}
          step={50}
          onChange={(size) => onChange({ size })}
          label={t.qrControls.size}
          unit="px"
        />
        {config.colorMode === "gradient" && (
          <Dial
            value={config.gradientAngle}
            min={0}
            max={360}
            step={15}
            onChange={(gradientAngle) => onChange({ gradientAngle })}
            label={t.qrControls.gradientAngle}
            unit="°"
          />
        )}
      </div>

      {/* Error correction: how much of the plate can be damaged and still read. */}
      <div className="space-y-2">
        <p className="spec">{t.qrControls.errorCorrection}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {(["L", "M", "Q", "H"] as const).map((level) => (
            <Tool
              key={level}
              on={config.errorCorrection === level}
              onClick={() => onChange({ errorCorrection: level })}
              disabled={Boolean(config.logoUrl)}
              title={config.logoUrl ? "H" : undefined}
              className="font-mono text-sm font-bold"
            >
              {level}
            </Tool>
          ))}
        </div>
        {config.logoUrl && (
          <p className="text-[11px] leading-snug text-ink-faint">{t.qrControls.errorCorrectionLocked}</p>
        )}
      </div>
    </div>
  );
}
