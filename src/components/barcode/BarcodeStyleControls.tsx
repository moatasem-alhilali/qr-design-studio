import { BarcodeConfig, BarcodeShape } from "@/lib/barcode-engine";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { RectangleHorizontal, Pill, Columns2, Type, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { useI18n } from "@/shared/i18n/i18n";

const shapes: { value: BarcodeShape; icon: React.ElementType }[] = [
  { value: "square", icon: Columns2 },
  { value: "rounded", icon: RectangleHorizontal },
  { value: "pill", icon: Pill },
];

interface BarcodeStyleControlsProps {
  config: BarcodeConfig;
  onChange: (updates: Partial<BarcodeConfig>) => void;
}

export function BarcodeStyleControls({ config, onChange }: BarcodeStyleControlsProps) {
  const { t } = useI18n();
  const fontStyleLabel =
    config.fontWeight === "bold" && config.fontStyle === "italic"
      ? "bold-italic"
      : config.fontWeight === "bold"
        ? "bold"
        : config.fontStyle === "italic"
          ? "italic"
          : "regular";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.barShape}
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {shapes.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange({ barShape: value })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all",
                config.barShape === value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.values.shapes[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.colorMode}
        </Label>
        <div className="flex gap-2">
          {(["single", "gradient"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onChange({ colorMode: mode })}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all",
                config.colorMode === mode
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {t.values.colorModes[mode]}
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <div className="space-y-1 flex-1">
            <label className="text-xs text-muted-foreground">{t.barcodeControls.barColor}</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={config.color1}
                onChange={(e) => onChange({ color1: e.target.value })}
                className="h-8 w-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs font-mono text-muted-foreground">{config.color1}</span>
            </div>
          </div>
          {config.colorMode === "gradient" && (
            <div className="space-y-1 flex-1">
              <label className="text-xs text-muted-foreground">{t.barcodeControls.accentColor}</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={config.color2}
                  onChange={(e) => onChange({ color2: e.target.value })}
                  className="h-8 w-8 rounded border border-border cursor-pointer"
                />
                <span className="text-xs font-mono text-muted-foreground">{config.color2}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t.barcodeControls.background}</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={config.bgColor}
              onChange={(e) => onChange({ bgColor: e.target.value })}
              className="h-8 w-8 rounded border border-border cursor-pointer"
              disabled={config.transparentBg}
            />
            <button
              onClick={() => onChange({ transparentBg: !config.transparentBg })}
              className={cn(
                "text-xs px-2 py-1 rounded border transition-all",
                config.transparentBg
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {t.barcodeControls.transparent}
            </button>
          </div>
        </div>

        {config.colorMode === "gradient" && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              {t.barcodeControls.gradientAngle}: {config.gradientAngle}°
            </label>
            <Slider
              value={[config.gradientAngle]}
              onValueChange={([value]) => onChange({ gradientAngle: value })}
              min={0}
              max={360}
              step={15}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.barWidth}: {config.barWidth}px
        </Label>
        <Slider
          value={[config.barWidth]}
          onValueChange={([value]) => onChange({ barWidth: value })}
          min={1}
          max={6}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.height}: {config.height}px
        </Label>
        <Slider
          value={[config.height]}
          onValueChange={([value]) => onChange({ height: value })}
          min={60}
          max={220}
          step={4}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.quietZone}: {config.margin}px
        </Label>
        <Slider
          value={[config.margin]}
          onValueChange={([value]) => onChange({ margin: value })}
          min={4}
          max={40}
          step={2}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.humanReadableText}
        </Label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ showText: !config.showText })}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
              config.showText
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {config.showText ? t.barcodeControls.visible : t.barcodeControls.hidden}
          </button>
          <button
            onClick={() => onChange({ flat: !config.flat })}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
              config.flat
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {t.barcodeControls.flatGuards}
          </button>
        </div>

        {config.showText && (
          <>
            <div className="flex gap-2">
              {(["top", "bottom"] as const).map((position) => (
                <button
                  key={position}
                  onClick={() => onChange({ textPosition: position })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all",
                    config.textPosition === position
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t.values.textPositions[position]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: "left", icon: AlignLeft },
                { value: "center", icon: AlignCenter },
                { value: "right", icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onChange({ textAlign: value as BarcodeConfig["textAlign"] })}
                  className={cn(
                    "flex items-center justify-center rounded-lg border p-2 transition-all",
                    config.textAlign === value
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.barcodeControls.fontSize}: {config.fontSize}px
              </Label>
              <Slider
                value={[config.fontSize]}
                onValueChange={([value]) => onChange({ fontSize: value })}
                min={12}
                max={32}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.barcodeControls.textGap}: {config.textMargin}px
              </Label>
              <Slider
                value={[config.textMargin]}
                onValueChange={([value]) => onChange({ textMargin: value })}
                min={0}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.barcodeControls.textStyle}
              </Label>
              <div className="flex gap-2">
                <button
                  onClick={() => onChange({ fontWeight: config.fontWeight === "bold" ? "normal" : "bold" })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    config.fontWeight === "bold"
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t.barcodeControls.bold}
                </button>
                <button
                  onClick={() => onChange({ fontStyle: config.fontStyle === "italic" ? "normal" : "italic" })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    config.fontStyle === "italic"
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t.barcodeControls.italic}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Type className="h-3 w-3" />
                {t.barcodeControls.current}: {t.values.fontStyles[fontStyleLabel]}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
