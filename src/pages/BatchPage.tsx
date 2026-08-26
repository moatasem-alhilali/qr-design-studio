import { useState, useRef, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Upload, Plus, Trash2, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Sheet } from '@/components/workshop/Sheet';
import { Stamp } from '@/components/workshop/Stamp';
import { ColourBar } from '@/components/workshop/InkWell';
import { useBatchRows } from '@/features/batch/hooks/useBatchRows';
import {
  downloadBlob,
  generateBatchZip,
  parseCsvRows,
  parsePastedRows,
} from '@/features/batch/services/batch-rows';
import { useI18n } from '@/shared/i18n/i18n';

export default function BatchPage() {
  const { t } = useI18n();
  const { rows, validRows, addRow, addRows, updateRow, removeRow, clearRows } = useBatchRows();
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newRows = parseCsvRows(await file.text());
      addRows(newRows);
      toast.success(`${t.batch.importedRows} ${newRows.length} ${t.batch.rows}`);
    } catch {
      toast.error(t.batch.importFailed);
    }
    e.target.value = '';
  };

  const handlePasteMultiple = (text: string) => {
    const newRows = parsePastedRows(text);
    if (newRows.length <= 1) return false;
    addRows(newRows);
    return true;
  };

  const generateAll = async () => {
    if (rows.length === 0) { toast.error(t.batch.addSomeData); return; }
    setGenerating(true);
    try {
      const zipBlob = await generateBatchZip(rows, updateRow);
      downloadBlob(zipBlob, 'qr-codes-batch.zip');
      toast.success(t.batch.batchSuccess);
    } catch {
      toast.error(t.batch.batchFailed);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8">
      <header className="mb-7 max-w-2xl">
        <p className="spec mb-2">{t.batch.items} · {t.batch.qrCodes}</p>
        <h1 className="plate-title letterpress text-[2.4rem] sm:text-[3rem]">{t.batch.title}</h1>
        <ColourBar className="my-4 max-w-[220px] opacity-80" />
        <p className="text-sm leading-relaxed text-ink-mid">{t.batch.description}</p>
      </header>

      {/* The run sheet: everything for one press run on a single docket. */}
      <Sheet marks label={t.batch.title} className="overflow-hidden">
        <div className="space-y-5 p-4 pt-8 sm:p-6 sm:pt-9">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="tool tool-wide px-3" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> {t.batch.importCsv}
            </button>
            <button type="button" className="tool tool-wide px-3" onClick={addRow}>
              <Plus className="h-4 w-4" /> {t.batch.addRow}
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" />
            <p className="font-mono text-[11px] text-ink-faint">{t.batch.csvFormat}</p>
          </div>

          <div className="space-y-2">
            <label className="spec block" htmlFor="batch-paste">{t.batch.quickPaste}</label>
            <textarea
              id="batch-paste"
              className="field resize-y"
              placeholder={t.batch.pastePlaceholder}
              rows={3}
              dir="ltr"
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                if (handlePasteMultiple(text)) e.preventDefault();
              }}
            />
          </div>

          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="spec">
                  {rows.length} {t.batch.items} · {validRows.length} {t.batch.valid}
                </p>
              </div>

              <div className="sheet-sunk max-h-[26rem] overflow-y-auto p-1.5">
                {rows.map((row, i) => (
                  <div
                    key={row.id}
                    className={cn(
                      'flex items-center gap-2 rounded-[2px] p-1.5',
                      row.status === 'completed' && 'bg-success/10',
                      row.status === 'error' && 'bg-destructive/10',
                    )}
                  >
                    <span className="w-7 shrink-0 text-center font-mono text-[11px] tabular-nums text-ink-faint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <input
                      className="field h-8 flex-1 py-0 text-xs"
                      value={row.data}
                      onChange={e => updateRow(row.id, { data: e.target.value })}
                      placeholder={t.batch.dataPlaceholder}
                      dir="ltr"
                    />
                    <input
                      className="field h-8 w-32 shrink-0 py-0 text-xs"
                      value={row.label}
                      onChange={e => updateRow(row.id, { label: e.target.value })}
                      placeholder={t.batch.labelPlaceholder}
                    />
                    {row.status === 'completed' && <CheckCircle className="h-4 w-4 shrink-0 text-success" />}
                    {row.status === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
                    <button
                      type="button"
                      className="tool shrink-0 px-2 py-1.5"
                      onClick={() => removeRow(row.id)}
                      aria-label={t.batch.clearAll}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <hr className="perf" />

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
          <span className="spec">{t.batch.generate}</span>
          <div className="flex flex-wrap items-center gap-3">
            {rows.length > 0 && (
              <button type="button" className="tool tool-wide px-3" onClick={clearRows}>
                {t.batch.clearAll}
              </button>
            )}
            <Stamp solid onClick={generateAll} disabled={generating || validRows.length === 0}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {generating ? t.batch.generating : `${t.batch.generate} ${validRows.length}`}
            </Stamp>
          </div>
        </div>

        <ColourBar />
      </Sheet>
    </div>
  );
}
