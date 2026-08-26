/**
 * Payload construction for every QR data type.
 *
 * This used to live as a one-line switch inside the engine, which is how the
 * Wi-Fi payload shipped a hard-coded literal password and the vCard shipped a
 * name with no way to reach the person. Payload building is its own concern:
 * each format has an escaping contract, and getting that wrong produces a code
 * that scans perfectly and then does nothing useful.
 */

export type DataType =
  | "url"
  | "wifi"
  | "email"
  | "phone"
  | "text"
  | "whatsapp"
  | "vcard"
  | "sms"
  | "geo"
  | "event";

export type WifiEncryption = "WPA" | "WEP" | "nopass";

/** Extra values for the data types that need more than a single string. */
export interface QRFields {
  // Wi-Fi — `data` carries the SSID.
  wifiPassword?: string;
  wifiEncryption?: WifiEncryption;
  wifiHidden?: boolean;

  // vCard — `data` carries the full name.
  vcardPhone?: string;
  vcardEmail?: string;
  vcardOrg?: string;
  vcardTitle?: string;
  vcardUrl?: string;

  // Email — `data` carries the address.
  emailSubject?: string;
  emailBody?: string;

  // SMS / WhatsApp — `data` carries the number.
  message?: string;

  // Geo
  geoLatitude?: string;
  geoLongitude?: string;

  // Calendar event — `data` carries the summary.
  eventLocation?: string;
  eventStart?: string;
  eventEnd?: string;
}

export const defaultFields: QRFields = {
  wifiEncryption: "WPA",
  wifiHidden: false,
};

/**
 * MECARD/Wi-Fi grammar: backslash-escape the delimiters, or an SSID with a
 * semicolon in it silently truncates the rest of the payload.
 */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** RFC 6350 text escaping for vCard and iCalendar property values. */
function escapeIcal(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** vCard and iCalendar are CRLF formats; LF-only breaks strict parsers. */
function joinLines(lines: string[]): string {
  return lines.filter(Boolean).join("\r\n");
}

function hasNonAscii(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 127) return true;
  }
  return false;
}

/**
 * vCard 3.0 predates a mandatory charset, so contact apps routinely fall back
 * to Latin-1 and render an Arabic name as mojibake even when the bytes are
 * valid UTF-8. Tagging the property tells the importer how to read it.
 *
 * Only non-ASCII values get the parameter, which keeps Latin cards byte for
 * byte as they were and costs nothing in QR capacity.
 */
function charsetFor(value: string): string {
  return hasNonAscii(value) ? ";CHARSET=UTF-8" : "";
}

/** Builds one vCard property line, escaped and charset-tagged as needed. */
function vcardProp(name: string, value: string | undefined, params = ""): string {
  if (!value) return "";
  return `${name}${params}${charsetFor(value)}:${escapeIcal(value)}`;
}

function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/** Phone numbers keep a leading + but drop separators. */
function normalisePhone(value: string): string {
  const trimmed = value.trim();
  const digits = digitsOnly(trimmed);
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

/**
 * `<input type="datetime-local">` gives "2026-01-01T09:00". iCalendar wants
 * "20260101T090000". Emitting it as floating local time (no trailing Z) is
 * deliberate: an event QR should read 09:00 wherever it is scanned, rather
 * than being shifted by the scanner's timezone.
 */
function toIcalDateTime(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return "";
  const [, y, mo, d, h, mi, s] = match;
  return `${y}${mo}${d}T${h}${mi}${s ?? "00"}`;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const pairs = Object.entries(params)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
  return pairs.length ? `?${pairs.join("&")}` : "";
}

export interface PayloadInput {
  data: string;
  dataType: DataType;
  fields?: QRFields;
}

export function formatQRPayload({ data, dataType, fields = {} }: PayloadInput): string {
  const value = data.trim();

  switch (dataType) {
    case "wifi": {
      const encryption = fields.wifiEncryption ?? "WPA";
      const parts = [`T:${encryption}`, `S:${escapeWifi(value)}`];
      if (encryption !== "nopass" && fields.wifiPassword) {
        parts.push(`P:${escapeWifi(fields.wifiPassword)}`);
      }
      if (fields.wifiHidden) parts.push("H:true");
      return `WIFI:${parts.join(";")};;`;
    }

    case "email":
      return `mailto:${value}${buildQuery({ subject: fields.emailSubject, body: fields.emailBody })}`;

    case "phone":
      return `tel:${normalisePhone(value)}`;

    case "sms": {
      const number = normalisePhone(value);
      // SMSTO is the format QR readers have supported the longest.
      return fields.message ? `SMSTO:${number}:${fields.message}` : `SMSTO:${number}`;
    }

    case "whatsapp":
      return `https://wa.me/${digitsOnly(value)}${buildQuery({ text: fields.message })}`;

    case "geo": {
      const lat = (fields.geoLatitude ?? "").trim();
      const lng = (fields.geoLongitude ?? "").trim();
      if (!lat || !lng) return "geo:0,0";
      return `geo:${lat},${lng}`;
    }

    case "vcard": {
      // N wants structured parts; treat the last token as the family name.
      const nameParts = value.split(/\s+/).filter(Boolean);
      const family = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      const given = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : value;

      return joinLines([
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N${charsetFor(value)}:${escapeIcal(family)};${escapeIcal(given)};;;`,
        vcardProp("FN", value),
        vcardProp("ORG", fields.vcardOrg),
        vcardProp("TITLE", fields.vcardTitle),
        // Phone numbers are digits and "+", so they never need a charset.
        fields.vcardPhone ? `TEL;TYPE=CELL:${normalisePhone(fields.vcardPhone)}` : "",
        vcardProp("EMAIL", fields.vcardEmail, ";TYPE=INTERNET"),
        vcardProp("URL", fields.vcardUrl),
        "END:VCARD",
      ]);
    }

    case "event": {
      const start = toIcalDateTime(fields.eventStart ?? "");
      const end = toIcalDateTime(fields.eventEnd ?? "");
      return joinLines([
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${escapeIcal(value)}`,
        fields.eventLocation ? `LOCATION:${escapeIcal(fields.eventLocation)}` : "",
        start ? `DTSTART:${start}` : "",
        end ? `DTEND:${end}` : "",
        "END:VEVENT",
        "END:VCALENDAR",
      ]);
    }

    default:
      return value;
  }
}

/** UTF-8 byte length — what actually counts against QR capacity, not `.length`. */
export function byteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
  return unescape(encodeURIComponent(value)).length;
}

/** Which extra inputs a data type needs, so the form can build itself. */
export type FieldKey = keyof QRFields;

export const fieldsForType: Record<DataType, FieldKey[]> = {
  url: [],
  text: [],
  phone: [],
  wifi: ["wifiPassword", "wifiEncryption", "wifiHidden"],
  email: ["emailSubject", "emailBody"],
  sms: ["message"],
  whatsapp: ["message"],
  geo: ["geoLatitude", "geoLongitude"],
  vcard: ["vcardPhone", "vcardEmail", "vcardOrg", "vcardTitle", "vcardUrl"],
  event: ["eventLocation", "eventStart", "eventEnd"],
};
