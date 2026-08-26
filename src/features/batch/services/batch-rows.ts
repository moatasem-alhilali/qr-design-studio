import JSZip from "jszip";

import { createHighResQRCanvas, defaultConfig, generateQRMatrix, QRConfig } from "@/lib/qr-engine";
import { exportPrintSheet, type PrintSheetOptions } from "@/lib/qr-print-sheet";
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

/**
 * Builds the config for one row.
 *
 * `design` is the styling the user actually set up in the studio. Batch used to
 * ignore it entirely and hard-code the defaults, so a carefully branded design
 * silently produced five hundred plain purple codes.
 */
function configForRow(row: BatchItem, design?: QRConfig): QRConfig {
  return { ...(design ?? defaultConfig), data: row.data };
}

export async function generateBatchZip(
  rows: BatchItem[],
  onRowUpdate: (id: string, updates: Partial<BatchItem>) => void,
  design?: QRConfig,
): Promise<Blob> {
  const zip = new JSZip();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (!row.data.trim()) {
      onRowUpdate(row.id, { status: "error", error: "Empty data" });
      continue;
    }

    try {
      // Print-resolution bitmap, with any logo fully painted before encoding.
      const canvas = await createHighResQRCanvas(configForRow(row, design));
      zip.file(filenameFor(row, index), await canvasToBlob(canvas));
      onRowUpdate(row.id, { status: "completed" });
    } catch {
      onRowUpdate(row.id, { status: "error", error: "Generation failed" });
    }
  }

  return zip.generateAsync({ type: "blob" });
}

/** Every valid row imposed onto printable sheets, as one vector PDF. */
export async function generateBatchPrintSheet(
  rows: BatchItem[],
  options: PrintSheetOptions,
  design?: QRConfig,
  filename = "qr-print-sheet.pdf",
): Promise<{ pages: number; placed: number }> {
  const items = rows
    .filter((row) => row.data.trim())
    .map((row) => ({ config: configForRow(row, design), caption: row.label }));

  if (!items.length) throw new Error("No valid rows");

  return exportPrintSheet({ items, options }, filename);
}

/** Cheap pre-flight so the UI can flag rows that will never encode. */
export function findUnencodableRows(rows: BatchItem[], design?: QRConfig): string[] {
  const broken: string[] = [];
  for (const row of rows) {
    if (!row.data.trim()) continue;
    try {
      generateQRMatrix(configForRow(row, design));
    } catch {
      broken.push(row.id);
    }
  }
  return broken;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
