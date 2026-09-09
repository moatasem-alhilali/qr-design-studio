import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsConsentBanner } from "@/features/analytics";
import { AuthProvider } from "@/features/auth/auth-context";
import { ProjectsProvider } from "@/features/projects/projects-context";
import { I18nProvider } from "@/shared/i18n/i18n";
import { WebMcpTools } from "@/shared/agent-readiness/WebMcpTools";
import { createAppQueryClient } from "./query-client";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <ProjectsProvider>
            <TooltipProvider>
              <WebMcpTools />
              <Toaster />
              <Sonner />
              {children}
              <AnalyticsConsentBanner />
            </TooltipProvider>
          </ProjectsProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
