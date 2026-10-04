import { DEFAULT_TIME_LIMITS, clampTime } from "./topics";
import type { LeaderEntry, Level, Mode, Settings, Theme, TopicId } from "./types";

/**
 * Everything is kept in this browser's localStorage. Reads and writes are
 * wrapped so the game still works in private windows or when storage is blocked.
 * Settings and best stars belong to a player profile (`p_<id>_settings`), or to
 * the guest when no profile is picked (`settings`, as before profiles existed).
 */
const PREFIX = "mq_";
const MAX_ENTRIES = 300;

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep playing without saving */
  }
}

export function remove(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* storage unavailable */
  }
}

/** The storage key for a profile's own copy of `key`; `null` is the guest. */
export const scoped = (profileId: string | null, key: string) => (profileId ? `p_${profileId}_${key}` : key);

export const DEFAULT_SETTINGS: Settings = {
  level: 0,
  mode: "ten",
  input: "tap",
  sound: true,
  theme: "system",
  name: "",
  tables: [2, 5, 10],
  timeLimits: DEFAULT_TIME_LIMITS,
};

export const loadSettings = (profileId: string | null): Settings => {
  const s = { ...DEFAULT_SETTINGS, ...load<Partial<Settings>>(scoped(profileId, "settings"), {}) };
  const t = Array.isArray(s.timeLimits) ? s.timeLimits : [];
  s.timeLimits = DEFAULT_TIME_LIMITS.map((d, i) => clampTime(t[i], d)) as Settings["timeLimits"];
  return s;
};
export const saveSettings = (profileId: string | null, s: Settings) => save(scoped(profileId, "settings"), s);

/** Sets data-theme on <html>; "system" removes it so the CSS media query decides. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export type BestStars = Record<string, number>;
export const bestKey = (topic: TopicId, level: Level) => `${topic}-${level}`;
export const loadBest = (profileId: string | null): BestStars => load<BestStars>(scoped(profileId, "best"), {});
export const saveBest = (profileId: string | null, b: BestStars) => save(scoped(profileId, "best"), b);

/* ---------- leaderboard ---------- */

export const loadLeaderboard = (): LeaderEntry[] => {
  const list = load<LeaderEntry[]>("leaderboard", []);
  return Array.isArray(list) ? list : [];
};

/** Adds a score to the list, saves it, and returns the new entry and list. */
export function addLeaderEntry(
  current: LeaderEntry[],
  entry: Omit<LeaderEntry, "id" | "date">,
): { entry: LeaderEntry; list: LeaderEntry[] } {
  const full: LeaderEntry = {
    ...entry,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    date: Date.now(),
  };
  let list = [...current, full];
  // Keep the best scores if the list grows too long.
  if (list.length > MAX_ENTRIES) list = sortEntries(list).slice(0, MAX_ENTRIES);
  save("leaderboard", list);
  return { entry: full, list };
}

export const clearLeaderboard = () => save("leaderboard", []);
export const saveLeaderboard = (list: LeaderEntry[]) => save("leaderboard", list);

/**
 * 10-question games rank by correct answers, then by the quickest time.
 * Races rank by correct answers, then by accuracy.
 * Earlier entries win any remaining tie.
 */
export function compareEntries(a: LeaderEntry, b: LeaderEntry): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.mode === "ten" && b.mode === "ten" && a.ms !== b.ms) return a.ms - b.ms;
  const accA = a.answered ? a.score / a.answered : 0;
  const accB = b.answered ? b.score / b.answered : 0;
  if (accB !== accA) return accB - accA;
  return a.date - b.date;
}

export const sortEntries = (list: LeaderEntry[]) => list.slice().sort(compareEntries);

export interface LeaderFilter {
  mode: Mode;
  level: Level | "all";
  topic: TopicId | "all";
}

export function filterEntries(list: LeaderEntry[], f: LeaderFilter): LeaderEntry[] {
  return sortEntries(
    list.filter(
      (e) => e.mode === f.mode && (f.level === "all" || e.level === f.level) && (f.topic === "all" || e.topic === f.topic),
    ),
  );
}
