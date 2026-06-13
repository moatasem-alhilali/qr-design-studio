import { useNavigate } from "react-router-dom";

import type { QRTemplate } from "@/lib/types";

export function useApplyTemplate() {
  const navigate = useNavigate();

  return (template: QRTemplate) => {
    const params = new URLSearchParams({ template: template.id });
    navigate(`/?${params.toString()}`);
  };
}
