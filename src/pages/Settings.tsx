import { Info } from 'lucide-react';

export default function Settings() {
  return (
    <div className="container px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="panel-section space-y-3">
          <h2 className="font-semibold text-foreground">Generation Mode</h2>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">Static QR and Barcode generation</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This build focuses on local QR and barcode generation without Firebase, authentication, cloud sync, dynamic redirects, or analytics.
          </p>
        </div>

        <div className="panel-section space-y-3">
          <h2 className="font-semibold text-foreground">About QR Design Studio</h2>
          <p className="text-sm text-muted-foreground">
            A professional code design studio for beautiful, customizable static QR codes and barcodes with templates and batch generation.
          </p>
          <p className="text-xs text-muted-foreground font-mono">Version 2.0</p>
        </div>
      </div>
    </div>
  );
}
