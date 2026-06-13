import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsConsentBanner } from "@/features/analytics";
import { I18nProvider } from "@/shared/i18n/i18n";
import { WebMcpTools } from "@/shared/agent-readiness/WebMcpTools";
import { createAppQueryClient } from "./query-client";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <WebMcpTools />
          <Toaster />
          <Sonner />
          {children}
          <AnalyticsConsentBanner />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
