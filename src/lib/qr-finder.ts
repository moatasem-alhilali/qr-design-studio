import type { CornerStyle } from "./qr-engine";

/**
 * The three finder patterns, drawn as whole shapes.
 *
 * They used to be tiled module by module with a small gap around every tile.
 * Those gaps are thin light lines running through the dark ring and the dark
 * centre, and the ring's dark-light-dark-light-dark rhythm (1:1:3:1:1) is the
 * very first thing a decoder hunts for — so every gap made it look twice. A
 * finder drawn as one ring and one centre keeps that rhythm exact, which is
 * what lets a phone lock on the moment the code is in frame.
 *
 * Every renderer (canvas, SVG, vector PDF) draws from these same outlines, so
 * the three exports still match each other.
 */

/** Corner radii in modules: top-left, top-right, bottom-right, bottom-left. */
type Radii = [number, number, number, number];

interface FinderSpec {
  /** Outer edge of the 7×7 ring. */
  outer: Radii;
  /** Edge of the 5×5 light gap inside the ring. */
  hole: Radii;
  /** Edge of the 3×3 dark centre. */
  centre: Radii;
}

const all = (r: number): Radii => [r, r, r, r];

const SPECS: Partial<Record<CornerStyle, FinderSpec>> = {
  square: { outer: all(0), hole: all(0), centre: all(0) },
  thick: { outer: all(0), hole: all(0), centre: all(0) },
  // A true disc inside a square ring skews the diagonal a decoder cross-checks,
  // and measurably failed reads; a strongly rounded centre keeps the look and
  // reads as fast as the plain square.
  circle: { outer: all(0), hole: all(0), centre: all(0.8) },
  rounded: { outer: all(2), hole: all(1.2), centre: all(0.9) },
  minimal: { outer: all(1.1), hole: all(0.5), centre: all(0.5) },
  decorative: { outer: all(2.4), hole: all(1.6), centre: all(1.5) },
  ring: { outer: all(3.5), hole: all(2.5), centre: all(1.5) },
  leaf: { outer: [3, 0.6, 3, 0.6], hole: [2.2, 0.3, 2.2, 0.3], centre: [1.5, 0.2, 1.5, 0.2] },
};

/**
 * Whether this corner style is drawn as whole shapes. "Dotted" is left out on
 * purpose: its ring is made of separate dots by design, so it keeps the
 * per-module drawing and the reliability panel keeps flagging it as slower.
 */
export function hasSolidFinder(style: CornerStyle): boolean {
  return SPECS[style] !== undefined;
}

export type PathCommand =
  | { op: "M" | "L"; x: number; y: number }
  | { op: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { op: "Z" };

/** Bezier handle length that makes a quarter curve read as a circular arc. */
const KAPPA = 0.5523;

function roundedBox(x: number, y: number, side: number, radii: Radii, out: PathCommand[]): void {
  const [tl, tr, br, bl] = radii.map((r) => Math.max(0, Math.min(r, side / 2)));
  const right = x + side;
  const bottom = y + side;

  out.push({ op: "M", x: x + tl, y });
  out.push({ op: "L", x: right - tr, y });
  if (tr > 0) out.push({ op: "C", x1: right - tr + tr * KAPPA, y1: y, x2: right, y2: y + tr - tr * KAPPA, x: right, y: y + tr });
  out.push({ op: "L", x: right, y: bottom - br });
  if (br > 0) out.push({ op: "C", x1: right, y1: bottom - br + br * KAPPA, x2: right - br + br * KAPPA, y2: bottom, x: right - br, y: bottom });
  out.push({ op: "L", x: x + bl, y: bottom });
  if (bl > 0) out.push({ op: "C", x1: x + bl - bl * KAPPA, y1: bottom, x2: x, y2: bottom - bl + bl * KAPPA, x, y: bottom - bl });
  out.push({ op: "L", x, y: y + tl });
  if (tl > 0) out.push({ op: "C", x1: x, y1: y + tl - tl * KAPPA, x2: x + tl - tl * KAPPA, y2: y, x: x + tl, y });
  out.push({ op: "Z" });
}

/**
 * One finder pattern as a single path to fill with the even-odd rule: the
 * outer edge, the hole (which even-odd turns into the light gap) and the
 * centre. `x`/`y` is the finder's top-left corner, `cell` one module.
 */
export function finderPath(style: CornerStyle, x: number, y: number, cell: number): PathCommand[] {
  const spec = SPECS[style] ?? SPECS.square!;
  const scale = (radii: Radii): Radii => radii.map((r) => r * cell) as Radii;
  const commands: PathCommand[] = [];
  roundedBox(x, y, cell * 7, scale(spec.outer), commands);
  roundedBox(x + cell, y + cell, cell * 5, scale(spec.hole), commands);
  roundedBox(x + cell * 2, y + cell * 2, cell * 3, scale(spec.centre), commands);
  return commands;
}

/** Top-left module of each finder, as [row, col]. */
export function finderOrigins(moduleCount: number): Array<[number, number]> {
  return [
    [0, 0],
    [0, moduleCount - 7],
    [moduleCount - 7, 0],
  ];
}

export function traceFinderOnCanvas(ctx: CanvasRenderingContext2D, commands: PathCommand[]): void {
  ctx.beginPath();
  for (const c of commands) {
    if (c.op === "M") ctx.moveTo(c.x, c.y);
    else if (c.op === "L") ctx.lineTo(c.x, c.y);
    else if (c.op === "C") ctx.bezierCurveTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y);
    else ctx.closePath();
  }
}

export function finderPathToSvg(commands: PathCommand[]): string {
  const n = (value: number) => Number(value.toFixed(3));
  return commands
    .map((c) => {
      if (c.op === "Z") return "Z";
      if (c.op === "C") return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
      return `${c.op}${n(c.x)} ${n(c.y)}`;
    })
    .join("");
}
