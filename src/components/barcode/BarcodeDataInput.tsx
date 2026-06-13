import { BarcodeConfig, BarcodeDataType, BarcodeFormat, barcodeFormatHints, getBarcodePlaceholder, getSuggestedBarcodeFormat } from "@/lib/barcode-engine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Mail, Phone, Package2, Type, Barcode, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";

const dataTypes: { value: BarcodeDataType; label: string; icon: React.ElementType }[] = [
  { value: "product", label: "Product", icon: Package2 },
  { value: "text", label: "Text", icon: Type },
  { value: "url", label: "URL", icon: Link },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
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
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content Type
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {dataTypes.map(({ value, label, icon: Icon }) => (
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
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Barcode Format
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
          {barcodeFormatHints[config.format]}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Encoded Value
        </Label>
        <div className="relative">
          <Barcode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={config.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder={getBarcodePlaceholder(config.dataType)}
            className="pl-10 font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Display Text
        </Label>
        <div className="relative">
          <Rows3 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={config.customText}
            onChange={(e) => onChange({ customText: e.target.value })}
            placeholder="Optional label under the barcode"
            className="pl-10 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
