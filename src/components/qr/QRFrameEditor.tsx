import { FrameConfig } from '@/lib/types';
import { framePresets, frameSuggestions, frameTopSuggestions, frameBadgeSuggestions } from '@/lib/qr-frames';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  localizeFrameConfig,
  translateFramePreset,
  translateFrameSuggestion,
  useI18n,
} from '@/shared/i18n/i18n';

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
  const { locale, t } = useI18n();
  const update = (updates: Partial<FrameConfig>) => onChange({ ...frame, ...updates });

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.frameEditor.frameStyle}</Label>
        <div className="grid grid-cols-2 gap-2">
          {framePresets.map((preset) => {
            const translatedPreset = translateFramePreset(locale, preset.type, preset.name, preset.description);
            const localizedConfig = localizeFrameConfig(locale, preset.config);

            return (
              <button
                key={preset.type}
                onClick={() => onChange({ ...frame, ...localizedConfig } as FrameConfig)}
                className={cn(
                  "rounded-xl border p-3 text-start transition-all",
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
                    {translateFrameSuggestion(locale, preset.config.badgeText)}
                  </span>
                )}
              </div>
              <span className="block text-sm font-semibold">{translatedPreset.name}</span>
              <span className="mt-1 block text-[11px] opacity-75">{translatedPreset.description}</span>
            </button>
            );
          })}
        </div>
      </div>

      {frame.type !== 'none' && (
        <>
          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{t.frameEditor.messaging}</h3>
              <p className="text-xs text-muted-foreground">{t.frameEditor.messagingDescription}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t.frameEditor.badgeLabel}</Label>
              <Input value={frame.badgeText} onChange={e => update({ badgeText: e.target.value })} placeholder={t.frameEditor.badgePlaceholder} className="text-sm" />
              <div className="flex flex-wrap gap-1.5">
                {frameBadgeSuggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer text-[10px] hover:bg-accent"
                    onClick={() => update({ badgeText: translateFrameSuggestion(locale, suggestion) })}
                  >
                    {translateFrameSuggestion(locale, suggestion)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t.frameEditor.textAbove}</Label>
              <Input value={frame.textTop} onChange={e => update({ textTop: e.target.value })} placeholder={t.frameEditor.textAbovePlaceholder} className="text-sm" />
              <div className="flex flex-wrap gap-1.5">
                {frameTopSuggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer text-[10px] hover:bg-accent"
                    onClick={() => update({ textTop: translateFrameSuggestion(locale, suggestion) })}
                  >
                    {translateFrameSuggestion(locale, suggestion)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t.frameEditor.textBelow}</Label>
              <Input value={frame.textBottom} onChange={e => update({ textBottom: e.target.value })} placeholder={t.frameEditor.textBelowPlaceholder} className="text-sm" />
              <div className="flex flex-wrap gap-1.5">
                {frameSuggestions.slice(0, 8).map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer text-[10px] hover:bg-accent"
                    onClick={() => update({ textBottom: translateFrameSuggestion(locale, suggestion) })}
                  >
                    {translateFrameSuggestion(locale, suggestion)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{t.frameEditor.colorSystem}</h3>
              <p className="text-xs text-muted-foreground">{t.frameEditor.colorSystemDescription}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ColorField label={t.frameEditor.frameBackground} value={frame.bgColor} onChange={(value) => update({ bgColor: value })} />
              <ColorField label={t.frameEditor.frameBorder} value={frame.borderColor} onChange={(value) => update({ borderColor: value })} />
              <ColorField label={t.frameEditor.textColor} value={frame.textColor} onChange={(value) => update({ textColor: value })} />
              <ColorField label={t.frameEditor.accentColor} value={frame.accentColor} onChange={(value) => update({ accentColor: value })} />
              <ColorField label={t.frameEditor.badgeBackground} value={frame.badgeColor} onChange={(value) => update({ badgeColor: value })} />
              <ColorField label={t.frameEditor.badgeText} value={frame.badgeTextColor} onChange={(value) => update({ badgeTextColor: value })} />
              <ColorField label={t.frameEditor.qrPanelBackground} value={frame.qrBackgroundColor} onChange={(value) => update({ qrBackgroundColor: value })} />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{t.frameEditor.shapeDepth}</h3>
              <p className="text-xs text-muted-foreground">{t.frameEditor.shapeDepthDescription}</p>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">{t.frameEditor.outerPadding}: {frame.padding}px</Label>
              <Slider value={[frame.padding]} onValueChange={([value]) => update({ padding: value })} min={10} max={40} step={2} />
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">{t.frameEditor.fontSize}: {frame.fontSize}px</Label>
              <Slider value={[frame.fontSize]} onValueChange={([value]) => update({ fontSize: value })} min={12} max={26} step={1} />
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">{t.frameEditor.borderWidth}: {frame.borderWidth}px</Label>
              <Slider value={[frame.borderWidth]} onValueChange={([value]) => update({ borderWidth: value })} min={0} max={8} step={1} />
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">{t.frameEditor.cornerRadius}: {frame.cornerRadius}px</Label>
              <Slider value={[frame.cornerRadius]} onValueChange={([value]) => update({ cornerRadius: value })} min={8} max={40} step={2} />
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">{t.frameEditor.shadowDepth}: {frame.shadow}px</Label>
              <Slider value={[frame.shadow]} onValueChange={([value]) => update({ shadow: value })} min={0} max={36} step={2} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
