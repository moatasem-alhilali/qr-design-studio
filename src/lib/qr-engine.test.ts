import qrcode from "qrcode-generator";
import { describe, expect, it } from "vitest";

import { defaultConfig, generateQRMatrix, getEncodedPayload } from "@/lib/qr-engine";

/**
 * Regression cover for the byte encoder.
 *
 * qrcode-generator defaults to an encoder that does `charCodeAt(i) & 0xff`,
 * which silently mangles every non-Latin character. Importing the engine is
 * what selects the UTF-8 encoder instead, so these tests fail loudly if that
 * line is ever removed.
 */

describe("byte encoding", () => {
  it("encodes Arabic as real UTF-8 rather than truncated code units", () => {
    // Importing qr-engine above is what installs the UTF-8 encoder.
    const bytes = qrcode.stringToBytes("مرحبا");
    const expected = Array.from(new TextEncoder().encode("مرحبا"));

    expect(bytes).toEqual(expected);
    // Two bytes per Arabic letter; the broken default produced five.
    expect(bytes).toHaveLength(10);
  });

  it("does not collapse distinct Arabic letters onto the same byte", () => {
    // Under the old encoder "م" and "E" both became 0x45.
    const meem = qrcode.stringToBytes("م");
    expect(meem).not.toEqual([0x45]);
    expect(meem).toEqual([0xd9, 0x85]);
  });

  it("still encodes ASCII one byte per character", () => {
    expect(qrcode.stringToBytes("Hi!")).toEqual([72, 105, 33]);
  });
});

describe("quiet zone", () => {
  it("defaults to the four modules the specification requires", () => {
    expect(defaultConfig.quietZone).toBe(4);
  });
});

describe("generateQRMatrix", () => {
  it("builds a square matrix for an Arabic payload", () => {
    const matrix = generateQRMatrix({ ...defaultConfig, dataType: "text", data: "مرحبا بالعالم" });

    expect(matrix.size).toBeGreaterThan(0);
    expect(matrix.modules).toHaveLength(matrix.size);
    expect(matrix.modules[0]).toHaveLength(matrix.size);
  });

  it("reports the payload it actually encodes", () => {
    const config = { ...defaultConfig, dataType: "phone" as const, data: "+967 770 000 000" };
    expect(getEncodedPayload(config)).toBe("tel:+967770000000");
  });

  it("throws a typed capacity error instead of failing silently", () => {
    const config = { ...defaultConfig, dataType: "text" as const, data: "x".repeat(5000) };
    expect(() => generateQRMatrix(config)).toThrowError(/capacity/i);
  });
});
