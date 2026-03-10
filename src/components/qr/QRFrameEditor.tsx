import { FrameConfig } from '@/lib/types';
import { framePresets, frameSuggestions } from '@/lib/qr-frames';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface QRFrameEditorProps {
  frame: FrameConfig;
  onChange: (frame: FrameConfig) => void;
}

export function QRFrameEditor({ frame, onChange }: QRFrameEditorProps) {
  const update = (updates: Partial<FrameConfig>) => onChange({ ...frame, ...updates });

  return (
    <div className="space-y-4">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frame Style</Label>
      <div className="grid grid-cols-2 gap-1.5">
        {framePresets.map(preset => (
          <button
            key={preset.type}
            onClick={() => onChange({ ...frame, ...preset.config } as FrameConfig)}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-medium transition-all text-left",
              frame.type === preset.type
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <span className="block font-medium">{preset.name}</span>
            <span className="text-[10px] opacity-70">{preset.description}</span>
          </button>
        ))}
      </div>

      {frame.type !== 'none' && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Text Above</Label>
            <Input value={frame.textTop} onChange={e => update({ textTop: e.target.value })} placeholder="Optional top text" className="text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Text Below</Label>
            <Input value={frame.textBottom} onChange={e => update({ textBottom: e.target.value })} placeholder="Scan Me" className="text-sm" />
            <div className="flex flex-wrap gap-1">
              {frameSuggestions.slice(0, 6).map(s => (
                <Badge key={s} variant="outline" className="cursor-pointer text-[10px] hover:bg-accent" onClick={() => update({ textBottom: s })}>{s}</Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Frame BG</label>
              <input type="color" value={frame.bgColor} onChange={e => update({ bgColor: e.target.value })} className="h-8 w-full rounded border border-border cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Border</label>
              <input type="color" value={frame.borderColor} onChange={e => update({ borderColor: e.target.value })} className="h-8 w-full rounded border border-border cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Text</label>
              <input type="color" value={frame.textColor} onChange={e => update({ textColor: e.target.value })} className="h-8 w-full rounded border border-border cursor-pointer" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Padding: {frame.padding}px</Label>
            <Slider value={[frame.padding]} onValueChange={([v]) => update({ padding: v })} min={8} max={48} step={4} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Font Size: {frame.fontSize}px</Label>
            <Slider value={[frame.fontSize]} onValueChange={([v]) => update({ fontSize: v })} min={10} max={28} step={1} />
          </div>
        </>
      )}
    </div>
  );
}
