import { CalendarClock, Link, Mail, MapPin, MessageCircle, MessageSquare, Phone, Type, User, Wifi } from "lucide-react";

import { DataType, QRConfig } from "@/lib/qr-engine";
import type { QRFields, WifiEncryption } from "@/lib/qr-payloads";
import { Tool } from "@/components/workshop/Tool";
import { useI18n } from "@/shared/i18n/i18n";

const dataTypes: { value: DataType; icon: React.ElementType }[] = [
  { value: "url", icon: Link },
  { value: "wifi", icon: Wifi },
  { value: "email", icon: Mail },
  { value: "phone", icon: Phone },
  { value: "sms", icon: MessageCircle },
  { value: "whatsapp", icon: MessageSquare },
  { value: "vcard", icon: User },
  { value: "geo", icon: MapPin },
  { value: "event", icon: CalendarClock },
  { value: "text", icon: Type },
];

interface DataInputProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
}

/** Label and placeholder for the primary value, which every type reuses. */
function primaryFor(dataType: DataType, t: ReturnType<typeof useI18n>["t"]) {
  switch (dataType) {
    case "wifi":
      return { label: t.qrControls.networkName, placeholder: "My Network", ltr: false };
    case "email":
      return { label: t.qrControls.contactEmail, placeholder: "hello@example.com", ltr: true };
    case "phone":
    case "sms":
      return { label: t.qrControls.contactPhone, placeholder: "+9677xxxxxxx", ltr: true };
    case "whatsapp":
      return { label: t.qrControls.contactPhone, placeholder: "+9677xxxxxxx", ltr: true };
    case "vcard":
      return { label: t.values.dataTypes.vcard, placeholder: "Moatasem Alhilali", ltr: false };
    case "geo":
      return { label: t.qrControls.eventLocation, placeholder: "Sana'a", ltr: false };
    case "event":
      return { label: t.qrControls.eventTitle, placeholder: "Launch party", ltr: false };
    case "text":
      return { label: t.qrControls.content, placeholder: "Any text…", ltr: false };
    default:
      return { label: t.qrControls.content, placeholder: "https://example.com", ltr: true };
  }
}

export function DataInput({ config, onChange }: DataInputProps) {
  const { t } = useI18n();
  const primary = primaryFor(config.dataType, t);

  /** Patches one structured field without dropping the others. */
  const setField = (updates: Partial<QRFields>) =>
    onChange({ fields: { ...config.fields, ...updates } });

  const field = (
    id: string,
    label: string,
    value: string,
    onValue: (next: string) => void,
    options: { placeholder?: string; ltr?: boolean; type?: string; textarea?: boolean } = {},
  ) => (
    <div className="space-y-1.5" key={id}>
      <label className="spec block" htmlFor={id}>
        {label}
      </label>
      {options.textarea ? (
        <textarea
          id={id}
          className="field resize-y"
          rows={2}
          value={value}
          onChange={(event) => onValue(event.target.value)}
          placeholder={options.placeholder}
          dir={options.ltr ? "ltr" : undefined}
        />
      ) : (
        <input
          id={id}
          className="field"
          type={options.type ?? "text"}
          value={value}
          onChange={(event) => onValue(event.target.value)}
          placeholder={options.placeholder}
          dir={options.ltr ? "ltr" : undefined}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="spec">{t.qrControls.dataType}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {dataTypes.map(({ value, icon: Icon }) => (
            <Tool
              key={value}
              on={config.dataType === value}
              // Clearing the payload avoids carrying a phone number into a URL.
              onClick={() => onChange({ dataType: value, data: "" })}
            >
              <Icon className="h-4 w-4" />
              {t.values.dataTypes[value]}
            </Tool>
          ))}
        </div>
      </div>

      {field("qr-copy", primary.label, config.data, (value) => onChange({ data: value }), {
        placeholder: primary.placeholder,
        ltr: primary.ltr,
        textarea: config.dataType === "text",
      })}

      {/* Wi-Fi: a real credential set. The payload used to hard-code the
          literal password "password", so every Wi-Fi code ever made was dead. */}
      {config.dataType === "wifi" && (
        <>
          <div className="space-y-1.5">
            <p className="spec">{t.qrControls.wifiEncryption}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["WPA", "WEP", "nopass"] as WifiEncryption[]).map((mode) => (
                <Tool
                  key={mode}
                  wide
                  on={(config.fields.wifiEncryption ?? "WPA") === mode}
                  onClick={() => setField({ wifiEncryption: mode })}
                >
                  {mode === "nopass" ? "Open" : mode}
                </Tool>
              ))}
            </div>
          </div>

          {(config.fields.wifiEncryption ?? "WPA") !== "nopass" &&
            field(
              "wifi-password",
              t.qrControls.wifiPassword,
              config.fields.wifiPassword ?? "",
              (value) => setField({ wifiPassword: value }),
              { ltr: true, placeholder: "••••••••" },
            )}

          <Tool
            wide
            className="w-full"
            on={Boolean(config.fields.wifiHidden)}
            onClick={() => setField({ wifiHidden: !config.fields.wifiHidden })}
          >
            {t.qrControls.wifiHidden}
          </Tool>
        </>
      )}

      {config.dataType === "email" && (
        <>
          {field("email-subject", t.qrControls.emailSubject, config.fields.emailSubject ?? "", (value) =>
            setField({ emailSubject: value }),
          )}
          {field(
            "email-body",
            t.qrControls.emailBody,
            config.fields.emailBody ?? "",
            (value) => setField({ emailBody: value }),
            { textarea: true },
          )}
        </>
      )}

      {(config.dataType === "sms" || config.dataType === "whatsapp") &&
        field(
          "sms-message",
          t.qrControls.smsMessage,
          config.fields.message ?? "",
          (value) => setField({ message: value }),
          { textarea: true },
        )}

      {config.dataType === "geo" && (
        <div className="grid grid-cols-2 gap-3">
          {field(
            "geo-lat",
            t.qrControls.latitude,
            config.fields.geoLatitude ?? "",
            (value) => setField({ geoLatitude: value }),
            { ltr: true, placeholder: "15.3694" },
          )}
          {field(
            "geo-lng",
            t.qrControls.longitude,
            config.fields.geoLongitude ?? "",
            (value) => setField({ geoLongitude: value }),
            { ltr: true, placeholder: "44.1910" },
          )}
        </div>
      )}

      {/* vCard: previously a name and nothing else — a business card with no
          way to contact the person on it. */}
      {config.dataType === "vcard" && (
        <>
          {field(
            "vcard-phone",
            t.qrControls.contactPhone,
            config.fields.vcardPhone ?? "",
            (value) => setField({ vcardPhone: value }),
            { ltr: true, placeholder: "+9677xxxxxxx" },
          )}
          {field(
            "vcard-email",
            t.qrControls.contactEmail,
            config.fields.vcardEmail ?? "",
            (value) => setField({ vcardEmail: value }),
            { ltr: true, placeholder: "hello@example.com" },
          )}
          {field("vcard-org", t.qrControls.contactOrg, config.fields.vcardOrg ?? "", (value) =>
            setField({ vcardOrg: value }),
          )}
          {field("vcard-title", t.qrControls.contactTitle, config.fields.vcardTitle ?? "", (value) =>
            setField({ vcardTitle: value }),
          )}
          {field(
            "vcard-url",
            t.qrControls.contactWebsite,
            config.fields.vcardUrl ?? "",
            (value) => setField({ vcardUrl: value }),
            { ltr: true, placeholder: "https://example.com" },
          )}
        </>
      )}

      {config.dataType === "event" && (
        <>
          {field("event-location", t.qrControls.eventLocation, config.fields.eventLocation ?? "", (value) =>
            setField({ eventLocation: value }),
          )}
          <div className="grid grid-cols-2 gap-3">
            {field(
              "event-start",
              t.qrControls.eventStart,
              config.fields.eventStart ?? "",
              (value) => setField({ eventStart: value }),
              { type: "datetime-local", ltr: true },
            )}
            {field(
              "event-end",
              t.qrControls.eventEnd,
              config.fields.eventEnd ?? "",
              (value) => setField({ eventEnd: value }),
              { type: "datetime-local", ltr: true },
            )}
          </div>
        </>
      )}
    </div>
  );
}
