import { TOPICS } from "./topics";
import { load, loadBest, loadLeaderboard, loadSettings, remove, save, saveBest, saveLeaderboard, saveSettings, scoped, DEFAULT_SETTINGS, type BestStars } from "./storage";
import type { GameRecord, LeaderEntry, Level, Profile, TopicId } from "./types";

/**
 * Player profiles on this device. Each profile keeps its own settings, best stars
 * and game history (see `scoped` in storage.ts). The leaderboard stays shared.
 */
export const AVATARS = ["🦊", "🐼", "🐯", "🦁", "🐸", "🐙", "🦄", "🐲", "🐵", "🐨", "🐧", "🦉", "🐢", "🐝", "🚀", "⚽"];
export const NAME_MAX = 16;
const MAX_GAMES = 1000;

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const loadProfiles = (): Profile[] => {
  const list = load<Profile[]>("profiles", []);
  return Array.isArray(list) ? list : [];
};
const saveProfiles = (list: Profile[]) => save("profiles", list);

/** The last profile picked on this device, remembered between visits. */
export const loadCurrentId = (): string | null => load<string | null>("current", null);
export const saveCurrentId = (id: string | null) => save("current", id);

/**
 * A profile with a PIN asks for it again in each new browser session, so the next
 * child to open the game doesn't land in someone else's profile.
 */
export function isUnlocked(p: Profile): boolean {
  if (!p.pin) return true;
  try {
    return window.sessionStorage.getItem("mq_unlocked") === p.id;
  } catch {
    return false;
  }
}
export function markUnlocked(p: Profile): void {
  try {
    window.sessionStorage.setItem("mq_unlocked", p.id);
  } catch {
    /* storage unavailable */
  }
}

/** Returns an error message, or "" if the name can be used. */
export function checkName(name: string, profiles: Profile[], exceptId?: string): string {
  const n = name.trim();
  if (!n) return "Type a name.";
  if (profiles.some((p) => p.id !== exceptId && p.name.toLowerCase() === n.toLowerCase())) return `There is already a player called ${n}.`;
  return "";
}

export const validPin = (pin: string) => pin === "" || /^\d{4}$/.test(pin);

export interface ProfileDraft {
  name: string;
  avatar: string;
  pin: string;
}

/** Creates a profile that starts with the guest's sound and theme choices. */
export function createProfile(draft: ProfileDraft): { profile: Profile; list: Profile[] } {
  const profile: Profile = {
    id: newId(),
    name: draft.name.trim(),
    avatar: draft.avatar,
    pin: draft.pin || undefined,
    created: Date.now(),
  };
  const guest = loadSettings(null);
  saveSettings(profile.id, { ...DEFAULT_SETTINGS, sound: guest.sound, theme: guest.theme, name: profile.name });
  const list = [...loadProfiles(), profile];
  saveProfiles(list);
  return { profile, list };
}

/** Saves changes to a profile and renames its leaderboard scores to match. */
export function updateProfile(id: string, draft: ProfileDraft): { profile: Profile; list: Profile[] } | null {
  const list = loadProfiles();
  const old = list.find((p) => p.id === id);
  if (!old) return null;
  const profile: Profile = { ...old, name: draft.name.trim(), avatar: draft.avatar, pin: draft.pin || undefined };
  const next = list.map((p) => (p.id === id ? profile : p));
  saveProfiles(next);
  if (profile.name !== old.name) {
    saveLeaderboard(loadLeaderboard().map((e) => (e.profileId === id ? { ...e, name: profile.name } : e)));
    saveSettings(id, { ...loadSettings(id), name: profile.name });
  }
  return { profile, list: next };
}

/** Removes a profile, everything saved for it, and its leaderboard scores. */
export function deleteProfile(id: string): { profiles: Profile[]; leaderboard: LeaderEntry[] } {
  const profiles = loadProfiles().filter((p) => p.id !== id);
  saveProfiles(profiles);
  for (const key of ["settings", "best", "games"]) remove(scoped(id, key));
  const leaderboard = loadLeaderboard().filter((e) => e.profileId !== id);
  saveLeaderboard(leaderboard);
  if (loadCurrentId() === id) saveCurrentId(null);
  return { profiles, leaderboard };
}

export const loadGames = (id: string): GameRecord[] => {
  const list = load<GameRecord[]>(scoped(id, "games"), []);
  return Array.isArray(list) ? list : [];
};

/** Adds a finished round to a profile's history and stamps its last-played date. */
export function addGame(id: string, game: GameRecord): Profile[] {
  const games = [...loadGames(id), game].slice(-MAX_GAMES);
  save(scoped(id, "games"), games);
  const list = loadProfiles().map((p) => (p.id === id ? { ...p, lastPlayed: game.date } : p));
  saveProfiles(list);
  return list;
}

/**
 * Runs once. Before profiles existed there was one saved name; that player becomes
 * the first profile and keeps their stars and leaderboard scores.
 */
export function migrateLegacy(): void {
  if (load<Profile[] | null>("profiles", null) !== null) return;
  const legacy = loadSettings(null);
  const name = legacy.name.trim();
  if (!name) {
    saveProfiles([]);
    return;
  }
  const profile: Profile = { id: newId(), name, avatar: AVATARS[0], created: Date.now() };
  saveSettings(profile.id, { ...legacy, name });
  saveBest(profile.id, loadBest(null));
  const board = loadLeaderboard().map((e) => (e.name.toLowerCase() === name.toLowerCase() ? { ...e, profileId: profile.id } : e));
  saveLeaderboard(board);
  const games: GameRecord[] = board
    .filter((e) => e.profileId === profile.id)
    .sort((a, b) => a.date - b.date)
    .map((e) => ({
      date: e.date, topic: e.topic, level: e.level, mode: e.mode, score: e.score, answered: e.answered,
      stars: e.stars, streak: e.streak, ms: e.ms, practice: false,
    }));
  save(scoped(profile.id, "games"), games);
  if (games.length) {
    profile.created = games[0].date;
    profile.lastPlayed = games[games.length - 1].date;
  }
  saveProfiles([profile]);
  saveCurrentId(profile.id);
}

/* ---------- progress ---------- */

export const STAR_TOTAL = TOPICS.length * 3 * 3;
export const totalStars = (best: BestStars) => Object.values(best).reduce((n, s) => n + (s || 0), 0);

export interface TopicStats {
  topic: TopicId;
  games: number;
  right: number;
  answered: number;
}

export interface Progress {
  games: number;
  right: number;
  answered: number;
  daysPlayed: number;
  /** Days in a row with at least one game, counting back from today or yesterday. */
  dayStreak: number;
  byTopic: TopicStats[];
  /** Topics with enough answers to judge, weakest first, below 80% right. */
  toPractise: TopicStats[];
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function progressFor(games: GameRecord[], level?: Level): Progress {
  const list = level === undefined ? games : games.filter((g) => g.level === level);
  const byTopic: TopicStats[] = TOPICS.map((t) => ({ topic: t.id, games: 0, right: 0, answered: 0 }));
  let right = 0;
  let answered = 0;
  for (const g of list) {
    right += g.score;
    answered += g.answered;
    const s = byTopic.find((b) => b.topic === g.topic);
    if (s) {
      s.games += 1;
      s.right += g.score;
      s.answered += g.answered;
    }
  }
  const days = new Set(games.map((g) => dayKey(g.date)));
  let dayStreak = 0;
  const d = new Date();
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d.getTime()))) {
    dayStreak += 1;
    d.setDate(d.getDate() - 1);
  }
  const toPractise = byTopic
    .filter((s) => s.answered >= 10 && s.right / s.answered < 0.8)
    .sort((a, b) => a.right / a.answered - b.right / b.answered)
    .slice(0, 3);
  return { games: list.length, right, answered, daysPlayed: days.size, dayStreak, byTopic, toPractise };
}
