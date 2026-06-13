import { BarcodeConfig, BarcodeDataType, BarcodeFormat, getBarcodePlaceholder, getSuggestedBarcodeFormat } from "@/lib/barcode-engine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Mail, Phone, Package2, Type, Barcode, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBarcodeFormatHint, useI18n } from "@/shared/i18n/i18n";

const dataTypes: { value: BarcodeDataType; icon: React.ElementType }[] = [
  { value: "product", icon: Package2 },
  { value: "text", icon: Type },
  { value: "url", icon: Link },
  { value: "email", icon: Mail },
  { value: "phone", icon: Phone },
];

const formats: { value: BarcodeFormat; label: string; compact?: string }[] = [
  { value: "CODE128", label: "Code 128" },
  { value: "CODE39", label: "Code 39" },
  { value: "CODE93", label: "Code 93" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "UPC", label: "UPC" },
  { value: "ITF14", label: "ITF-14" },
  { value: "ITF", label: "ITF" },
  { value: "codabar", label: "Codabar" },
];

interface BarcodeDataInputProps {
  config: BarcodeConfig;
  onChange: (updates: Partial<BarcodeConfig>) => void;
}

export function BarcodeDataInput({ config, onChange }: BarcodeDataInputProps) {
  const { locale, t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.contentType}
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {dataTypes.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange({
                dataType: value,
                format: getSuggestedBarcodeFormat(value),
                value: getBarcodePlaceholder(value),
              })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all",
                config.dataType === value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.values.barcodeDataTypes[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.barcodeFormat}
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {formats.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ format: value })}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                config.format === value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {getBarcodeFormatHint(locale, config.format)}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.encodedValue}
        </Label>
        <div className="relative">
          <Barcode className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={config.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder={getBarcodePlaceholder(config.dataType)}
            className="ps-10 font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.barcodeControls.displayText}
        </Label>
        <div className="relative">
          <Rows3 className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={config.customText}
            onChange={(e) => onChange({ customText: e.target.value })}
            placeholder={t.barcodeControls.displayTextPlaceholder}
            className="ps-10 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
