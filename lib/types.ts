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
  | "mixed";

export type Level = 0 | 1 | 2;
export type Mode = "ten" | "race";
export type InputMode = "tap" | "type";
/** "system" follows the device setting. */
export type Theme = "system" | "light" | "dark";

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
  | { type: "croc" };

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
