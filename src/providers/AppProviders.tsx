import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsConsentBanner } from "@/features/analytics";
import { AuthProvider } from "@/features/auth/auth-context";
import { ProjectsProvider } from "@/features/projects/projects-context";
import { I18nProvider, useI18n } from "@/shared/i18n/i18n";
import { WebMcpTools } from "@/shared/agent-readiness/WebMcpTools";
import { createAppQueryClient } from "./query-client";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <LocalisedProjectsProvider>
            <TooltipProvider>
              <WebMcpTools />
              <Toaster />
              <Sonner />
              {children}
              <AnalyticsConsentBanner />
            </TooltipProvider>
          </LocalisedProjectsProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

/**
 * Sync may have to invent a project name for work done before signing in, and
 * that name is user-facing. Reading it here keeps the projects feature free of
 * translation lookups.
 */
function LocalisedProjectsProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return <ProjectsProvider newProjectName={t.projects.localWorkName}>{children}</ProjectsProvider>;
}
