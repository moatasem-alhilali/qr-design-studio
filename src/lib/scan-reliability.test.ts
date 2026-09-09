import { describe, expect, it } from "vitest";

import { defaultConfig, type QRConfig } from "@/lib/qr-engine";
import { analyzeScanReliability, optimizeForScanning } from "@/lib/scan-reliability";

/**
 * The panel used to score a design from fixed numbers — "logoScale over 0.3 is
 * bad" — which said nothing about the grid the payload actually produced or
 * about a logo whose padding had doubled the area it erases. These pin down the
 * measured replacements, and the one-click fix built on top of them.
 */

const LOGO = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function withLogo(overrides: Partial<QRConfig> = {}): QRConfig {
  return { ...defaultConfig, data: "https://example.com", logoUrl: LOGO, ...overrides };
}

describe("scan reliability measurement", () => {
  it("reports the grid the payload actually produced", () => {
    const short = analyzeScanReliability({ ...defaultConfig, data: "https://a.co" });
    const long = analyzeScanReliability({ ...defaultConfig, dataType: "text", data: "x".repeat(600) });

    expect(short.moduleCount).toBeGreaterThan(0);
    expect(short.version).toBeGreaterThanOrEqual(1);
    expect(long.moduleCount).toBeGreaterThan(short.moduleCount);
  });

  it("flags a dense grid as the thing slowing the first read", () => {
    const long = analyzeScanReliability({ ...defaultConfig, dataType: "text", data: "x".repeat(600) });
    expect(long.issues.some((issue) => issue.type === "density")).toBe(true);
  });

  it("charges a circular plate less coverage than a square one of the same size", () => {
    const square = analyzeScanReliability(withLogo({ logoPlateShape: "square" }));
    const circle = analyzeScanReliability(withLogo({ logoPlateShape: "circle" }));

    expect(circle.logoCoverage).toBeLessThan(square.logoCoverage);
    // A circle inscribed in a square is pi/4 of it.
    expect(circle.logoCoverage / square.logoCoverage).toBeCloseTo(Math.PI / 4, 2);
  });

  it("counts the padding as erased area, not just the artwork", () => {
    const tight = analyzeScanReliability(withLogo({ logoPadding: 0 }));
    const padded = analyzeScanReliability(withLogo({ logoPadding: 40 }));
    expect(padded.logoCoverage).toBeGreaterThan(tight.logoCoverage);
  });

  it("does not throw on a payload that exceeds capacity", () => {
    const result = analyzeScanReliability({ ...defaultConfig, dataType: "text", data: "x".repeat(5000) });
    expect(result.moduleCount).toBe(0);
    expect(result.logoCoverage).toBe(0);
  });
});

describe("tuning for fast scanning", () => {
  it("leaves an already-fast design alone", () => {
    const fast: QRConfig = {
      ...defaultConfig,
      data: "https://a.co",
      moduleStyle: "rounded",
      cornerStyle: "rounded",
      color1: "#111111",
      bgColor: "#FFFFFF",
      quietZone: 4,
      size: 400,
      errorCorrection: "Q",
    };
    expect(optimizeForScanning(fast).applied).toEqual([]);
  });

  it("replaces decorative faces with the fast equivalents", () => {
    const { updates, applied } = optimizeForScanning({
      ...defaultConfig,
      moduleStyle: "heart",
      cornerStyle: "leaf",
    });

    expect(updates.moduleStyle).toBe("rounded");
    expect(updates.cornerStyle).toBe("rounded");
    expect(applied).toContain("modules");
    expect(applied).toContain("corners");
  });

  it("darkens weak ink instead of discarding the colour", () => {
    const { updates, applied } = optimizeForScanning({ ...defaultConfig, color1: "#F2C4A0", bgColor: "#FFFFFF" });

    expect(applied).toContain("contrast");
    expect(updates.color1).toBeDefined();
    // Still a warm tone, just dark enough to read.
    const [r, , b] = [1, 3, 5].map((i) => parseInt(updates.color1!.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(b);
  });

  it("shrinks a logo that outgrew the error-correction budget", () => {
    const greedy = withLogo({ logoScale: 0.4, logoPadding: 30 });
    const before = analyzeScanReliability(greedy).logoCoverage;
    const { updates } = optimizeForScanning(greedy);

    expect(updates.logoScale).toBeLessThan(greedy.logoScale);
    const after = analyzeScanReliability({ ...greedy, ...updates }).logoCoverage;
    expect(after).toBeLessThan(before);
    expect(after).toBeLessThan(0.22);
  });

  it("sizes the logo against the quiet zone it is about to widen", () => {
    // A narrow quiet zone makes the symbol look larger, and with it the share
    // the logo appears to cover. Tuning widens the zone, so a shrink measured
    // before that change lands short of the target.
    const cramped = withLogo({ logoScale: 0.4, logoPadding: 30, quietZone: 2 });
    const { updates } = optimizeForScanning(cramped);
    const after = analyzeScanReliability({ ...cramped, ...updates }).logoCoverage;

    expect(updates.quietZone).toBe(4);
    expect(after).toBeLessThanOrEqual(0.16);
  });

  it("restores the plate under a logo left sitting on the modules", () => {
    const { updates } = optimizeForScanning(withLogo({ logoPlate: false }));
    expect(updates.logoPlate).toBe(true);
  });

  it("never weakens error correction while a logo covers the centre", () => {
    const { updates } = optimizeForScanning(withLogo({ errorCorrection: "H" }));
    expect(updates.errorCorrection).toBeUndefined();
  });

  it("trades H for Q without a logo only when it actually thins the grid", () => {
    const { updates } = optimizeForScanning({
      ...defaultConfig,
      dataType: "text",
      data: "y".repeat(300),
      errorCorrection: "H",
    });
    expect(updates.errorCorrection).toBe("Q");
  });
});
