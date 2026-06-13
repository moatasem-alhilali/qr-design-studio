import { QRConfig } from '@/lib/qr-engine';
import { analyzeScanReliability } from '@/lib/scan-reliability';
import { FrameConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface ScanReliabilityPanelProps {
  config: QRConfig;
  frame?: FrameConfig;
}

const gradeColors: Record<string, string> = {
  Excellent: 'text-success border-success/30 bg-success/10',
  Good: 'text-primary border-primary/30 bg-primary/10',
  Warning: 'text-warning border-warning/30 bg-warning/10',
  Risky: 'text-destructive border-destructive/30 bg-destructive/10',
};

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

export function ScanReliabilityPanel({ config, frame }: ScanReliabilityPanelProps) {
  const result = analyzeScanReliability(config, frame);

  return (
    <div className="space-y-3">
      <div className={cn("flex items-center gap-3 rounded-lg border p-3", gradeColors[result.grade])}>
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold text-sm">{result.grade}</p>
          <p className="text-xs opacity-80">Reliability score: {result.score}/100</p>
        </div>
      </div>

      {result.issues.length > 0 && (
        <div className="space-y-2">
          {result.issues.map((issue, i) => {
            const Icon = severityIcons[issue.severity];
            return (
              <div key={i} className="flex gap-2 text-xs rounded-lg border border-border p-2">
                <Icon className={cn(
                  "h-3.5 w-3.5 shrink-0 mt-0.5",
                  issue.severity === 'error' ? 'text-destructive' : issue.severity === 'warning' ? 'text-warning' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="font-medium text-foreground">{issue.message}</p>
                  <p className="text-muted-foreground">{issue.suggestion}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {result.issues.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">No issues found. Your QR code should scan reliably.</p>
      )}
    </div>
  );
}
