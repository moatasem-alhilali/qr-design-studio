import { DataType, QRConfig } from "@/lib/qr-engine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Link, Wifi, Mail, Phone, MessageSquare, User, Type, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const dataTypes: { value: DataType; label: string; icon: React.ElementType; placeholder: string }[] = [
  { value: "url", label: "URL", icon: Link, placeholder: "https://example.com" },
  { value: "wifi", label: "WiFi", icon: Wifi, placeholder: "Network name" },
  { value: "email", label: "Email", icon: Mail, placeholder: "hello@example.com" },
  { value: "phone", label: "Phone", icon: Phone, placeholder: "+1234567890" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, placeholder: "+1234567890" },
  { value: "vcard", label: "Contact", icon: User, placeholder: "Full Name" },
  { value: "text", label: "Text", icon: Type, placeholder: "Any text..." },
];

interface DataInputProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
}

export function DataInput({ config, onChange }: DataInputProps) {
  return (
    <div className="space-y-4">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Data Type
      </Label>
      <div className="grid grid-cols-4 gap-1.5">
        {dataTypes.map(({ value, label, icon: Icon }) => (
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
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content
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
