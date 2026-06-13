import { useState, useRef, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, Plus, Trash2, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBatchRows } from '@/features/batch/hooks/useBatchRows';
import {
  downloadBlob,
  generateBatchZip,
  parseCsvRows,
  parsePastedRows,
} from '@/features/batch/services/batch-rows';

export default function BatchPage() {
  const { rows, validRows, addRow, addRows, updateRow, removeRow, clearRows } = useBatchRows();
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newRows = parseCsvRows(await file.text());
      addRows(newRows);
      toast.success(`Imported ${newRows.length} rows`);
    } catch {
      toast.error('Could not import file');
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
    if (rows.length === 0) { toast.error('Add some data first'); return; }
    setGenerating(true);
    try {
      const zipBlob = await generateBatchZip(rows, updateRow);
      downloadBlob(zipBlob, 'qr-codes-batch.zip');
      toast.success('Batch generated and downloaded!');
    } catch {
      toast.error('Batch generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Batch Generator</h1>
        <p className="text-muted-foreground">Generate multiple QR codes at once. Upload a CSV or add rows manually.</p>
      </div>

      <div className="space-y-6">
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add Row
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" />
          <p className="text-xs text-muted-foreground self-center">CSV format: data,label (one per line)</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick Paste (one URL per line)</Label>
          <Textarea
            placeholder="Paste multiple URLs here, one per line..."
            rows={3}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (handlePasteMultiple(text)) e.preventDefault();
            }}
          />
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{rows.length} items · {validRows.length} valid</Label>
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {rows.map((row, i) => (
                <div key={row.id} className={cn(
                  "flex items-center gap-2 rounded-lg border p-2",
                  row.status === 'completed' ? 'border-success/30 bg-success/5' : row.status === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                )}>
                  <span className="text-xs text-muted-foreground w-6 text-center">{i + 1}</span>
                  <Input value={row.data} onChange={e => updateRow(row.id, { data: e.target.value })} placeholder="URL or data" className="flex-1 h-8 text-xs" />
                  <Input value={row.label} onChange={e => updateRow(row.id, { label: e.target.value })} placeholder="Label" className="w-32 h-8 text-xs" />
                  {row.status === 'completed' && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                  {row.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeRow(row.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={generateAll} disabled={generating || validRows.length === 0} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {generating ? 'Generating...' : `Generate ${validRows.length} QR Codes`}
          </Button>
          {rows.length > 0 && (
            <Button variant="outline" onClick={clearRows}>Clear All</Button>
          )}
        </div>
      </div>
    </div>
  );
}
