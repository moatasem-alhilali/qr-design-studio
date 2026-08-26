import { AlertCircle, AlertTriangle, Info } from "lucide-react";

import { QRConfig } from "@/lib/qr-engine";
import { analyzeScanReliability } from "@/lib/scan-reliability";
import { FrameConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { translateReliabilityGrade, translateReliabilityText, useI18n } from "@/shared/i18n/i18n";

interface ScanReliabilityPanelProps {
  config: QRConfig;
  frame?: FrameConfig;
}

const gradeInk: Record<string, string> = {
  Excellent: "hsl(var(--success))",
  Good: "hsl(var(--press-cyan))",
  Warning: "hsl(var(--warning))",
  Risky: "hsl(var(--destructive))",
};

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

/**
 * The press check. A pressman pulls a sheet, measures density and signs it off
 * — so the score reads as a density gauge and an inspection docket, not as a
 * progress bar in a card.
 */
export function ScanReliabilityPanel({ config, frame }: ScanReliabilityPanelProps) {
  const { locale, t } = useI18n();
  const result = analyzeScanReliability(config, frame);
  const ink = gradeInk[result.grade] ?? "hsl(var(--ink))";

  return (
    <div className="space-y-3">
      <div className="sheet-sunk flex items-center gap-4 p-3">
        {/* Density gauge: a filled column, like an ink-key readout. */}
        <div
          className="relative h-14 w-8 shrink-0 overflow-hidden rounded-[2px]"
          style={{ background: "hsl(var(--ink) / 0.1)" }}
          aria-hidden
        >
          <div
            className="absolute inset-x-0 bottom-0 transition-[height] duration-300"
            style={{ height: `${result.score}%`, background: ink }}
          />
          {[25, 50, 75].map((mark) => (
            <span
              key={mark}
              className="absolute inset-x-0 h-px"
              style={{ bottom: `${mark}%`, background: "hsl(var(--paper) / 0.6)" }}
            />
          ))}
        </div>

        <div className="min-w-0">
          <p className="plate-title text-lg leading-none" style={{ color: ink }}>
            {translateReliabilityGrade(locale, result.grade)}
          </p>
          <p className="spec mt-1.5">{t.qrControls.reliabilityScore}</p>
          <p className="font-mono text-sm font-semibold tabular-nums text-ink">
            {result.score}
            <span className="text-ink-faint">/100</span>
          </p>
        </div>
      </div>

      {result.issues.length > 0 ? (
        <ul className="space-y-0">
          {result.issues.map((issue, index) => {
            const Icon = severityIcons[issue.severity];
            return (
              <li key={index} className="flex gap-2.5 py-2.5">
                <Icon
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    issue.severity === "error"
                      ? "text-destructive"
                      : issue.severity === "warning"
                        ? "text-warning"
                        : "text-ink-faint",
                  )}
                />
                <div className="min-w-0 text-xs leading-snug">
                  <p className="font-medium text-ink">{translateReliabilityText(locale, issue.message)}</p>
                  <p className="mt-0.5 text-ink-mid">{translateReliabilityText(locale, issue.suggestion)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-2 text-center text-xs text-ink-mid">{t.qrControls.noIssues}</p>
      )}
    </div>
  );
}
