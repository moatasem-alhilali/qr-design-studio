import { QRConfig, ModuleStyle, CornerStyle, ColorMode } from "@/lib/qr-engine";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Square, Circle, Diamond, Hexagon, RectangleHorizontal } from "lucide-react";

const moduleStyles: { value: ModuleStyle; label: string; icon: React.ElementType }[] = [
  { value: "square", label: "Square", icon: Square },
  { value: "rounded", label: "Rounded", icon: RectangleHorizontal },
  { value: "dots", label: "Dots", icon: Circle },
  { value: "diamond", label: "Diamond", icon: Diamond },
  { value: "extra-rounded", label: "Pill", icon: Hexagon },
];

const cornerStyles: { value: CornerStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "thick", label: "Thick" },
  { value: "minimal", label: "Minimal" },
  { value: "decorative", label: "Decorative" },
];

interface StyleControlsProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
}

export function StyleControls({ config, onChange }: StyleControlsProps) {
  return (
    <div className="space-y-6">
      {/* Module Style */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Module Shape
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {moduleStyles.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange({ moduleStyle: value })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all",
                config.moduleStyle === value
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

      {/* Corner Style */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Corner Style
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {cornerStyles.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ cornerStyle: value })}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                config.cornerStyle === value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Color Mode
        </Label>
        <div className="flex gap-2">
          {(["single", "gradient"] as ColorMode[]).map((mode) => (
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
              {mode}
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <div className="space-y-1 flex-1">
            <label className="text-xs text-muted-foreground">Color 1</label>
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
              <label className="text-xs text-muted-foreground">Color 2</label>
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
          <label className="text-xs text-muted-foreground">Background</label>
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
              Transparent
            </button>
          </div>
        </div>

        {config.colorMode === "gradient" && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Gradient Angle: {config.gradientAngle}°
            </label>
            <Slider
              value={[config.gradientAngle]}
              onValueChange={([v]) => onChange({ gradientAngle: v })}
              min={0}
              max={360}
              step={15}
            />
          </div>
        )}
      </div>

      {/* Size */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Size: {config.size}px
        </Label>
        <Slider
          value={[config.size]}
          onValueChange={([v]) => onChange({ size: v })}
          min={200}
          max={1200}
          step={50}
        />
      </div>

      {/* Error Correction */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Error Correction
        </Label>
        <div className="grid grid-cols-4 gap-1.5">
          {(["L", "M", "Q", "H"] as const).map((level) => (
            <button
              key={level}
              onClick={() => onChange({ errorCorrection: level })}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-mono font-semibold transition-all",
                config.errorCorrection === level
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
