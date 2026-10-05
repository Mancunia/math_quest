import type { Shape2D, Solid } from "./types";

/* Facts and drawings for the Shapes topic. The question generator and components/Visual.tsx
   both read from here, so a picture can never disagree with its answer.
   Drawings use a 200 × 200 SVG box. */

export type Pt = readonly [number, number];

interface Flat {
  name: string;
  /** Straight sides, which is also the number of corners. */
  sides: number;
  symmetry: number;
  points: Pt[];
  /** Lines of symmetry, as pairs of end points. */
  lines: [Pt, Pt][];
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const at = (cx: number, cy: number, r: number, deg: number): Pt => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

/** A regular shape with `n` sides, its first corner at angle `start` (degrees, clockwise from 3 o'clock). */
function regular(name: string, n: number, start = -90, cx = 100, cy = 100, r = 82): Flat {
  const points = Array.from({ length: n }, (_, i) => at(cx, cy, r, start + (i * 360) / n));
  const lines = Array.from({ length: n }, (_, k): [Pt, Pt] => {
    const a = start + (k * 180) / n;
    return [at(cx, cy, r + 12, a), at(cx, cy, r + 12, a + 180)];
  });
  return { name, sides: n, symmetry: n, points, lines };
}

export const FLAT: Record<Shape2D, Flat> = {
  circle: { name: "circle", sides: 0, symmetry: 0, points: [], lines: [] },
  triangle: regular("triangle", 3, -90, 100, 118, 88),
  isosceles: {
    name: "triangle", sides: 3, symmetry: 1,
    points: [[100, 18], [150, 182], [50, 182]],
    lines: [[[100, 6], [100, 194]]],
  },
  square: regular("square", 4, -45),
  rectangle: {
    name: "rectangle", sides: 4, symmetry: 2,
    points: [[12, 55], [188, 55], [188, 145], [12, 145]],
    lines: [[[0, 100], [200, 100]], [[100, 43], [100, 157]]],
  },
  pentagon: regular("pentagon", 5, -90, 100, 106),
  hexagon: regular("hexagon", 6, 0),
  heptagon: regular("heptagon", 7, -90, 100, 104),
  octagon: regular("octagon", 8, -67.5),
};

/** Mid-points of each side, pushed out from the middle, for numbering the sides. */
export function sideLabels(p: Pt[], push = 16): Pt[] {
  const cx = p.reduce((s, q) => s + q[0], 0) / p.length;
  const cy = p.reduce((s, q) => s + q[1], 0) / p.length;
  return p.map((a, i) => {
    const b = p[(i + 1) % p.length];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const d = Math.hypot(mx - cx, my - cy) || 1;
    return [mx + ((mx - cx) / d) * push, my + ((my - cy) / d) * push] as const;
  });
}

interface Solidity {
  name: string;
  faces: number;
  edges: number;
  vertices: number;
  /** Flat faces that face us, drawn filled. Each is a list of corners. */
  fronts: Pt[][];
  /** Edges we can see, and edges hidden at the back (drawn dashed). */
  seen: [Pt, Pt][];
  hidden: [Pt, Pt][];
  corners: Pt[];
}

const box = (x: number, y: number, w: number, h: number, dx: number, dy: number): Omit<Solidity, "name" | "faces" | "edges" | "vertices"> => {
  const A: Pt = [x, y], B: Pt = [x + w, y], C: Pt = [x + w, y + h], D: Pt = [x, y + h];
  const E: Pt = [x + dx, y + dy], F: Pt = [x + w + dx, y + dy], G: Pt = [x + w + dx, y + h + dy], H: Pt = [x + dx, y + h + dy];
  return {
    fronts: [[A, B, C, D], [A, B, F, E], [B, F, G, C]],
    seen: [[A, B], [B, C], [C, D], [D, A], [A, E], [B, F], [C, G], [E, F], [F, G]],
    hidden: [[H, E], [H, G], [H, D]],
    corners: [A, B, C, D, E, F, G, H],
  };
};

const empty = { fronts: [], seen: [], hidden: [], corners: [] };

/** Solid shapes. Curved ones (sphere, cylinder, cone) are drawn separately in Visual.tsx. */
export const SOLIDS: Record<Solid, Solidity> = {
  cube: { name: "cube", faces: 6, edges: 12, vertices: 8, ...box(30, 72, 98, 98, 42, -42) },
  cuboid: { name: "cuboid", faces: 6, edges: 12, vertices: 8, ...box(14, 92, 130, 72, 42, -36) },
  pyramid: (() => {
    const P1: Pt = [30, 168], P2: Pt = [132, 168], P3: Pt = [176, 128], P4: Pt = [74, 128], T: Pt = [102, 22];
    return {
      name: "square-based pyramid", faces: 5, edges: 8, vertices: 5,
      fronts: [[T, P1, P2], [T, P2, P3]],
      seen: [[P1, P2], [P2, P3], [T, P1], [T, P2], [T, P3]],
      hidden: [[P1, P4], [P4, P3], [T, P4]],
      corners: [P1, P2, P3, P4, T],
    };
  })(),
  prism: (() => {
    const T1: Pt = [18, 168], T2: Pt = [108, 168], T3: Pt = [63, 92], U1: Pt = [88, 124], U2: Pt = [178, 124], U3: Pt = [133, 48];
    return {
      name: "triangular prism", faces: 5, edges: 9, vertices: 6,
      fronts: [[T1, T2, T3], [T2, U2, U3, T3]],
      seen: [[T1, T2], [T2, T3], [T3, T1], [T2, U2], [T3, U3], [U2, U3]],
      hidden: [[T1, U1], [U1, U2], [U1, U3]],
      corners: [T1, T2, T3, U1, U2, U3],
    };
  })(),
  tetrahedron: (() => {
    const B1: Pt = [24, 160], B2: Pt = [150, 176], B3: Pt = [168, 112], T: Pt = [92, 22];
    return {
      name: "tetrahedron", faces: 4, edges: 6, vertices: 4,
      fronts: [[T, B1, B2], [T, B2, B3]],
      seen: [[B1, B2], [B2, B3], [T, B1], [T, B2], [T, B3]],
      hidden: [[B1, B3]],
      corners: [B1, B2, B3, T],
    };
  })(),
  sphere: { name: "sphere", faces: 1, edges: 0, vertices: 0, ...empty },
  cylinder: { name: "cylinder", faces: 3, edges: 2, vertices: 0, ...empty },
  cone: { name: "cone", faces: 2, edges: 1, vertices: 1, ...empty },
};

export const isSolid = (s: Shape2D | Solid): s is Solid => s in SOLIDS;
export const shapeName = (s: Shape2D | Solid) => (isSolid(s) ? SOLIDS[s].name : FLAT[s].name);
export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type AngleKind = "acute" | "right" | "obtuse" | "reflex";
export const angleKind = (deg: number): AngleKind => (deg < 90 ? "acute" : deg === 90 ? "right" : deg < 180 ? "obtuse" : "reflex");
export const ANGLE_RULE: Record<AngleKind, string> = {
  acute: "less than a right angle",
  right: "exactly a quarter turn",
  obtuse: "between a right angle and a straight line",
  reflex: "more than a straight line",
};
