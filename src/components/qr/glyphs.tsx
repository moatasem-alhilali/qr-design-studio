import type { CornerStyle, ModuleStyle } from "@/lib/qr-engine";

/**
 * Type specimens for the shape pickers.
 *
 * A printer chooses a face by looking at a proof of the actual letterform, not
 * at a generic icon. These draw the real module and finder geometry the engine
 * will use, so the picker is a specimen sheet rather than a row of lucide
 * placeholders that resemble nothing you are about to print.
 */

const BOX = 22;
const C = BOX / 2;

function starPoints(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ");
}

function heartPath(cx: number, cy: number, s: number) {
  const top = cy - s * 0.2;
  return [
    `M ${cx} ${cy + s * 0.45}`,
    `C ${cx + s} ${cy - s * 0.1}, ${cx + s * 0.75} ${top - s * 0.75}, ${cx} ${top - s * 0.1}`,
    `C ${cx - s * 0.75} ${top - s * 0.75}, ${cx - s} ${cy - s * 0.1}, ${cx} ${cy + s * 0.45}`,
    "Z",
  ].join(" ");
}

export function ModuleGlyph({ style }: { style: ModuleStyle }) {
  const shape = () => {
    switch (style) {
      case "square":
        return <rect x="3" y="3" width="16" height="16" />;
      case "tiny-squares":
        return <rect x="6" y="6" width="10" height="10" />;
      case "rounded":
        return <rect x="3" y="3" width="16" height="16" rx="4.8" />;
      case "extra-rounded":
        return <rect x="3" y="3" width="16" height="16" rx="8" />;
      case "dots":
        return <circle cx={C} cy={C} r="8" />;
      case "diamond":
        return <polygon points={`${C},2.5 19.5,${C} ${C},19.5 2.5,${C}`} />;
      case "triangle":
        return <polygon points={`${C},3 19.5,19 2.5,19`} />;
      case "star":
        return <polygon points={starPoints(C, C, 9.5, 4.3)} />;
      case "heart":
        return <path d={heartPath(C, C + 1, 8.2)} />;
      case "bubble":
        return (
          <>
            <circle cx={C} cy={C} r="8.2" />
            <circle cx={C - 2.6} cy={C - 2.6} r="2.4" fill="hsl(var(--paper))" opacity="0.55" />
          </>
        );
      default:
        return <rect x="3" y="3" width="16" height="16" />;
    }
  };

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} className="h-[22px] w-[22px]" fill="currentColor" aria-hidden>
      {shape()}
    </svg>
  );
}

export function CornerGlyph({ style }: { style: CornerStyle }) {
  /** Outer ring geometry, then the pupil at the centre. */
  const spec: Record<CornerStyle, { rx: number; ring: number; pupil: "square" | "round" | "leaf"; dotted?: boolean }> = {
    square: { rx: 0, ring: 3, pupil: "square" },
    rounded: { rx: 5, ring: 3, pupil: "square" },
    circle: { rx: 0, ring: 3, pupil: "round" },
    thick: { rx: 0, ring: 4.6, pupil: "square" },
    minimal: { rx: 3, ring: 1.6, pupil: "square" },
    decorative: { rx: 6, ring: 3, pupil: "round" },
    ring: { rx: 4, ring: 2.4, pupil: "round" },
    leaf: { rx: 5, ring: 3, pupil: "leaf" },
    "frame-dots": { rx: 10, ring: 2.6, pupil: "round", dotted: true },
  };

  const { rx, ring, pupil, dotted } = spec[style];
  const inset = ring / 2 + 1;

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} className="h-[22px] w-[22px]" aria-hidden>
      <rect
        x={inset}
        y={inset}
        width={BOX - inset * 2}
        height={BOX - inset * 2}
        rx={rx}
        fill="none"
        stroke="currentColor"
        strokeWidth={ring}
        strokeDasharray={dotted ? "0.1 3.6" : undefined}
        strokeLinecap={dotted ? "round" : undefined}
      />
      {pupil === "square" && <rect x={C - 3} y={C - 3} width="6" height="6" rx={rx ? 1.6 : 0} fill="currentColor" />}
      {pupil === "round" && <circle cx={C} cy={C} r="3.2" fill="currentColor" />}
      {pupil === "leaf" && (
        <path
          d={`M ${C} ${C - 3.4} Q ${C + 3.4} ${C} ${C} ${C + 3.4} Q ${C - 3.4} ${C} ${C} ${C - 3.4} Z`}
          fill="currentColor"
        />
      )}
    </svg>
  );
}
