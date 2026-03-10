import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import AnalyticsPage from "./pages/AnalyticsPage";
import BatchPage from "./pages/BatchPage";
import Settings from "./pages/Settings";
import Redirect from "./pages/Redirect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/r/:code" element={<Redirect />} />
            <Route path="/auth" element={<AppLayout><Auth /></AppLayout>} />
            <Route path="/" element={<AppLayout><Index /></AppLayout>} />
            <Route path="/templates" element={<AppLayout><Templates /></AppLayout>} />
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/analytics" element={<AppLayout><AnalyticsPage /></AppLayout>} />
            <Route path="/analytics/:id" element={<AppLayout><AnalyticsPage /></AppLayout>} />
            <Route path="/batch" element={<AppLayout><BatchPage /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
