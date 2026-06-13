import { QRConfig, defaultConfig } from "./qr-engine";

export interface QRPreset {
  name: string;
  description: string;
  config: Partial<QRConfig>;
}

export const presets: QRPreset[] = [
  {
    name: "Studio Clean",
    description: "Soft rounded style with a refined indigo tone",
    config: {
      moduleStyle: "rounded",
      cornerStyle: "rounded",
      colorMode: "single",
      color1: "#4338CA",
      bgColor: "#FFFFFF",
    },
  },
  {
    name: "Business Classic",
    description: "Structured square layout for professional use",
    config: {
      moduleStyle: "square",
      cornerStyle: "thick",
      colorMode: "single",
      color1: "#1F3A5F",
      bgColor: "#FFFFFF",
    },
  },
  {
    name: "Slate Modern",
    description: "Dark neutral palette with calm contrast",
    config: {
      moduleStyle: "rounded",
      cornerStyle: "rounded",
      colorMode: "single",
      color1: "#0F172A",
      bgColor: "#F8FAFC",
    },
  },
  {
    name: "Aqua Soft",
    description: "Balanced teal styling with clean readability",
    config: {
      moduleStyle: "dots",
      cornerStyle: "rounded",
      colorMode: "single",
      color1: "#0F766E",
      bgColor: "#FFFFFF",
    },
  },
  {
    name: "Warm Editorial",
    description: "Muted warm accent suitable for menus and campaigns",
    config: {
      moduleStyle: "rounded",
      cornerStyle: "rounded",
      colorMode: "single",
      color1: "#B45309",
      bgColor: "#FFF9F2",
    },
  },
  {
    name: "Mono Minimal",
    description: "Subtle monochrome look with compact rhythm",
    config: {
      moduleStyle: "square",
      cornerStyle: "minimal",
      colorMode: "single",
      color1: "#111827",
      bgColor: "#F3F4F6",
    },
  },
  {
    name: "Forest Calm",
    description: "Grounded green palette with gentle contrast",
    config: {
      moduleStyle: "rounded",
      cornerStyle: "rounded",
      colorMode: "single",
      color1: "#166534",
      bgColor: "#F0FDF4",
    },
  },
  {
    name: "Signal Red",
    description: "Controlled accent for notices and direct actions",
    config: {
      moduleStyle: "square",
      cornerStyle: "rounded",
      colorMode: "single",
      color1: "#B91C1C",
      bgColor: "#FFFFFF",
    },
  },
];

export function applyPreset(current: QRConfig, preset: QRPreset): QRConfig {
  return { ...current, ...preset.config };
}
