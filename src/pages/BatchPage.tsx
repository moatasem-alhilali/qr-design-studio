import { useState, useRef } from 'react';
import { QRConfig, defaultConfig, generateQRMatrix, renderQRToCanvas } from '@/lib/qr-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, Plus, Trash2, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import { BatchItem } from '@/lib/types';

export default function BatchPage() {
  const [rows, setRows] = useState<BatchItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addRow = () => setRows(prev => [...prev, { id: crypto.randomUUID(), data: '', label: '', status: 'pending' }]);

  const updateRow = (id: string, updates: Partial<BatchItem>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const newRows: BatchItem[] = lines.slice(1).map(line => {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        return { id: crypto.randomUUID(), data: parts[0] || '', label: parts[1] || parts[0] || '', status: 'pending' as const };
      });
      setRows(prev => [...prev, ...newRows]);
      toast.success(`Imported ${newRows.length} rows`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePasteMultiple = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 1) {
      const newRows: BatchItem[] = lines.map(line => ({
        id: crypto.randomUUID(), data: line.trim(), label: line.trim().slice(0, 30), status: 'pending' as const,
      }));
      setRows(prev => [...prev, ...newRows]);
      return true;
    }
    return false;
  };

  const generateAll = async () => {
    if (rows.length === 0) { toast.error('Add some data first'); return; }
    setGenerating(true);
    const zip = new JSZip();
    const canvas = document.createElement('canvas');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.data.trim()) {
        updateRow(row.id, { status: 'error', error: 'Empty data' });
        continue;
      }
      try {
        const config: QRConfig = { ...defaultConfig, data: row.data };
        const matrix = generateQRMatrix(config);
        renderQRToCanvas(canvas, matrix, config);
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(b => resolve(b!), 'image/png');
        });
        const filename = `${row.label || `qr-${i + 1}`}.png`.replace(/[^a-zA-Z0-9._-]/g, '_');
        zip.file(filename, blob);
        updateRow(row.id, { status: 'completed' });
      } catch {
        updateRow(row.id, { status: 'error', error: 'Generation failed' });
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'qr-codes-batch.zip';
    link.click();
    URL.revokeObjectURL(link.href);
    setGenerating(false);
    toast.success('Batch generated and downloaded!');
  };

  const validRows = rows.filter(r => r.data.trim());

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
            <Button variant="outline" onClick={() => setRows([])}>Clear All</Button>
          )}
        </div>
      </div>
    </div>
  );
}
