import JSZip from "jszip";

import { defaultConfig, generateQRMatrix, QRConfig, renderQRToCanvas } from "@/lib/qr-engine";
import type { BatchItem } from "@/lib/types";

export function createBatchRow(data = "", label = ""): BatchItem {
  return {
    id: crypto.randomUUID(),
    data,
    label,
    status: "pending",
  };
}

export function parseCsvRows(text: string): BatchItem[] {
  const lines = text.split("\n").filter((line) => line.trim());
  return lines.slice(1).map((line) => {
    const parts = line.split(",").map((part) => part.trim().replace(/^"|"$/g, ""));
    const data = parts[0] || "";
    return createBatchRow(data, parts[1] || data);
  });
}

export function parsePastedRows(text: string): BatchItem[] {
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const data = line.trim();
      return createBatchRow(data, data.slice(0, 30));
    });
}

function filenameFor(row: BatchItem, index: number): string {
  return `${row.label || `qr-${index + 1}`}.png`.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed"));
    }, "image/png");
  });
}

export async function generateBatchZip(
  rows: BatchItem[],
  onRowUpdate: (id: string, updates: Partial<BatchItem>) => void,
): Promise<Blob> {
  const zip = new JSZip();
  const canvas = document.createElement("canvas");

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (!row.data.trim()) {
      onRowUpdate(row.id, { status: "error", error: "Empty data" });
      continue;
    }

    try {
      const config: QRConfig = { ...defaultConfig, data: row.data };
      const matrix = generateQRMatrix(config);
      renderQRToCanvas(canvas, matrix, config);
      zip.file(filenameFor(row, index), await canvasToBlob(canvas));
      onRowUpdate(row.id, { status: "completed" });
    } catch {
      onRowUpdate(row.id, { status: "error", error: "Generation failed" });
    }
  }

  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
