"use client";

import Segment from "./Segment";
import { INPUTS, LEVELS, MODES, TIME_MAX, TIME_MIN, TIME_STEP, TOPICS } from "@/lib/topics";
import { bestKey, type BestStars } from "@/lib/storage";
import type { InputMode, Level, Mode, Profile, Settings, TopicId } from "@/lib/types";

interface Props {
  settings: Settings;
  best: BestStars;
  profile: Profile | null;
  onChange: (patch: Partial<Settings>) => void;
  onPick: (topic: TopicId) => void;
  onPlayers: () => void;
  onProgress: () => void;
  onHowTo: () => void;
}

export default function Home({ settings, best, profile, onChange, onPick, onPlayers, onProgress, onHowTo }: Props) {
  const name = profile ? profile.name : settings.name;
  return (
    <section>
      <div className="hello">
        <div>
          <h1>{name ? `Hi ${name}, ready to play?` : "Ready to play?"}</h1>
          <p>
            Pick a level, then choose a topic to start.{" "}
            <button className="linkbtn inline" type="button" onClick={onHowTo}>New here? See how to play</button>
          </p>
        </div>
        {profile ? (
          <div className="row">
            <button className="btn" type="button" onClick={onProgress}>📈 My progress</button>
            <button className="linkbtn" type="button" onClick={onPlayers}>Not {profile.name}? Switch player</button>
          </div>
        ) : (
          <div className="guestbox">
            <label className="namebox" htmlFor="nameInput">
              Your name
              <input
                id="nameInput"
                maxLength={16}
                placeholder="Type your name"
                autoComplete="off"
                value={settings.name}
                onChange={(e) => onChange({ name: e.target.value })}
                onBlur={(e) => onChange({ name: e.target.value.trim() })}
              />
            </label>
            <button className="linkbtn" type="button" onClick={onPlayers}>Make a player profile to save your progress</button>
          </div>
        )}
      </div>

      <div className="settings">
        <Segment<Level>
          label="Level"
          items={LEVELS.map((l, i) => ({ value: i as Level, name: l.name, sub: l.age }))}
          value={settings.level}
          onChange={(level) => onChange({ level })}
        />
        <Segment<Mode>
          label="Game"
          items={MODES.map((m) => ({ value: m.id, name: m.name, sub: m.sub }))}
          value={settings.mode}
          onChange={(mode) => onChange({ mode })}
        />
        <Segment<InputMode>
          label="Answer by"
          items={INPUTS.map((m) => ({ value: m.id, name: m.name, sub: m.sub }))}
          value={settings.input}
          onChange={(input) => onChange({ input })}
        />
        <div className="group">
          <span className="lab" id="timeLab">Time per question</span>
          <div className="timeset" role="group" aria-labelledby="timeLab">
            {LEVELS.map((l, i) => {
              const v = settings.timeLimits[i];
              const set = (n: number) => {
                const next = [...settings.timeLimits] as Settings["timeLimits"];
                next[i] = n;
                onChange({ timeLimits: next });
              };
              return (
                <div className={`trow${i === settings.level ? " cur" : ""}`} key={l.name}>
                  <span className="tname">{l.name}</span>
                  <button type="button" aria-label={`Less time for ${l.name}`} disabled={v <= TIME_MIN} onClick={() => set(v - TIME_STEP)}>−</button>
                  <output aria-live="polite" aria-label={`${l.name}: ${v} seconds`}>{v}s</output>
                  <button type="button" aria-label={`More time for ${l.name}`} disabled={v >= TIME_MAX} onClick={() => set(v + TIME_STEP)}>+</button>
                </div>
              );
            })}
          </div>
          <small className="tnote">A picture guide pops up after a quarter of the time.</small>
        </div>
      </div>

      <h2 className="section">Pick a topic</h2>
      <div className="topics">
        {TOPICS.map((t) => {
          const stars = best[bestKey(t.id, settings.level)] || 0;
          return (
            <button
              key={t.id}
              type="button"
              className="topic"
              style={{ ["--tc" as string]: `var(--c-${t.id})` }}
              onClick={() => onPick(t.id)}
            >
              <span className="sym" aria-hidden="true">{t.sym}</span>
              <span className="info">
                <span className="name">{t.name}</span>
                <span className="blurb">{t.blurb}</span>
                <span className="stars" aria-label={`${stars} of 3 stars`}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={i < stars ? "on" : ""}>★</span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="footnote">
        Stars show your best score for each topic at the level you have picked. Get 9 or 10 right to earn all three.
      </p>
    </section>
  );
}
