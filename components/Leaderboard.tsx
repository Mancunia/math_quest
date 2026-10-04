"use client";

import { useMemo, useState } from "react";
import Segment from "./Segment";
import { LEVELS, MODES, TOPICS, topicById } from "@/lib/topics";
import { filterEntries, type LeaderFilter } from "@/lib/storage";
import type { LeaderEntry, Level, Mode, Profile, TopicId } from "@/lib/types";

interface Props {
  entries: LeaderEntry[];
  profiles: Profile[];
  highlightId?: string;
  initialFilter: LeaderFilter;
  onBack: () => void;
  onClear: () => void;
}

const SHOW = 10;

function shortTime(ms: number) {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Leaderboard({ entries, profiles, highlightId, initialFilter, onBack, onClear }: Props) {
  const [f, setF] = useState<LeaderFilter>(initialFilter);
  const [confirming, setConfirming] = useState(false);
  const rows = useMemo(() => filterEntries(entries, f), [entries, f]);
  const top = rows.slice(0, SHOW);
  const hiIndex = rows.findIndex((e) => e.id === highlightId);
  const extra = hiIndex >= SHOW ? rows[hiIndex] : null;
  const players = new Set(entries.map((e) => e.profileId ?? e.name.toLowerCase())).size;
  const avatar = (e: LeaderEntry) => profiles.find((p) => p.id === e.profileId)?.avatar;

  const row = (e: LeaderEntry, rank: number) => (
    <tr key={e.id} className={e.id === highlightId ? "me" : ""}>
      <td><span className={`medal m${rank}`}>{rank}</span></td>
      <td className="who">
        {avatar(e) && <span aria-hidden="true">{avatar(e)} </span>}
        {e.name}
      </td>
      <td className="topiccell">
        <span className="tdot" style={{ background: `var(--c-${e.topic})` }} />
        {topicById(e.topic).name}
        {f.level === "all" && <small> · {LEVELS[e.level].name}</small>}
      </td>
      <td className="num">{f.mode === "race" ? e.score : `${e.score}/${e.answered}`}</td>
      <td className="num">{f.mode === "race" ? `${Math.round((e.score / Math.max(1, e.answered)) * 100)}%` : shortTime(e.ms)}</td>
      <td className="when">{new Date(e.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</td>
    </tr>
  );

  return (
    <section className="panel board">
      <div className="boardhead">
        <div>
          <h2>Leaderboard</h2>
          <p>
            Scores saved on this device. {entries.length} {entries.length === 1 ? "game" : "games"} from {players}{" "}
            {players === 1 ? "player" : "players"}.
          </p>
        </div>
        <button className="btn" type="button" onClick={onBack}>← Back</button>
      </div>

      <div className="settings flat">
        <Segment<Mode>
          label="Game"
          items={MODES.map((m) => ({ value: m.id, name: m.name }))}
          value={f.mode}
          onChange={(mode) => setF({ ...f, mode })}
          compact
        />
        <Segment<Level | "all">
          label="Level"
          items={[{ value: "all" as const, name: "All" }, ...LEVELS.map((l, i) => ({ value: i as Level, name: l.name }))]}
          value={f.level}
          onChange={(level) => setF({ ...f, level })}
          compact
        />
        <div className="group">
          <label className="lab" htmlFor="topicFilter">Topic</label>
          <select
            id="topicFilter"
            className="select"
            value={f.topic}
            onChange={(e) => setF({ ...f, topic: e.target.value as TopicId | "all" })}
          >
            <option value="all">All topics</option>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <b>No scores here yet.</b>
          <span>
            Finish a {f.mode === "race" ? "60-second race" : "10-question game"}
            {f.topic !== "all" ? ` of ${topicById(f.topic).name}` : ""}
            {f.level !== "all" ? ` on ${LEVELS[f.level].name}` : ""} as a player or with your name typed in, and it will show up here.
          </span>
        </div>
      ) : (
        <div className="tablewrap">
          <table className="lb">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Topic</th>
                <th className="num">Score</th>
                <th className="num">{f.mode === "race" ? "Accuracy" : "Time"}</th>
                <th className="when">Date</th>
              </tr>
            </thead>
            <tbody>
              {top.map((e, i) => row(e, i + 1))}
              {extra && (
                <>
                  <tr className="gap"><td colSpan={6}>⋯</td></tr>
                  {row(extra, hiIndex + 1)}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="note">
        {f.mode === "race"
          ? "Races rank by correct answers. Ties go to the player with better accuracy."
          : "10-question games rank by correct answers. Ties go to the quickest time."}
      </p>

      {entries.length > 0 && (
        <div className="row clearrow">
          {confirming ? (
            <>
              <span className="warn">Delete every score on this device? This can&apos;t be undone.</span>
              <button className="btn danger" type="button" onClick={() => { onClear(); setConfirming(false); }}>Yes, clear all</button>
              <button className="btn" type="button" onClick={() => setConfirming(false)}>Keep them</button>
            </>
          ) : (
            <button className="linkbtn" type="button" onClick={() => setConfirming(true)}>Clear the leaderboard</button>
          )}
        </div>
      )}
    </section>
  );
}
