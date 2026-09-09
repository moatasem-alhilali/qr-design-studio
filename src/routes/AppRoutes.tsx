import type { ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import BatchPage from "@/pages/BatchPage";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Register from "@/pages/Register";
import Settings from "@/pages/Settings";
import Templates from "@/pages/Templates";
import { VisitorAnalyticsTracker } from "@/features/analytics";

function withAppLayout(page: ReactNode) {
  return <AppLayout>{page}</AppLayout>;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <VisitorAnalyticsTracker />
      <Routes>
        <Route path="/" element={withAppLayout(<Index />)} />
        <Route path="/templates" element={withAppLayout(<Templates />)} />
        <Route path="/batch" element={withAppLayout(<BatchPage />)} />
        <Route path="/settings" element={withAppLayout(<Settings />)} />
        <Route path="/login" element={withAppLayout(<Login />)} />
        <Route path="/register" element={withAppLayout(<Register />)} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
