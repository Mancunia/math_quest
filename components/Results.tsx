"use client";

import { useEffect, useState } from "react";
import { AnswerLabel } from "./RichText";
import RichText from "./RichText";
import { LEVELS, MODES, topicById } from "@/lib/topics";
import type { LeaderEntry, RoundResult } from "@/lib/types";

export interface Placement {
  entry: LeaderEntry;
  rank: number;
  of: number;
}

interface Props {
  result: RoundResult;
  stars: number;
  bestStars: number;
  name: string;
  placement: Placement | null;
  onSaveScore: (name: string) => void;
  onAgain: () => void;
  onPractice: () => void;
  onLeaderboard: () => void;
  onHome: () => void;
}

export default function Results(p: Props) {
  const { result: r, stars, placement } = p;
  const [nameDraft, setNameDraft] = useState(p.name);
  const wrong = r.history.filter((h) => !h.ok);
  const canSave = !r.practice && r.answered > 0;
  const nm = p.name ? `, ${p.name}` : "";
  const titles = [`Keep practising${nm}!`, `Good work${nm}!`, `Great job${nm}!`, `Superstar${nm}!`];

  useEffect(() => setNameDraft(p.name), [p.name]);

  const modeName = MODES.find((m) => m.id === r.mode)!.name;
  const boardName = `${topicById(r.topic).name} · ${LEVELS[r.level].name} · ${modeName}`;

  return (
    <section className="panel results">
      <div className="bigstars" aria-label={`${stars} of 3 stars`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < stars ? "on" : ""}>★</span>
        ))}
      </div>
      <h2>{titles[stars]}</h2>
      <p className="ressub">
        {r.mode === "race"
          ? `You answered ${r.answered} questions in 60 seconds and got ${r.score} right.`
          : `You got ${r.score} out of ${r.answered} right in ${formatTime(r.ms)}.`}
      </p>

      <div className="statrow">
        <div className="stat"><b>{r.mode === "race" ? r.score : `${r.score}/${r.answered}`}</b><span>Correct</span></div>
        <div className="stat"><b>{r.bestStreak}</b><span>Best streak</span></div>
        <div className="stat"><b>{p.bestStars}/3</b><span>Best stars</span></div>
      </div>

      {canSave && placement && (
        <div className={`placed${placement.rank <= 3 ? " top" : ""}`}>
          <span className="rankbadge">#{placement.rank}</span>
          <div>
            <b>{placement.rank === 1 ? "You're top of the leaderboard!" : `You're number ${placement.rank} on the leaderboard!`}</b>
            <span>{boardName} · {placement.of} {placement.of === 1 ? "score" : "scores"} so far</span>
          </div>
          <button className="btn" type="button" onClick={p.onLeaderboard}>See leaderboard</button>
        </div>
      )}

      {canSave && !placement && (
        <form
          className="savescore"
          onSubmit={(e) => {
            e.preventDefault();
            if (nameDraft.trim()) p.onSaveScore(nameDraft.trim());
          }}
        >
          <label htmlFor="saveName">Type your name to put this score on the leaderboard</label>
          <div className="row">
            <input id="saveName" maxLength={16} autoComplete="off" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Your name" />
            <button className="btn primary" type="submit" disabled={!nameDraft.trim()}>Save my score</button>
          </div>
        </form>
      )}

      {r.practice && <p className="note">Practice rounds don&apos;t go on the leaderboard.</p>}

      <div className="review">
        {wrong.length > 0 ? (
          <>
            <h3>Let&apos;s look at these again</h3>
            {wrong.map((h, i) => (
              <div className="rv" key={i}>
                <span className="q">{h.q.review ?? <RichText text={h.q.text.replace("__", "?")} />}</span>
                <span className="a">
                  {h.given === "" ? <>Ran out of time</> : <>You said <s><AnswerLabel value={h.given} /></s></>} · Answer <b><AnswerLabel value={h.q.answer} /></b>
                </span>
              </div>
            ))}
          </>
        ) : r.answered > 0 ? (
          <h3 className="center">No mistakes at all. Amazing!</h3>
        ) : null}
      </div>

      <div className="row center">
        <button className="btn primary" type="button" onClick={p.onAgain}>Play again</button>
        {wrong.length > 0 && <button className="btn" type="button" onClick={p.onPractice}>Practise my mistakes</button>}
        <button className="btn" type="button" onClick={p.onLeaderboard}>Leaderboard</button>
        <button className="btn" type="button" onClick={p.onHome}>Choose a topic</button>
      </div>
    </section>
  );
}

export function formatTime(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} seconds` : `${Math.floor(s / 60)} min ${s % 60} s`;
}
