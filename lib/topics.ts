import type { TopicId } from "./types";

export interface Topic {
  id: TopicId;
  name: string;
  sym: string;
  blurb: string;
}

export const TOPICS: Topic[] = [
  { id: "add", name: "Addition", sym: "+", blurb: "Put numbers together" },
  { id: "sub", name: "Subtraction", sym: "−", blurb: "Take numbers away" },
  { id: "mul", name: "Multiplication", sym: "×", blurb: "Groups of things" },
  { id: "div", name: "Division", sym: "÷", blurb: "Share out equally" },
  { id: "tables", name: "Times Tables", sym: "7×8", blurb: "Choose your tables" },
  { id: "count", name: "Counting", sym: "1 2 3", blurb: "How many can you see?" },
  { id: "compare", name: "Bigger or Smaller", sym: "< >", blurb: "Use <, > and =" },
  { id: "missing", name: "Missing Number", sym: "4+?", blurb: "Find the hidden number" },
  { id: "pattern", name: "Number Patterns", sym: "2 4 6", blurb: "What comes next?" },
  { id: "fraction", name: "Fractions", sym: "½ ¼", blurb: "Parts of a whole" },
  { id: "time", name: "Telling Time", sym: "3:30", blurb: "Read the clock" },
  { id: "shapes", name: "Shapes", sym: "▲■", blurb: "Sides, corners and solids" },
  { id: "mixed", name: "Mixed Challenge", sym: "★", blurb: "A bit of everything" },
];

export const topicById = (id: TopicId): Topic => TOPICS.find((t) => t.id === id)!;

export const LEVELS = [
  { name: "Easy", age: "Ages 5–6" },
  { name: "Medium", age: "Ages 7–8" },
  { name: "Hard", age: "Ages 9–11" },
] as const;

export const MODES = [
  { id: "ten", name: "10 questions", sub: "Take your time" },
  { id: "race", name: "60-second race", sub: "How many can you get?" },
] as const;

export const INPUTS = [
  { id: "tap", name: "Tapping", sub: "Pick from 4 answers" },
  { id: "type", name: "Typing", sub: "Use the number pad" },
] as const;

export const RACE_SECONDS = 60;
/** Share of a question's time that passes before the hint and its picture guide open by themselves. */
export const GUIDE_AT = 0.25;
/** Seconds allowed per question, by level. */
export const DEFAULT_TIME_LIMITS: [number, number, number] = [10, 10, 10];
export const TIME_MIN = 5;
export const TIME_MAX = 60;
export const TIME_STEP = 5;
export const clampTime = (n: unknown, fallback = 10) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(TIME_MAX, Math.max(TIME_MIN, Math.round(n / TIME_STEP) * TIME_STEP)) : fallback;
export const ROUND_LENGTH = 10;

/** Race-mode scores needed for 1, 2 and 3 stars at each level. */
const RACE_STARS: [number, number, number][] = [
  [6, 10, 14],
  [5, 9, 13],
  [4, 7, 10],
];

export function starsFor(mode: "ten" | "race", level: number, score: number, answered: number): number {
  if (mode === "race") {
    const th = RACE_STARS[level];
    return score >= th[2] ? 3 : score >= th[1] ? 2 : score >= th[0] ? 1 : 0;
  }
  const pct = answered ? score / answered : 0;
  return pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
}
