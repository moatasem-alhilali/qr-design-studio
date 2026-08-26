import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SheetProps {
  children: ReactNode;
  className?: string;
  /** Print registration crosshairs in the trim corners. */
  marks?: boolean;
  /** Tape strip stuck across the top edge. */
  label?: ReactNode;
  /** Colour of the tape strip. */
  tape?: "yellow" | "cyan" | "magenta";
  /** Slight rotation, because nothing on a bench is perfectly square. */
  askew?: 0 | 1 | 2 | 3;
}

const tapeClass = {
  yellow: "",
  cyan: "tape-cyan",
  magenta: "tape-magenta",
} as const;

const askewClass = ["", "askew-1", "askew-2", "askew-3"] as const;

/**
 * A sheet of stock lying on the desk. Grain, contact shadow and cast shadow
 * come from the `.sheet` component class; this adds the printer's furniture.
 */
export function Sheet({ children, className, marks = false, label, tape = "yellow", askew = 0 }: SheetProps) {
  return (
    <div className={cn("sheet", askewClass[askew], className)}>
      {marks && (
        <>
          <span className="reg-mark -start-2 -top-2" aria-hidden />
          <span className="reg-mark -end-2 -top-2" aria-hidden />
          <span className="reg-mark -bottom-2 -start-2" aria-hidden />
          <span className="reg-mark -bottom-2 -end-2" aria-hidden />
        </>
      )}

      {label && (
        <div className="pointer-events-none absolute -top-2.5 start-4 z-10">
          <span className={cn("tape", tapeClass[tape])}>{label}</span>
        </div>
      )}

      {children}
    </div>
  );
}
