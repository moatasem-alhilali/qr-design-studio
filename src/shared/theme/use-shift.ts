import { useCallback, useEffect, useState } from "react";

/**
 * Day shift works under the window; night shift is the darkroom, lit by a
 * safelight. Both palettes are defined in `index.css`; this only decides which
 * one is mounted on <html>.
 */
export type Shift = "day" | "night";

const SHIFT_STORAGE_KEY = "qr_design_studio_shift:v1";

function readStoredShift(): Shift | null {
  try {
    const stored = localStorage.getItem(SHIFT_STORAGE_KEY);
    return stored === "day" || stored === "night" ? stored : null;
  } catch {
    return null;
  }
}

function resolveInitialShift(): Shift {
  if (typeof window === "undefined") return "day";
  const stored = readStoredShift();
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

export function useShift() {
  const [shift, setShift] = useState<Shift>(resolveInitialShift);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", shift === "night");
    try {
      localStorage.setItem(SHIFT_STORAGE_KEY, shift);
    } catch {
      // Private mode: the choice just does not survive a reload.
    }
  }, [shift]);

  const toggleShift = useCallback(() => {
    setShift((current) => (current === "day" ? "night" : "day"));
  }, []);

  return { shift, setShift, toggleShift };
}
