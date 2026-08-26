import { Link, Wifi, Mail, Phone, MessageSquare, User, Type } from "lucide-react";

import { DataType, QRConfig } from "@/lib/qr-engine";
import { Tool } from "@/components/workshop/Tool";
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
      <div className="space-y-2">
        <p className="spec">{t.qrControls.dataType}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {dataTypes.map(({ value, icon: Icon }) => (
            <Tool
              key={value}
              on={config.dataType === value}
              onClick={() => onChange({ dataType: value, data: "" })}
            >
              <Icon className="h-4 w-4" />
              {t.values.dataTypes[value]}
            </Tool>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="spec block" htmlFor="qr-copy">
          {t.qrControls.content}
        </label>
        <input
          id="qr-copy"
          className="field"
          value={config.data}
          onChange={(event) => onChange({ data: event.target.value })}
          placeholder={dataTypes.find((type) => type.value === config.dataType)?.placeholder}
          dir="ltr"
        />
      </div>
    </div>
  );
}
