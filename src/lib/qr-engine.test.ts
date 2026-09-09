import qrcode from "qrcode-generator";
import { describe, expect, it } from "vitest";

import {
  defaultConfig,
  exportCanvasAsSVG,
  generateQRMatrix,
  getEncodedPayload,
  getLogoDrawRect,
  getLogoGeometry,
} from "@/lib/qr-engine";

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

/**
 * The logo is drawn three separate times — canvas, SVG, vector PDF — from one
 * geometry function. These pin that geometry down, and check that the SVG
 * export actually reflects the chosen cut rather than silently falling back to
 * the old plain rectangle.
 */

const LOGO_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

describe("logo geometry", () => {
  const base = { ...defaultConfig, logoUrl: LOGO_PIXEL, logoScale: 0.25, size: 400 };

  it("centres the plate and grows it by the padding on every side", () => {
    const geometry = getLogoGeometry(400, { ...base, logoPadding: 20 });

    expect(geometry.logoSize).toBe(100);
    expect(geometry.logoX).toBe(150);
    // 20% of the 100px box, added on both sides.
    expect(geometry.plateSize).toBe(140);
    expect(geometry.plateX).toBe(130);
    expect(geometry.plateX + geometry.plateSize / 2).toBe(200);
  });

  it("resolves a circle plate to a radius of half its side", () => {
    const geometry = getLogoGeometry(400, { ...base, logoPlateShape: "circle" });
    expect(geometry.plateCornerRadius).toBe(geometry.plateSize / 2);
  });

  it("keeps a square plate hard-cornered whatever the radius dial says", () => {
    const geometry = getLogoGeometry(400, { ...base, logoPlateShape: "square", logoRadius: 50 });
    expect(geometry.plateCornerRadius).toBe(0);
  });

  it("letterboxes an uncut logo but crops a shaped one to fill the box", () => {
    const geometry = getLogoGeometry(400, base);

    // A 2:1 logo fits inside the box, leaving bars above and below.
    const fitted = getLogoDrawRect(geometry, { ...base, logoShape: "original" }, 200, 100);
    expect(fitted.width).toBe(100);
    expect(fitted.height).toBe(50);

    // The same logo covers the box once a cut is chosen, so the circle is full.
    const covered = getLogoDrawRect(geometry, { ...base, logoShape: "circle" }, 200, 100);
    expect(covered.height).toBe(100);
    expect(covered.width).toBe(200);
    expect(covered.x).toBe(geometry.logoX - 50);
  });
});

describe("logo in the SVG export", () => {
  const base = { ...defaultConfig, logoUrl: LOGO_PIXEL, data: "https://example.com" };

  function svgFor(overrides: Partial<typeof base>) {
    const config = { ...base, ...overrides };
    return exportCanvasAsSVG(generateQRMatrix(config), config);
  }

  it("draws a circular plate as a circle rather than a rounded rectangle", () => {
    const geometry = getLogoGeometry(base.size, { ...base, logoPlateShape: "circle" });
    const svg = svgFor({ logoPlateShape: "circle" });
    expect(svg).toContain(`r="${geometry.plateSize / 2}"`);
  });

  it("omits the plate entirely when it is switched off", () => {
    expect(svgFor({ logoPlate: true, logoPlateColor: "#ABCDEF" })).toContain("#ABCDEF");
    expect(svgFor({ logoPlate: false, logoPlateColor: "#ABCDEF" })).not.toContain("#ABCDEF");
  });

  it("clips and covers the artwork once a cut is chosen", () => {
    expect(svgFor({ logoShape: "original" })).toContain('preserveAspectRatio="xMidYMid meet"');

    // Nothing has decoded the logo here, so the export takes its "slice"
    // fallback rather than stating a cover rect it cannot measure yet.
    const cut = svgFor({ logoShape: "rounded" });
    expect(cut).toContain("clipPath");
    expect(cut).toContain('preserveAspectRatio="xMidYMid slice"');
  });

  it("strokes an outline only when one was asked for", () => {
    expect(svgFor({ logoBorderWidth: 0 })).not.toContain("stroke-width");

    const outlined = svgFor({ logoBorderWidth: 8, logoBorderColor: "#123456" });
    expect(outlined).toContain('stroke="#123456"');
  });
});
