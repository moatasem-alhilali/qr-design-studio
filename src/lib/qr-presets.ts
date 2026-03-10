import { QRConfig, defaultConfig } from "./qr-engine";

export interface QRPreset {
  name: string;
  description: string;
  config: Partial<QRConfig>;
}

export const presets: QRPreset[] = [
  {
    name: "Modern Minimal",
    description: "Clean rounded dots with purple gradient",
    config: {
      moduleStyle: "dots",
      cornerStyle: "circle",
      colorMode: "gradient",
      color1: "#6C3AED",
      color2: "#8B5CF6",
      bgColor: "#FFFFFF",
    },
  },
  {
    name: "Corporate",
    description: "Professional square style with dark blue",
    config: {
      moduleStyle: "square",
      cornerStyle: "thick",
      colorMode: "single",
      color1: "#1E3A5F",
      bgColor: "#FFFFFF",
    },
  },
  {
    name: "Neon Pop",
    description: "Vibrant gradient with rounded modules",
    config: {
      moduleStyle: "rounded",
      cornerStyle: "rounded",
      colorMode: "gradient",
      color1: "#FF0080",
      color2: "#7928CA",
      bgColor: "#0A0A0A",
    },
  },
  {
    name: "Ocean Breeze",
    description: "Cool teal gradient dots",
    config: {
      moduleStyle: "dots",
      cornerStyle: "decorative",
      colorMode: "gradient",
      color1: "#06B6D4",
      color2: "#10B981",
      bgColor: "#FFFFFF",
    },
  },
  {
    name: "Sunset Glow",
    description: "Warm orange to pink gradient",
    config: {
      moduleStyle: "extra-rounded",
      cornerStyle: "circle",
      colorMode: "gradient",
      color1: "#F97316",
      color2: "#EC4899",
      gradientAngle: 45,
      bgColor: "#FFFBF5",
    },
  },
  {
    name: "Stealth",
    description: "Dark minimal diamond pattern",
    config: {
      moduleStyle: "diamond",
      cornerStyle: "minimal",
      colorMode: "single",
      color1: "#18181B",
      bgColor: "#F4F4F5",
    },
  },
  {
    name: "Forest",
    description: "Nature-inspired green tones",
    config: {
      moduleStyle: "rounded",
      cornerStyle: "rounded",
      colorMode: "gradient",
      color1: "#059669",
      color2: "#065F46",
      bgColor: "#ECFDF5",
    },
  },
  {
    name: "Crimson",
    description: "Bold red with square style",
    config: {
      moduleStyle: "square",
      cornerStyle: "decorative",
      colorMode: "single",
      color1: "#DC2626",
      bgColor: "#FFFFFF",
    },
  },
];

export function applyPreset(current: QRConfig, preset: QRPreset): QRConfig {
  return { ...current, ...preset.config };
}
