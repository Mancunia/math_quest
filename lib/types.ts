export type TopicId =
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "tables"
  | "count"
  | "compare"
  | "missing"
  | "pattern"
  | "fraction"
  | "time"
  | "shapes"
  | "mixed";

export type Level = 0 | 1 | 2;
export type Mode = "ten" | "race";
export type InputMode = "tap" | "type";
/** "system" follows the device setting. */
export type Theme = "system" | "light" | "dark";

/** Flat shapes. Their facts and drawings live in lib/shapes.ts. */
export type Shape2D =
  | "circle" | "triangle" | "isosceles" | "square" | "rectangle"
  | "pentagon" | "hexagon" | "heptagon" | "octagon";
/** Solid (3D) shapes. */
export type Solid = "cube" | "cuboid" | "sphere" | "cylinder" | "cone" | "pyramid" | "prism" | "tetrahedron";

/** Pictures that go with a question or a hint. Rendered by components/Visual.tsx. */
export type Visual =
  | { type: "dots"; a: number; b: number; op: "+" | "-" }
  | { type: "groups"; groups: number; each: number; shade?: number }
  | { type: "clock"; h: number; m: number; minutes?: boolean }
  | { type: "pie"; d: number; shaded: number[]; labels?: boolean }
  | { type: "bar"; d: number; shaded: number[]; labels?: boolean }
  | { type: "objects"; emoji: string; name: string; n: number }
  | { type: "blocks"; tens: number; ones: number }
  /** Column method with place-value headings. */
  | { type: "columns"; a: number; b: number; op: "+" | "-" }
  /** Skip counting from 0. `ask` hides the last stop, or asks how many jumps. */
  | { type: "jumps"; step: number; count: number; ask: "last" | "count" | "none" }
  /** One jump on a number line, from one number to another, marked "?". */
  | { type: "line"; from: number; to: number }
  /** A number pattern with the gaps between neighbours marked. */
  | { type: "pattern"; seq: (number | null)[] }
  /** The crocodile rule for <, > and =. */
  | { type: "croc" }
  /** A flat shape. `marks` numbers its sides, dots its corners or draws its lines of symmetry. */
  | { type: "shape2d"; shape: Shape2D; marks?: "sides" | "corners" | "symmetry"; label?: boolean }
  /** A solid shape. `marks` dots its vertices. */
  | { type: "solid"; solid: Solid; marks?: "vertices"; label?: boolean }
  /** An angle in degrees. `ref` adds a faint right angle to compare with. */
  | { type: "angle"; deg: number; ref?: boolean }
  /** A rectangle with two of its side lengths, all four, or a grid of 1 cm squares. */
  | { type: "rect"; w: number; h: number; show: "sides" | "all" | "grid" }
  /** A row of labelled shapes, for lessons. */
  | { type: "gallery"; items: (Shape2D | Solid)[] }
  /** Four angles side by side, named, for lessons. */
  | { type: "angles" };

/** One card of a lesson shown before a round. */
export interface Lesson {
  title: string;
  text: string;
  visual?: Visual;
}

/**
 * Text fields may contain two tokens, rendered by components/RichText.tsx:
 *   "__"     the blank the child fills in
 *   "{3/4}"  a stacked fraction
 */
export interface Choice {
  v: string;
  label: string;
  sub?: string;
}

export interface Question {
  text: string;
  answer: string;
  kind: "num" | "choice";
  choices?: Choice[];
  visual?: Visual;
  hint?: string;
  hintVisual?: Visual;
  explain: string;
  /** Short text for the review list on the results screen. */
  review?: string;
  /** Used to avoid repeating a question within a round. */
  key?: string;
  long?: boolean;
  /** Topic name shown above the question in Mixed Challenge. */
  tag?: string;
}

export interface Settings {
  level: Level;
  mode: Mode;
  input: InputMode;
  sound: boolean;
  theme: Theme;
  name: string;
  tables: number[];
  /** Seconds allowed per question for Easy, Medium and Hard. */
  timeLimits: [number, number, number];
}

export interface HistoryItem {
  q: Question;
  ok: boolean;
  given: string;
}

export interface RoundResult {
  topic: TopicId;
  level: Level;
  mode: Mode;
  score: number;
  answered: number;
  total: number;
  bestStreak: number;
  ms: number;
  history: HistoryItem[];
  practice: boolean;
  tables: number[];
}

export interface LeaderEntry {
  id: string;
  name: string;
  topic: TopicId;
  level: Level;
  mode: Mode;
  score: number;
  answered: number;
  total: number;
  stars: number;
  streak: number;
  ms: number;
  date: number;
  tables?: number[];
  /** Set when the score was made by a player profile, not a guest. */
  profileId?: string;
}

/** A player on this device. The PIN only stops brothers and sisters mixing up profiles; it is not a password. */
export interface Profile {
  id: string;
  name: string;
  avatar: string;
  pin?: string;
  created: number;
  lastPlayed?: number;
}

/** One finished round in a profile's history, practice rounds included. */
export interface GameRecord {
  date: number;
  topic: TopicId;
  level: Level;
  mode: Mode;
  score: number;
  answered: number;
  stars: number;
  streak: number;
  ms: number;
  practice: boolean;
}
