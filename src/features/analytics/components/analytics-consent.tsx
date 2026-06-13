import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "@/features/analytics/services/analytics-identifiers";

export default function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(() => getAnalyticsConsent());

  function choose(next: AnalyticsConsent): void {
    setAnalyticsConsent(next);
    setConsent(next);

    if (next === "accepted") {
      window.dispatchEvent(new Event("analytics-consent-accepted"));
    }
  }

  if (consent !== null) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="pointer-events-auto mx-auto max-w-md rounded-lg border border-border bg-card p-4 text-card-foreground shadow-lg">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" size={17} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Privacy-friendly analytics</p>
            <p className="mt-1.5 text-xs leading-6 text-muted-foreground">
              Help improve QR Design Studio with anonymous visit analytics. QR content,
              logos, exports, and private design data are never stored.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={() => choose("accepted")} className="min-h-10 flex-1">
            Allow
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => choose("declined")}
            className="min-h-10"
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
