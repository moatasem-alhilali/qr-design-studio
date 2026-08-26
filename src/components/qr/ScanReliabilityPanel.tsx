import { useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, ScanLine, XCircle } from "lucide-react";

import { QRConfig } from "@/lib/qr-engine";
import { analyzeScanReliability } from "@/lib/scan-reliability";
import { isVerificationSupported, verifyQR, type VerifyResult } from "@/lib/qr-verify";
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

  /*
    The score above is a heuristic. This actually decodes the rendered symbol
    and compares it with the payload — the difference between "should scan"
    and "did scan", which is what matters once a logo covers the centre.
  */
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [checking, setChecking] = useState(false);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!isVerificationSupported()) {
      setVerify({ status: "unsupported" });
      return;
    }

    const runId = ++runIdRef.current;
    setChecking(true);
    // Debounced: decoding on every keystroke would be wasteful.
    const timer = window.setTimeout(async () => {
      const outcome = await verifyQR(config);
      if (runIdRef.current !== runId) return;
      setVerify(outcome);
      setChecking(false);
    }, 450);

    return () => {
      window.clearTimeout(timer);
      if (runIdRef.current === runId) setChecking(false);
    };
  }, [config]);

  return (
    <div className="space-y-3">
      <VerifyBadge result={verify} checking={checking} t={t} />
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

/** The press-check stamp: did the code actually read back? */
function VerifyBadge({
  result,
  checking,
  t,
}: {
  result: VerifyResult | null;
  checking: boolean;
  t: ReturnType<typeof useI18n>["t"];
}) {
  if (checking || !result) {
    return (
      <p className="flex items-center gap-2 text-xs text-ink-mid">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t.home.verifying}
      </p>
    );
  }

  if (result.status === "unsupported") {
    return (
      <p className="flex items-center gap-2 text-xs text-ink-faint">
        <ScanLine className="h-3.5 w-3.5" />
        {t.home.verifyUnsupported}
      </p>
    );
  }

  const presentation = {
    verified: { icon: CheckCircle2, tone: "hsl(var(--success))", title: t.home.verified, hint: t.home.verifiedHint },
    mismatch: { icon: XCircle, tone: "hsl(var(--destructive))", title: t.home.verifyMismatch, hint: t.home.verifyUnreadableHint },
    unreadable: { icon: XCircle, tone: "hsl(var(--destructive))", title: t.home.verifyUnreadable, hint: t.home.verifyUnreadableHint },
    error: { icon: AlertTriangle, tone: "hsl(var(--warning))", title: t.home.verifyUnreadable, hint: t.home.verifyUnreadableHint },
  }[result.status];

  const Icon = presentation.icon;

  return (
    <div
      className="flex items-start gap-2.5 rounded-[3px] p-2.5"
      style={{ background: `color-mix(in srgb, ${presentation.tone} 12%, transparent)` }}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: presentation.tone }} />
      <div className="min-w-0 text-xs leading-snug">
        <p className="font-semibold" style={{ color: presentation.tone }}>
          {presentation.title}
        </p>
        <p className="mt-0.5 text-ink-mid">{presentation.hint}</p>
      </div>
    </div>
  );
}
