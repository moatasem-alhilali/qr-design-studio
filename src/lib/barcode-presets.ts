import { BarcodeConfig } from "./barcode-engine";

export interface BarcodePreset {
  name: string;
  description: string;
  config: Partial<BarcodeConfig>;
}

export const barcodePresets: BarcodePreset[] = [
  {
    name: "Retail Standard",
    description: "Balanced product label style with clear numeric text",
    config: {
      format: "EAN13",
      dataType: "product",
      barShape: "square",
      colorMode: "single",
      color1: "#111827",
      bgColor: "#FFFFFF",
      height: 120,
      barWidth: 2,
      showText: true,
      textAlign: "center",
    },
  },
  {
    name: "Warehouse Bold",
    description: "Thicker bars and stronger contrast for industrial printing",
    config: {
      format: "CODE128",
      dataType: "text",
      barShape: "square",
      colorMode: "single",
      color1: "#0F172A",
      bgColor: "#F8FAFC",
      height: 140,
      barWidth: 3,
      margin: 20,
    },
  },
  {
    name: "Soft Rounded",
    description: "Rounded bars with a cleaner branded label feel",
    config: {
      format: "CODE128",
      barShape: "rounded",
      colorMode: "single",
      color1: "#1D4ED8",
      bgColor: "#FFFFFF",
      height: 112,
      barWidth: 2,
    },
  },
  {
    name: "Gradient Premium",
    description: "Editorial gradient look for packaging and product cards",
    config: {
      format: "CODE93",
      barShape: "pill",
      colorMode: "gradient",
      color1: "#0F766E",
      color2: "#2563EB",
      bgColor: "#F8FAFC",
      gradientAngle: 90,
      height: 128,
      barWidth: 2,
    },
  },
  {
    name: "Shipping Carton",
    description: "ITF-14 configuration tuned for outer-box logistics labels",
    config: {
      format: "ITF14",
      dataType: "product",
      barShape: "square",
      colorMode: "single",
      color1: "#111827",
      bgColor: "#FFFFFF",
      height: 96,
      barWidth: 3,
      flat: true,
    },
  },
  {
    name: "Shelf Compact",
    description: "Tighter barcode block for narrow labels and smaller cards",
    config: {
      format: "EAN8",
      dataType: "product",
      barShape: "square",
      colorMode: "single",
      color1: "#7C2D12",
      bgColor: "#FFFBEB",
      height: 92,
      barWidth: 2,
      fontSize: 16,
    },
  },
];

export function applyBarcodePreset(current: BarcodeConfig, preset: BarcodePreset): BarcodeConfig {
  return { ...current, ...preset.config };
}
