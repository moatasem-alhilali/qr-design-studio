import { describe, expect, it } from "vitest";

import { byteLength, formatQRPayload } from "@/lib/qr-payloads";

/**
 * These cover the payloads that were silently broken: a Wi-Fi code carrying a
 * hard-coded literal password, and a vCard with no way to contact anyone.
 * Both produced codes that scanned perfectly and then did nothing.
 */

describe("wifi", () => {
  it("carries the real password rather than a placeholder", () => {
    const payload = formatQRPayload({
      data: "Cafe Guest",
      dataType: "wifi",
      fields: { wifiPassword: "s3cret-pass", wifiEncryption: "WPA" },
    });

    expect(payload).toBe("WIFI:T:WPA;S:Cafe Guest;P:s3cret-pass;;");
    expect(payload).not.toContain("P:password;");
  });

  it("escapes delimiters so an SSID cannot truncate the payload", () => {
    const payload = formatQRPayload({
      data: "Net;work",
      dataType: "wifi",
      fields: { wifiPassword: 'a:b,c"d\\e', wifiEncryption: "WPA" },
    });

    expect(payload).toContain("S:Net\\;work");
    expect(payload).toContain('P:a\\:b\\,c\\"d\\\\e');
  });

  it("omits the password for an open network and marks hidden ones", () => {
    const open = formatQRPayload({
      data: "Free WiFi",
      dataType: "wifi",
      fields: { wifiEncryption: "nopass", wifiPassword: "ignored", wifiHidden: true },
    });

    expect(open).toBe("WIFI:T:nopass;S:Free WiFi;H:true;;");
    expect(open).not.toContain("ignored");
  });
});

describe("vcard", () => {
  it("includes every contact detail, not just the name", () => {
    const payload = formatQRPayload({
      data: "Moatasem Alhilali",
      dataType: "vcard",
      fields: {
        vcardPhone: "+967 770 000 000",
        vcardEmail: "hi@example.com",
        vcardOrg: "Studio",
        vcardTitle: "Engineer",
        vcardUrl: "https://example.com",
      },
    });

    expect(payload).toContain("FN:Moatasem Alhilali");
    // Family name last, given names first.
    expect(payload).toContain("N:Alhilali;Moatasem;;;");
    expect(payload).toContain("TEL;TYPE=CELL:+967770000000");
    expect(payload).toContain("EMAIL;TYPE=INTERNET:hi@example.com");
    expect(payload).toContain("ORG:Studio");
    expect(payload).toContain("TITLE:Engineer");
    expect(payload).toContain("URL:https://example.com");
  });

  it("uses CRLF line endings as the vCard grammar requires", () => {
    const payload = formatQRPayload({ data: "Sara", dataType: "vcard", fields: {} });
    expect(payload.startsWith("BEGIN:VCARD\r\nVERSION:3.0")).toBe(true);
    expect(payload.endsWith("END:VCARD")).toBe(true);
  });

  it("escapes commas and semicolons inside values", () => {
    const payload = formatQRPayload({
      data: "Ann",
      dataType: "vcard",
      fields: { vcardOrg: "Acme, Inc; Ltd" },
    });
    expect(payload).toContain("ORG:Acme\\, Inc\\; Ltd");
  });
});

describe("messaging and location", () => {
  it("builds an SMS payload with the message body", () => {
    expect(
      formatQRPayload({ data: "+967 770 111 222", dataType: "sms", fields: { message: "Hello" } }),
    ).toBe("SMSTO:+967770111222:Hello");
  });

  it("url-encodes the WhatsApp prefill", () => {
    expect(
      formatQRPayload({ data: "+967 770 111 222", dataType: "whatsapp", fields: { message: "hi there" } }),
    ).toBe("https://wa.me/967770111222?text=hi%20there");
  });

  it("adds subject and body to a mailto", () => {
    expect(
      formatQRPayload({
        data: "a@b.com",
        dataType: "email",
        fields: { emailSubject: "Hi there", emailBody: "Line one" },
      }),
    ).toBe("mailto:a@b.com?subject=Hi%20there&body=Line%20one");
  });

  it("emits a geo URI", () => {
    expect(
      formatQRPayload({ data: "", dataType: "geo", fields: { geoLatitude: "15.36", geoLongitude: "44.19" } }),
    ).toBe("geo:15.36,44.19");
  });
});

describe("calendar event", () => {
  it("converts datetime-local values to floating iCalendar stamps", () => {
    const payload = formatQRPayload({
      data: "Launch",
      dataType: "event",
      fields: { eventStart: "2026-09-01T09:30", eventEnd: "2026-09-01T11:00", eventLocation: "Studio" },
    });

    expect(payload).toContain("BEGIN:VCALENDAR");
    expect(payload).toContain("SUMMARY:Launch");
    expect(payload).toContain("LOCATION:Studio");
    // No trailing Z: the event reads 09:30 wherever it is scanned.
    expect(payload).toContain("DTSTART:20260901T093000");
    expect(payload).toContain("DTEND:20260901T110000");
    expect(payload).toContain("END:VCALENDAR");
  });

  it("drops timestamps it cannot parse rather than emitting a broken one", () => {
    const payload = formatQRPayload({ data: "Talk", dataType: "event", fields: { eventStart: "nonsense" } });
    expect(payload).not.toContain("DTSTART");
  });
});

describe("arabic contact cards", () => {
  it("tags non-ASCII properties with CHARSET so contact apps stop showing mojibake", () => {
    const payload = formatQRPayload({
      data: "معتصم الهلالي",
      dataType: "vcard",
      fields: { vcardOrg: "استوديو", vcardEmail: "hi@example.com" },
    });

    expect(payload).toContain("FN;CHARSET=UTF-8:معتصم الهلالي");
    expect(payload).toContain("N;CHARSET=UTF-8:الهلالي;معتصم;;;");
    expect(payload).toContain("ORG;CHARSET=UTF-8:استوديو");
    // An ASCII value stays exactly as it was — no needless bytes.
    expect(payload).toContain("EMAIL;TYPE=INTERNET:hi@example.com");
  });

  it("leaves a fully Latin card untouched", () => {
    const payload = formatQRPayload({ data: "Sara Ali", dataType: "vcard", fields: { vcardOrg: "Acme" } });
    expect(payload).not.toContain("CHARSET");
    expect(payload).toContain("FN:Sara Ali");
  });
});

describe("byteLength", () => {
  it("counts UTF-8 bytes, which is what QR capacity is measured in", () => {
    expect(byteLength("abc")).toBe(3);
    // Arabic characters are two bytes each in UTF-8.
    expect(byteLength("مرحبا")).toBe(10);
  });
});
