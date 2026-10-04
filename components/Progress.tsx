"use client";

import { useMemo, useState } from "react";
import ProfileForm from "./ProfileForm";
import Segment from "./Segment";
import { LEVELS, MODES, TOPICS, topicById } from "@/lib/topics";
import { STAR_TOTAL, progressFor, totalStars, type ProfileDraft } from "@/lib/profiles";
import { bestKey, type BestStars } from "@/lib/storage";
import type { GameRecord, Level, Profile, TopicId } from "@/lib/types";

interface Props {
  profile: Profile;
  profiles: Profile[];
  best: BestStars;
  games: GameRecord[];
  onPlay: (topic: TopicId) => void;
  onEdit: (draft: ProfileDraft) => void;
  onDelete: () => void;
  onBack: () => void;
}

const RECENT = 10;
const pct = (right: number, answered: number) => (answered ? `${Math.round((right / answered) * 100)}%` : "–");
const day = (t: number) => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => <span key={i} className={i < n ? "on" : ""}>★</span>)}
    </span>
  );
}

export default function Progress({ profile, profiles, best, games, onPlay, onEdit, onDelete, onBack }: Props) {
  const [level, setLevel] = useState<Level | "all">("all");
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const stats = useMemo(() => progressFor(games, level === "all" ? undefined : level), [games, level]);
  const recent = games.slice(-RECENT).reverse();

  if (editing) {
    return (
      <ProfileForm
        title="Change my profile"
        profiles={profiles}
        editing={profile}
        submitLabel="Save changes"
        onSubmit={(d) => {
          onEdit(d);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <section className="panel progresspage">
      <div className="boardhead">
        <div className="phead">
          <span className="pav big" aria-hidden="true">{profile.avatar}</span>
          <div>
            <h2>{profile.name}&apos;s progress</h2>
            <p>Playing since {new Date(profile.created).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.</p>
          </div>
        </div>
        <button className="btn" type="button" onClick={onBack}>← Back</button>
      </div>

      <div className="statrow four">
        <div className="stat"><b>{totalStars(best)}</b><span>Stars of {STAR_TOTAL}</span></div>
        <div className="stat"><b>{games.length}</b><span>Games</span></div>
        <div className="stat"><b>{pct(stats.right, stats.answered)}</b><span>Right</span></div>
        <div className="stat"><b>{stats.dayStreak}</b><span>{stats.dayStreak === 1 ? "Day" : "Days"} in a row</span></div>
      </div>

      {games.length === 0 ? (
        <div className="empty">
          <b>No games yet.</b>
          <span>Play any topic and your scores, stars and streaks will show up here.</span>
        </div>
      ) : (
        <>
          {stats.toPractise.length > 0 && (
            <div className="practise">
              <h3>Good topics to practise</h3>
              <div className="row">
                {stats.toPractise.map((s) => (
                  <button key={s.topic} type="button" className="btn" onClick={() => onPlay(s.topic)}>
                    <span className="tdot" style={{ background: `var(--c-${s.topic})` }} />
                    {topicById(s.topic).name} <small>({pct(s.right, s.answered)} right)</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="settings flat">
            <Segment<Level | "all">
              label="Show level"
              items={[{ value: "all" as const, name: "All" }, ...LEVELS.map((l, i) => ({ value: i as Level, name: l.name }))]}
              value={level}
              onChange={setLevel}
              compact
            />
          </div>

          <div className="tablewrap">
            <table className="lb ptable">
              <thead>
                <tr>
                  <th>Topic</th>
                  {LEVELS.map((l, i) => (level === "all" || level === i) && <th key={l.name}>{l.name}</th>)}
                  <th className="num">Games</th>
                  <th className="num">Right</th>
                </tr>
              </thead>
              <tbody>
                {TOPICS.map((t) => {
                  const s = stats.byTopic.find((b) => b.topic === t.id)!;
                  return (
                    <tr key={t.id}>
                      <td className="topiccell">
                        <span className="tdot" style={{ background: `var(--c-${t.id})` }} />
                        {t.name}
                      </td>
                      {LEVELS.map((l, i) => (level === "all" || level === i) && (
                        <td key={l.name}><Stars n={best[bestKey(t.id, i as Level)] || 0} /></td>
                      ))}
                      <td className="num">{s.games}</td>
                      <td className="num">{pct(s.right, s.answered)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 className="subhead">Recent games</h3>
          <div className="tablewrap">
            <table className="lb">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th className="num">Score</th>
                  <th>Stars</th>
                  <th className="when">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((g, i) => (
                  <tr key={`${g.date}-${i}`}>
                    <td className="topiccell">
                      <span className="tdot" style={{ background: `var(--c-${g.topic})` }} />
                      {topicById(g.topic).name}
                      <small> · {LEVELS[g.level].name} · {MODES.find((m) => m.id === g.mode)!.name}{g.practice ? " · practice" : ""}</small>
                    </td>
                    <td className="num">{g.mode === "race" ? g.score : `${g.score}/${g.answered}`}</td>
                    <td>{g.practice ? <small className="muted">–</small> : <Stars n={g.stars} />}</td>
                    <td className="when">{day(g.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="row clearrow">
        {confirming ? (
          <>
            <span className="warn">Delete {profile.name}&apos;s profile, stars, history and leaderboard scores? This can&apos;t be undone.</span>
            <button className="btn danger" type="button" onClick={onDelete}>Yes, delete</button>
            <button className="btn" type="button" onClick={() => setConfirming(false)}>Keep it</button>
          </>
        ) : (
          <>
            <button className="btn" type="button" onClick={() => setEditing(true)}>Change name, picture or PIN</button>
            <button className="linkbtn" type="button" onClick={() => setConfirming(true)}>Delete this profile</button>
          </>
        )}
      </div>
    </section>
  );
}
