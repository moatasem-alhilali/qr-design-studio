import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface BenchDrawerProps {
  title: string;
  /** Short right-aligned summary of the current setting, e.g. "Rounded · H". */
  readout?: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  tape?: "yellow" | "cyan" | "magenta";
  children: ReactNode;
}

const tapeClass = {
  yellow: "",
  cyan: "tape-cyan",
  magenta: "tape-magenta",
} as const;

/**
 * A drawer in the workbench. Everything stays on one continuous surface —
 * drawers separate the tools without turning each group into a floating card,
 * and several can be open at once so nothing is ever hidden behind a tab.
 */
export function BenchDrawer({ title, readout, icon, defaultOpen = false, tape = "yellow", children }: BenchDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="px-4">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="group flex w-full items-center gap-3 py-3.5 text-start"
        >
          <span className={cn("tape shrink-0", tapeClass[tape])}>
            {icon}
            {title}
          </span>

          {readout && (
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-faint">{readout}</span>
          )}

          <ChevronDown
            className={cn(
              "ms-auto h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </h2>

      {open && (
        <div id={panelId} className="pb-5">
          {children}
        </div>
      )}

      <hr className="perf" />
    </section>
  );
}
