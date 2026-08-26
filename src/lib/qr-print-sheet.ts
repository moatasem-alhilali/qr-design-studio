import { jsPDF } from "jspdf";

import { generateQRMatrix, type QRConfig } from "@/lib/qr-engine";
import { drawQRVector } from "@/lib/qr-vector-pdf";

/**
 * Imposition: laying many copies out on one press sheet with the marks a
 * guillotine operator needs. This is the step between "I designed a QR" and
 * "I have a page of stickers", and it is the reason the whole tool exists on
 * a bench rather than in a browser tab.
 */

export type PageSize = "a4" | "letter" | "a3";

/** Page dimensions in points (72 per inch). */
const PAGE_SIZES: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  a3: { width: 841.89, height: 1190.55 },
};

const MM_PER_PT = 25.4 / 72;

export interface PrintSheetOptions {
  pageSize: PageSize;
  /** Printed edge of one QR, in millimetres. */
  cellSizeMm: number;
  /** Gap between codes, in millimetres. */
  gutterMm: number;
  /** Page margin, in millimetres. */
  marginMm: number;
  cropMarks: boolean;
  /** Caption printed under each code. Empty disables it. */
  caption?: string;
}

export const defaultPrintSheetOptions: PrintSheetOptions = {
  pageSize: "a4",
  cellSizeMm: 40,
  gutterMm: 6,
  marginMm: 12,
  cropMarks: true,
  caption: "",
};

function mmToPt(mm: number): number {
  return mm / MM_PER_PT;
}

export interface SheetPlan {
  columns: number;
  rows: number;
  perPage: number;
  cellPt: number;
  pageWidth: number;
  pageHeight: number;
}

/** Works out how many codes fit, so the UI can show it before exporting. */
export function planPrintSheet(options: PrintSheetOptions): SheetPlan {
  const page = PAGE_SIZES[options.pageSize];
  const cellPt = mmToPt(Math.max(5, options.cellSizeMm));
  const gutterPt = mmToPt(Math.max(0, options.gutterMm));
  const marginPt = mmToPt(Math.max(0, options.marginMm));
  // Captions need a strip under each cell.
  const captionPt = options.caption ? 12 : 0;

  const usableWidth = page.width - marginPt * 2;
  const usableHeight = page.height - marginPt * 2;

  const columns = Math.max(0, Math.floor((usableWidth + gutterPt) / (cellPt + gutterPt)));
  const rows = Math.max(0, Math.floor((usableHeight + gutterPt) / (cellPt + captionPt + gutterPt)));

  return {
    columns,
    rows,
    perPage: columns * rows,
    cellPt,
    pageWidth: page.width,
    pageHeight: page.height,
  };
}

function drawCropMarks(pdf: jsPDF, x: number, y: number, size: number) {
  const arm = 6;
  const offset = 2.5;
  pdf.setDrawColor(120, 120, 120);
  pdf.setLineWidth(0.4);

  const corners: Array<[number, number, number, number]> = [
    // [cornerX, cornerY, xDirection, yDirection]
    [x, y, -1, -1],
    [x + size, y, 1, -1],
    [x, y + size, -1, 1],
    [x + size, y + size, 1, 1],
  ];

  for (const [cx, cy, dx, dy] of corners) {
    pdf.line(cx + dx * offset, cy, cx + dx * (offset + arm), cy);
    pdf.line(cx, cy + dy * offset, cx, cy + dy * (offset + arm));
  }
}

export interface PrintSheetInput {
  /** One entry per code. A single-entry list repeats to fill the page. */
  items: Array<{ config: QRConfig; caption?: string }>;
  options: PrintSheetOptions;
  /** Total codes to place when `items` holds a single repeated design. */
  copies?: number;
}

/**
 * Builds the imposed sheet. Everything is drawn as vector, so a page of 40
 * codes is still a small file and still prints at the plate's full resolution.
 */
export async function exportPrintSheet(
  { items, options, copies }: PrintSheetInput,
  filename = "qr-print-sheet.pdf",
): Promise<{ pages: number; placed: number }> {
  const plan = planPrintSheet(options);
  if (plan.perPage === 0) {
    throw new Error("Nothing fits: reduce the code size or the margins");
  }

  const queue = items.length > 1
    ? items
    : Array.from({ length: Math.max(1, copies ?? plan.perPage) }, () => items[0]);

  const pdf = new jsPDF({
    orientation: plan.pageWidth >= plan.pageHeight ? "landscape" : "portrait",
    unit: "pt",
    format: [plan.pageWidth, plan.pageHeight],
    compress: true,
  });

  const marginPt = mmToPt(Math.max(0, options.marginMm));
  const gutterPt = mmToPt(Math.max(0, options.gutterMm));
  const captionPt = options.caption ? 12 : 0;

  // One matrix per distinct payload; repeated designs reuse the same one.
  const matrixCache = new Map<string, ReturnType<typeof generateQRMatrix>>();
  const matrixFor = (config: QRConfig) => {
    const key = `${config.data}|${config.dataType}|${config.errorCorrection}|${config.logoUrl ? "H" : ""}`;
    const cached = matrixCache.get(key);
    if (cached) return cached;
    const built = generateQRMatrix(config);
    matrixCache.set(key, built);
    return built;
  };

  let placed = 0;
  let pages = 1;

  for (let index = 0; index < queue.length; index++) {
    const slot = index % plan.perPage;
    if (index > 0 && slot === 0) {
      pdf.addPage([plan.pageWidth, plan.pageHeight]);
      pages++;
    }

    const column = slot % plan.columns;
    const row = Math.floor(slot / plan.columns);
    const x = marginPt + column * (plan.cellPt + gutterPt);
    const y = marginPt + row * (plan.cellPt + captionPt + gutterPt);

    const item = queue[index];
    await drawQRVector(pdf, matrixFor(item.config), item.config, x, y, plan.cellPt);

    if (options.cropMarks) drawCropMarks(pdf, x, y, plan.cellPt);

    const caption = item.caption ?? options.caption;
    if (caption) {
      pdf.setFontSize(7);
      pdf.setTextColor(70, 70, 70);
      // jsPDF core fonts are Latin-only, so non-Latin captions are dropped
      // rather than rendered as garbage boxes.
      const printable = caption.replace(/[^\x20-\x7E]/g, "").trim();
      if (printable) pdf.text(printable, x + plan.cellPt / 2, y + plan.cellPt + 8, { align: "center" });
    }

    placed++;
  }

  pdf.save(filename);
  return { pages, placed };
}
