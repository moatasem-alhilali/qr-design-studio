import { useCallback, useEffect, useState } from "react";

import { BarcodeConfig, defaultBarcodeConfig } from "@/lib/barcode-engine";
import { QRConfig, defaultConfig } from "@/lib/qr-engine";
import { defaultFrameConfig, FrameConfig } from "@/lib/types";
import { qrTemplates } from "@/lib/qr-templates";

export type DesignType = "qr" | "barcode";

export function useDesignerState() {
  const [designType, setDesignType] = useState<DesignType>("qr");
  const [config, setConfig] = useState<QRConfig>(defaultConfig);
  const [barcodeConfig, setBarcodeConfig] = useState<BarcodeConfig>(defaultBarcodeConfig);
  const [frameConfig, setFrameConfig] = useState<FrameConfig>(defaultFrameConfig);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const templateId = searchParams.get("template");
    if (!templateId) return;

    const template = qrTemplates.find((item) => item.id === templateId);
    if (!template) return;

    setConfig((prev) => ({
      ...prev,
      ...template.config,
      dataType: template.dataType,
      data: "",
    }));

    if (template.suggestedFrame) {
      setFrameConfig((prev) => ({
        ...prev,
        type: "simple",
        textBottom: template.suggestedFrame,
      }));
    }
  }, []);

  const handleChange = useCallback((updates: Partial<QRConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleFullChange = useCallback((newConfig: QRConfig) => {
    setConfig(newConfig);
  }, []);

  const handleBarcodeChange = useCallback((updates: Partial<BarcodeConfig>) => {
    setBarcodeConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleFullBarcodeChange = useCallback((newConfig: BarcodeConfig) => {
    setBarcodeConfig(newConfig);
  }, []);

  return {
    designType,
    config,
    barcodeConfig,
    frameConfig,
    setDesignType,
    setFrameConfig,
    handleChange,
    handleFullChange,
    handleBarcodeChange,
    handleFullBarcodeChange,
  };
}
