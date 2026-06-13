import { useMemo, useState } from "react";

import type { BatchItem } from "@/lib/types";
import { createBatchRow } from "../services/batch-rows";

export function useBatchRows() {
  const [rows, setRows] = useState<BatchItem[]>([]);

  const validRows = useMemo(() => rows.filter((row) => row.data.trim()), [rows]);

  const addRow = () => {
    setRows((prev) => [...prev, createBatchRow()]);
  };

  const addRows = (items: BatchItem[]) => {
    setRows((prev) => [...prev, ...items]);
  };

  const updateRow = (id: string, updates: Partial<BatchItem>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const clearRows = () => {
    setRows([]);
  };

  return {
    rows,
    validRows,
    addRow,
    addRows,
    updateRow,
    removeRow,
    clearRows,
  };
}
