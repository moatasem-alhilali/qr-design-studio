import { DataType, QRConfig } from "@/lib/qr-engine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Link, Wifi, Mail, Phone, MessageSquare, User, Type, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/shared/i18n/i18n";

const dataTypes: { value: DataType; icon: React.ElementType; placeholder: string }[] = [
  { value: "url", icon: Link, placeholder: "https://example.com" },
  { value: "wifi", icon: Wifi, placeholder: "Network name" },
  { value: "email", icon: Mail, placeholder: "hello@example.com" },
  { value: "phone", icon: Phone, placeholder: "+1234567890" },
  { value: "whatsapp", icon: MessageSquare, placeholder: "+1234567890" },
  { value: "vcard", icon: User, placeholder: "Full Name" },
  { value: "text", icon: Type, placeholder: "Any text..." },
];

interface DataInputProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
}

export function DataInput({ config, onChange }: DataInputProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t.qrControls.dataType}
      </Label>
      <div className="grid grid-cols-4 gap-1.5">
        {dataTypes.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onChange({ dataType: value, data: "" })}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all",
              config.dataType === value
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {t.values.dataTypes[value]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.qrControls.content}
        </Label>
        <Input
          value={config.data}
          onChange={(e) => onChange({ data: e.target.value })}
          placeholder={dataTypes.find((d) => d.value === config.dataType)?.placeholder}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}
