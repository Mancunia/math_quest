"use client";

import { useEffect, useState } from "react";
import Home from "./Home";
import TablesPicker from "./TablesPicker";
import Play from "./Play";
import Results, { type Placement } from "./Results";
import Leaderboard from "./Leaderboard";
import Players from "./Players";
import Progress from "./Progress";
import HowTo from "./HowTo";
import { starsFor } from "@/lib/topics";
import { confetti, sfx } from "@/lib/effects";
import {
  DEFAULT_SETTINGS, addLeaderEntry, applyTheme, bestKey, clearLeaderboard, filterEntries, loadBest, loadLeaderboard,
  loadSettings, saveBest, saveSettings, type BestStars, type LeaderFilter,
} from "@/lib/storage";
import {
  addGame, createProfile, deleteProfile, isUnlocked, loadCurrentId, loadGames, loadProfiles, markUnlocked, migrateLegacy,
  saveCurrentId, updateProfile, type ProfileDraft,
} from "@/lib/profiles";
import type { GameRecord, LeaderEntry, Profile, Question, RoundResult, Settings, Theme, TopicId } from "@/lib/types";

const NEXT_THEME: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const THEME_ICON: Record<Theme, string> = { system: "🌗", light: "☀️", dark: "🌙" };
const THEME_LABEL: Record<Theme, string> = { system: "Auto", light: "Light", dark: "Dark" };

type Screen = "home" | "tables" | "play" | "results" | "leaderboard" | "players" | "progress" | "howto";

interface Run {
  id: number;
  topic: TopicId;
  queue?: Question[];
  settings: Settings;
}

export default function Game() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [best, setBest] = useState<BestStars>({});
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [screen, setScreen] = useState<Screen>("home");
  const [run, setRun] = useState<Run | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [stars, setStars] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [boardFrom, setBoardFrom] = useState<Screen>("home");
  const [boardFilter, setBoardFilter] = useState<LeaderFilter>({ mode: "ten", level: "all", topic: "all" });

  const pid = profile?.id ?? null;
  const playerName = profile ? profile.name : settings.name.trim();

  /** Loads a profile's (or the guest's) settings, stars and history. */
  const loadPlayer = (p: Profile | null) => {
    setProfile(p);
    saveCurrentId(p?.id ?? null);
    setSettings(loadSettings(p?.id ?? null));
    setBest(loadBest(p?.id ?? null));
    setGames(p ? loadGames(p.id) : []);
  };

  // Load saved data once, in the browser.
  useEffect(() => {
    migrateLegacy();
    const list = loadProfiles();
    const last = list.find((p) => p.id === loadCurrentId());
    setProfiles(list);
    setEntries(loadLeaderboard());
    if (last && isUnlocked(last)) loadPlayer(last);
    else {
      loadPlayer(null);
      if (list.length) setScreen("players");
    }
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const update = (patch: Partial<Settings>) =>
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(pid, next);
      return next;
    });

  const start = (topic: TopicId, queue?: Question[]) => {
    setRun({ id: Date.now(), topic, queue, settings });
    setPlacement(null);
    setScreen("play");
  };

  const record = (name: string, r: RoundResult, s: number, current: LeaderEntry[]) => {
    const { entry, list } = addLeaderEntry(current, {
      name, topic: r.topic, level: r.level, mode: r.mode, score: r.score, answered: r.answered, total: r.total,
      stars: s, streak: r.bestStreak, ms: r.ms, tables: r.topic === "tables" ? r.tables : undefined, profileId: pid ?? undefined,
    });
    setEntries(list);
    const filter: LeaderFilter = { mode: r.mode, level: r.level, topic: r.topic };
    const ranked = filterEntries(list, filter);
    setPlacement({ entry, rank: ranked.findIndex((e) => e.id === entry.id) + 1, of: ranked.length });
    setBoardFilter(filter);
  };

  const finish = (r: RoundResult) => {
    const s = starsFor(r.mode, r.level, r.score, r.answered);
    setResult(r);
    setStars(s);
    if (profile && r.answered > 0) {
      const game: GameRecord = {
        date: Date.now(), topic: r.topic, level: r.level, mode: r.mode, score: r.score, answered: r.answered,
        stars: s, streak: r.bestStreak, ms: r.ms, practice: r.practice,
      };
      setProfiles(addGame(profile.id, game));
      setGames((g) => [...g, game]);
    }
    if (!r.practice) {
      const key = bestKey(r.topic, r.level);
      if (s > (best[key] || 0)) {
        const nb = { ...best, [key]: s };
        setBest(nb);
        saveBest(pid, nb);
      }
      setBoardFilter({ mode: r.mode, level: r.level, topic: r.topic });
      if (playerName && r.answered > 0) record(playerName, r, s, entries);
    }
    setScreen("results");
    if (settings.sound) sfx.finish();
    if (s >= 2) confetti(s === 3 ? 180 : 90);
  };

  const pick = (p: Profile) => {
    markUnlocked(p);
    loadPlayer(p);
    setScreen("home");
  };

  const playAsGuest = () => {
    loadPlayer(null);
    setScreen("home");
  };

  const create = (d: ProfileDraft) => {
    const { profile: p, list } = createProfile(d);
    setProfiles(list);
    pick(p);
  };

  const edit = (d: ProfileDraft) => {
    if (!profile) return;
    const done = updateProfile(profile.id, d);
    if (!done) return;
    setProfiles(done.list);
    setProfile(done.profile);
    setSettings(loadSettings(done.profile.id));
    setEntries(loadLeaderboard());
  };

  const resetPin = (p: Profile) => {
    const done = updateProfile(p.id, { name: p.name, avatar: p.avatar, pin: "" });
    if (!done) return;
    setProfiles(done.list);
    pick(done.profile);
  };

  const remove = () => {
    if (!profile) return;
    const { profiles: list, leaderboard } = deleteProfile(profile.id);
    setProfiles(list);
    setEntries(leaderboard);
    setPlacement(null);
    loadPlayer(null);
    setScreen(list.length ? "players" : "home");
  };

  const openBoard = (from: Screen) => {
    setBoardFrom(from);
    if (from !== "results") setPlacement(null);
    setScreen("leaderboard");
  };

  return (
    <div className="app">
      <header className="top">
        <button className="logo" type="button" onClick={() => setScreen("home")} aria-label="Maths Quest, go to topics">
          <span className="mark" aria-hidden="true">
            <span>+</span><span>−</span><span>×</span><span>÷</span>
          </span>
          <span className="logotext">Maths Quest</span>
        </button>
        <div className="topbtns">
          {screen !== "play" && (
            <button
              className="iconbtn"
              type="button"
              aria-label={profile ? `Playing as ${profile.name}. Switch player` : "Playing as a guest. Pick a player"}
              onClick={() => setScreen("players")}
            >
              <span aria-hidden="true">{profile ? profile.avatar : "👤"}</span>
              <span className="lbl"> {profile ? profile.name : "Guest"}</span>
            </button>
          )}
          {profile && screen !== "progress" && screen !== "play" && (
            <button className="iconbtn" type="button" onClick={() => setScreen("progress")}>
              <span aria-hidden="true">📈</span><span className="lbl"> My progress</span>
            </button>
          )}
          {screen !== "howto" && screen !== "play" && (
            <button className="iconbtn" type="button" onClick={() => setScreen("howto")}>
              <span aria-hidden="true">❓</span><span className="lbl"> How to play</span>
            </button>
          )}
          {screen !== "leaderboard" && (
            <button className="iconbtn" type="button" onClick={() => openBoard(screen === "play" ? "home" : screen)}>
              <span aria-hidden="true">🏆</span><span className="lbl"> Leaderboard</span>
            </button>
          )}
          <button className="iconbtn" type="button" aria-pressed={settings.sound} onClick={() => {
            update({ sound: !settings.sound });
            if (!settings.sound) sfx.right();
          }}>
            <span aria-hidden="true">{settings.sound ? "🔊" : "🔇"}</span>
            <span className="lbl"> Sound: {settings.sound ? "on" : "off"}</span>
          </button>
          <button
            className="iconbtn"
            type="button"
            aria-label={`Theme: ${settings.theme === "system" ? "auto" : settings.theme}. Change theme`}
            onClick={() => update({ theme: NEXT_THEME[settings.theme] })}
          >
            <span aria-hidden="true">{THEME_ICON[settings.theme]}</span>
            <span className="lbl"> {THEME_LABEL[settings.theme]}</span>
          </button>
        </div>
      </header>

      <main>
        {screen === "home" && (
          <Home
            settings={settings}
            best={best}
            profile={profile}
            onChange={update}
            onPick={(t) => (t === "tables" ? setScreen("tables") : start(t))}
            onPlayers={() => setScreen("players")}
            onProgress={() => setScreen("progress")}
            onHowTo={() => setScreen("howto")}
          />
        )}

        {screen === "tables" && (
          <TablesPicker
            tables={settings.tables}
            onChange={(tables) => update({ tables })}
            onBack={() => setScreen("home")}
            onStart={() => start("tables")}
          />
        )}

        {screen === "play" && run && (
          <Play
            key={run.id}
            topic={run.topic}
            level={run.settings.level}
            mode={run.settings.mode}
            input={run.settings.input}
            tables={run.settings.tables}
            seconds={run.settings.timeLimits[run.settings.level]}
            sound={settings.sound}
            queue={run.queue}
            onQuit={() => setScreen("home")}
            onFinish={finish}
          />
        )}

        {screen === "results" && result && run && (
          <Results
            result={result}
            stars={stars}
            bestStars={best[bestKey(result.topic, result.level)] || 0}
            name={playerName}
            placement={placement}
            onSaveScore={(name) => {
              update({ name });
              record(name, result, stars, entries);
            }}
            onAgain={() => start(run.topic)}
            onPractice={() => start(run.topic, result.history.filter((h) => !h.ok).map((h) => h.q))}
            onLeaderboard={() => openBoard("results")}
            onHome={() => setScreen("home")}
          />
        )}

        {screen === "players" && (
          <Players
            key={profiles.length}
            profiles={profiles}
            currentId={pid}
            onPick={pick}
            onCreate={create}
            onGuest={playAsGuest}
            onResetPin={resetPin}
          />
        )}

        {screen === "progress" && profile && (
          <Progress
            profile={profile}
            profiles={profiles}
            best={best}
            games={games}
            onPlay={(t) => (t === "tables" ? setScreen("tables") : start(t))}
            onEdit={edit}
            onDelete={remove}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "howto" && <HowTo onBack={() => setScreen("home")} onStart={() => setScreen("home")} />}

        {screen === "leaderboard" && (
          <Leaderboard
            entries={entries}
            profiles={profiles}
            highlightId={placement?.entry.id}
            initialFilter={boardFilter}
            onBack={() => setScreen(boardFrom === "leaderboard" ? "home" : boardFrom)}
            onClear={() => {
              clearLeaderboard();
              setEntries([]);
              setPlacement(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
