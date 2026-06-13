import type { ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import BatchPage from "@/pages/BatchPage";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import Templates from "@/pages/Templates";

function withAppLayout(page: ReactNode) {
  return <AppLayout>{page}</AppLayout>;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={withAppLayout(<Index />)} />
        <Route path="/templates" element={withAppLayout(<Templates />)} />
        <Route path="/batch" element={withAppLayout(<BatchPage />)} />
        <Route path="/settings" element={withAppLayout(<Settings />)} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
