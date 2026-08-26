import { useCallback, useId, useRef, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

interface DialProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  /** Rendered after the number in the readout, e.g. "px" or "°". */
  unit?: string;
  size?: number;
  className?: string;
}

/** Total sweep of the knob, centred on twelve o'clock. */
const SWEEP = 270;
const START = -SWEEP / 2;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * A machined rotary control. Grab it and turn — the angle of your pointer
 * around the centre is the value, exactly like a real knob, so the gesture is
 * absolute rather than a relative drag you can lose track of.
 *
 * It is also a proper ARIA slider: focusable, arrow keys, Home/End, and the
 * mouse wheel.
 */
export function Dial({ value, min, max, step, onChange, label, unit = "", size = 96, className }: DialProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const readoutId = useId();

  const ratio = (clamp(value, min, max) - min) / (max - min || 1);
  const angle = START + SWEEP * ratio;

  const snap = useCallback(
    (raw: number) => {
      const stepped = Math.round((raw - min) / step) * step + min;
      // Steps rarely divide the range evenly; keep one decimal at most.
      return clamp(Number(stepped.toFixed(4)), min, max);
    },
    [max, min, step],
  );

  const applyFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = knobRef.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const dx = clientX - (box.left + box.width / 2);
      const dy = clientY - (box.top + box.height / 2);
      // Degrees clockwise from twelve o'clock.
      const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
      const nextRatio = clamp((deg - START) / SWEEP, 0, 1);
      onChange(snap(min + nextRatio * (max - min)));
    },
    [max, min, onChange, snap],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    applyFromPointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    applyFromPointer(event.clientX, event.clientY);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const big = (max - min) / 10;
    const moves: Record<string, number | "min" | "max"> = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
      PageUp: big,
      PageDown: -big,
      Home: "min",
      End: "max",
    };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    if (move === "min") onChange(min);
    else if (move === "max") onChange(max);
    else onChange(snap(value + move));
  };

  const radius = size / 2;
  // Ticks around the sweep, denser near the ends of the travel.
  const ticks = Array.from({ length: 19 }, (_, i) => START + (SWEEP / 18) * i);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        ref={knobRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}${unit}`}
        aria-describedby={readoutId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        onWheel={(event) => onChange(snap(value + (event.deltaY < 0 ? step : -step)))}
        className="relative touch-none select-none"
        style={{ width: size, height: size, cursor: "grab" }}
      >
        {/* Tick collar engraved into the bench */}
        <svg width={size} height={size} className="absolute inset-0" aria-hidden>
          {ticks.map((tick, i) => {
            const rad = ((tick - 90) * Math.PI) / 180;
            const major = i % 3 === 0;
            const outer = radius - 1;
            const inner = radius - (major ? 7 : 4);
            const live = tick <= angle + 0.001;
            return (
              <line
                key={tick}
                x1={radius + Math.cos(rad) * inner}
                y1={radius + Math.sin(rad) * inner}
                x2={radius + Math.cos(rad) * outer}
                y2={radius + Math.sin(rad) * outer}
                stroke={live ? "hsl(var(--press-red))" : "hsl(var(--ink) / 0.28)"}
                strokeWidth={major ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* The knob itself: knurled rim, brushed cap, pointer notch */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 12,
            background:
              "conic-gradient(from 0deg, hsl(var(--paper-edge)) 0deg, hsl(var(--paper)) 8deg, hsl(var(--paper-edge)) 16deg)",
            boxShadow:
              "0 2px 5px hsl(var(--cast) / 0.45), 0 6px 14px -6px hsl(var(--cast) / 0.5), 0 1px 0 hsl(var(--lit) / 0.6) inset",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              inset: 5,
              background: "linear-gradient(150deg, hsl(var(--paper)) 0%, hsl(var(--paper-sunk)) 70%, hsl(var(--paper-edge)) 100%)",
              boxShadow: "0 1px 0 hsl(var(--lit) / 0.8) inset, 0 -2px 4px hsl(var(--cast) / 0.2) inset",
            }}
          />
          {/* Pointer notch — the only part that turns */}
          <div
            className="absolute inset-0 transition-transform duration-75"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <span
              className="absolute start-1/2 rounded-full"
              style={{
                top: 8,
                width: 3,
                height: size * 0.19,
                marginInlineStart: -1.5,
                background: "hsl(var(--press-red))",
                boxShadow: "0 0 0 1px hsl(var(--paper) / 0.7)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="text-center leading-none">
        <div id={readoutId} className="font-mono text-sm font-semibold text-ink tabular-nums">
          {value}
          <span className="text-ink-faint">{unit}</span>
        </div>
        <div className="spec mt-1">{label}</div>
      </div>
    </div>
  );
}
