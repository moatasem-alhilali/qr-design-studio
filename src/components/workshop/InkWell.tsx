import { useId } from "react";

import { cn } from "@/lib/utils";

interface InkWellProps {
  value: string;
  onChange: (hex: string) => void;
  label: string;
  /** Renders the well as empty stock (checkerboard) and stops colour edits. */
  empty?: boolean;
  disabled?: boolean;
  size?: number;
  className?: string;
}

const CHECKER =
  "repeating-conic-gradient(hsl(var(--ink) / 0.14) 0% 25%, transparent 0% 50%) 50% / 8px 8px";

/**
 * A pot of process ink. The colour sits in a recessed well with a wet meniscus
 * highlight and a rim shadow; clicking anywhere on the pot opens the native
 * colour picker through a transparent input laid over it.
 */
export function InkWell({ value, onChange, label, empty = false, disabled = false, size = 44, className }: InkWellProps) {
  const id = useId();

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(180deg, hsl(var(--paper-edge)), hsl(var(--paper-sunk)))",
          boxShadow:
            "0 1px 0 hsl(var(--lit) / 0.7), 0 2px 4px hsl(var(--cast) / 0.3), 0 5px 12px -6px hsl(var(--cast) / 0.5)",
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {/* The ink itself, sunk into the pot */}
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: 5,
            background: empty ? CHECKER : value,
            boxShadow:
              "0 2px 5px hsl(var(--cast) / 0.55) inset, 0 -1px 2px hsl(var(--lit) / 0.25) inset",
          }}
        />
        {/* Wet meniscus */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            top: size * 0.18,
            insetInlineStart: size * 0.22,
            width: size * 0.26,
            height: size * 0.16,
            background: "hsl(0 0% 100% / 0.4)",
            filter: "blur(1.5px)",
          }}
        />
        <input
          id={id}
          type="color"
          value={value}
          disabled={disabled || empty}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0 disabled:cursor-not-allowed"
        />
      </div>

      <label htmlFor={id} className="spec cursor-pointer text-center leading-tight">
        {label}
      </label>
      <span className="font-mono text-[10px] leading-none text-ink-faint">
        {empty ? "—" : value.toUpperCase()}
      </span>
    </div>
  );
}

/** The CMYK control strip printers put in the trim area of every sheet. */
export function ColourBar({ className }: { className?: string }) {
  return (
    <div className={cn("colour-bar", className)} aria-hidden>
      <i style={{ background: "hsl(var(--press-cyan))" }} />
      <i style={{ background: "hsl(var(--press-magenta))" }} />
      <i style={{ background: "hsl(var(--press-yellow))" }} />
      <i style={{ background: "hsl(var(--ink))" }} />
    </div>
  );
}
