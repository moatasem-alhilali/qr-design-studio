import { FrameConfig } from '@/lib/types';
import { framePresets, frameSuggestions, frameTopSuggestions, frameBadgeSuggestions } from '@/lib/qr-frames';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface QRFrameEditorProps {
  frame: FrameConfig;
  onChange: (frame: FrameConfig) => void;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border"
        />
        <span className="truncate font-mono text-[11px] text-foreground">{value}</span>
      </div>
    </div>
  );
}

export function QRFrameEditor({ frame, onChange }: QRFrameEditorProps) {
  const update = (updates: Partial<FrameConfig>) => onChange({ ...frame, ...updates });

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frame Style</Label>
        <div className="grid grid-cols-2 gap-2">
          {framePresets.map((preset) => (
            <button
              key={preset.type}
              onClick={() => onChange({ ...frame, ...preset.config } as FrameConfig)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                frame.type === preset.type
                  ? "border-primary bg-accent text-accent-foreground shadow-sm"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div
                  className="h-9 w-9 rounded-lg border"
                  style={{
                    backgroundColor: preset.config.bgColor,
                    borderColor: preset.config.borderColor,
                    boxShadow: preset.config.shadow
                      ? `0 10px 22px -14px ${preset.config.accentColor ?? preset.config.borderColor}`
                      : 'none',
                  }}
                >
                  <div
                    className="mx-auto mt-1.5 h-1 w-5 rounded-full"
                    style={{ backgroundColor: preset.config.accentColor }}
                  />
                </div>
                {preset.config.badgeText && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: preset.config.badgeColor,
                      color: preset.config.badgeTextColor,
                    }}
                  >
                    {preset.config.badgeText}
                  </span>
                )}
              </div>
              <span className="block text-sm font-semibold">{preset.name}</span>
              <span className="mt-1 block text-[11px] opacity-75">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      {frame.type !== 'none' && (
        <>
          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Messaging</h3>
              <p className="text-xs text-muted-foreground">Add a badge, headline, and CTA to make the frame feel like a real campaign card.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Badge Label</Label>
              <Input value={frame.badgeText} onChange={e => update({ badgeText: e.target.value })} placeholder="Quick Access" className="text-sm" />
              <div className="flex flex-wrap gap-1.5">
                {frameBadgeSuggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer text-[10px] hover:bg-accent"
                    onClick={() => update({ badgeText: suggestion })}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Text Above</Label>
              <Input value={frame.textTop} onChange={e => update({ textTop: e.target.value })} placeholder="Optional top text" className="text-sm" />
              <div className="flex flex-wrap gap-1.5">
                {frameTopSuggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer text-[10px] hover:bg-accent"
                    onClick={() => update({ textTop: suggestion })}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Text Below</Label>
              <Input value={frame.textBottom} onChange={e => update({ textBottom: e.target.value })} placeholder="Scan Me" className="text-sm" />
              <div className="flex flex-wrap gap-1.5">
                {frameSuggestions.slice(0, 8).map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer text-[10px] hover:bg-accent"
                    onClick={() => update({ textBottom: suggestion })}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Color System</h3>
              <p className="text-xs text-muted-foreground">Build a more premium card using accent color, badge styling, and a dedicated QR panel background.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ColorField label="Frame Background" value={frame.bgColor} onChange={(value) => update({ bgColor: value })} />
              <ColorField label="Frame Border" value={frame.borderColor} onChange={(value) => update({ borderColor: value })} />
              <ColorField label="Text Color" value={frame.textColor} onChange={(value) => update({ textColor: value })} />
              <ColorField label="Accent Color" value={frame.accentColor} onChange={(value) => update({ accentColor: value })} />
              <ColorField label="Badge Background" value={frame.badgeColor} onChange={(value) => update({ badgeColor: value })} />
              <ColorField label="Badge Text" value={frame.badgeTextColor} onChange={(value) => update({ badgeTextColor: value })} />
              <ColorField label="QR Panel Background" value={frame.qrBackgroundColor} onChange={(value) => update({ qrBackgroundColor: value })} />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Shape and Depth</h3>
              <p className="text-xs text-muted-foreground">Tune spacing, radius, border, and shadow to make the frame feel softer, sharper, or more premium.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Outer Padding: {frame.padding}px</Label>
              <Slider value={[frame.padding]} onValueChange={([value]) => update({ padding: value })} min={10} max={40} step={2} />
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Font Size: {frame.fontSize}px</Label>
              <Slider value={[frame.fontSize]} onValueChange={([value]) => update({ fontSize: value })} min={12} max={26} step={1} />
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Border Width: {frame.borderWidth}px</Label>
              <Slider value={[frame.borderWidth]} onValueChange={([value]) => update({ borderWidth: value })} min={0} max={8} step={1} />
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Corner Radius: {frame.cornerRadius}px</Label>
              <Slider value={[frame.cornerRadius]} onValueChange={([value]) => update({ cornerRadius: value })} min={8} max={40} step={2} />
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Shadow Depth: {frame.shadow}px</Label>
              <Slider value={[frame.shadow]} onValueChange={([value]) => update({ shadow: value })} min={0} max={36} step={2} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
