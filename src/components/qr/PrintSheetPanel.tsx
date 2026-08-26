import { useMemo, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import type { QRConfig } from "@/lib/qr-engine";
import {
  defaultPrintSheetOptions,
  exportPrintSheet,
  planPrintSheet,
  type PageSize,
  type PrintSheetOptions,
} from "@/lib/qr-print-sheet";
import { Tool } from "@/components/workshop/Tool";
import { Dial } from "@/components/workshop/Dial";
import { Stamp } from "@/components/workshop/Stamp";
import { useI18n } from "@/shared/i18n/i18n";

const PAGE_SIZES: PageSize[] = ["a4", "letter", "a3"];

/**
 * Imposition controls: how many copies of this design go on one press sheet,
 * at what physical size, with the crop marks a guillotine needs. The live
 * "N per page" readout means you never export a sheet to find out it was wrong.
 */
export function PrintSheetPanel({ config }: { config: QRConfig }) {
  const { t } = useI18n();
  const [options, setOptions] = useState<PrintSheetOptions>(defaultPrintSheetOptions);
  const [busy, setBusy] = useState(false);

  const plan = useMemo(() => planPrintSheet(options), [options]);

  const patch = (updates: Partial<PrintSheetOptions>) =>
    setOptions((current) => ({ ...current, ...updates }));

  const handleExport = async () => {
    if (busy) return;
    if (plan.perPage === 0) {
      toast.error(t.home.sheetTooSmall);
      return;
    }
    setBusy(true);
    try {
      const result = await exportPrintSheet({ items: [{ config }], options, copies: plan.perPage });
      toast.success(`${t.home.sheetDone} — ${result.placed}`);
    } catch {
      toast.error(t.home.sheetTooSmall);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 px-4 py-5 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="spec">{t.home.printSheet}</span>
        <span className="font-mono text-[11px] text-ink">
          <strong className="tabular-nums">{plan.perPage}</strong>{" "}
          <span className="text-ink-faint">
            {t.home.perPage} ({plan.columns}×{plan.rows})
          </span>
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="spec">{t.home.pageSize}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {PAGE_SIZES.map((size) => (
            <Tool key={size} wide on={options.pageSize === size} onClick={() => patch({ pageSize: size })}>
              <span className="uppercase">{size}</span>
            </Tool>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-5">
        <Dial
          value={options.cellSizeMm}
          min={10}
          max={120}
          step={1}
          onChange={(cellSizeMm) => patch({ cellSizeMm })}
          label={t.home.codeSize}
          unit="mm"
          size={84}
        />
        <Dial
          value={options.gutterMm}
          min={0}
          max={30}
          step={1}
          onChange={(gutterMm) => patch({ gutterMm })}
          label={t.home.gutter}
          unit="mm"
          size={84}
        />
        <Dial
          value={options.marginMm}
          min={0}
          max={40}
          step={1}
          onChange={(marginMm) => patch({ marginMm })}
          label={t.home.margin}
          unit="mm"
          size={84}
        />
      </div>

      <Tool
        wide
        className="w-full"
        on={options.cropMarks}
        onClick={() => patch({ cropMarks: !options.cropMarks })}
      >
        {t.home.cropMarks}
      </Tool>

      <div className="flex justify-end">
        <Stamp solid onClick={handleExport} disabled={busy || plan.perPage === 0}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
          {t.home.exportSheet}
        </Stamp>
      </div>
    </div>
  );
}
