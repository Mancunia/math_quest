"use client";

import { useEffect, useReducer, useRef } from "react";
import RichText, { AnswerLabel } from "./RichText";
import Visual from "./Visual";
import { generate, numChoices, pick } from "@/lib/questions";
import { GUIDE_AT, LEVELS, RACE_SECONDS, ROUND_LENGTH, topicById } from "@/lib/topics";
import { confetti, sfx } from "@/lib/effects";
import type { Choice, HistoryItem, InputMode, Level, Mode, Question, RoundResult, TopicId } from "@/lib/types";

interface Props {
  topic: TopicId;
  level: Level;
  mode: Mode;
  input: InputMode;
  tables: number[];
  /** Seconds allowed for each question. */
  seconds: number;
  sound: boolean;
  /** When set, replay these questions (practice of earlier mistakes). */
  queue?: Question[];
  onQuit: () => void;
  onFinish: (r: RoundResult) => void;
}

interface Round {
  n: number;
  score: number;
  streak: number;
  bestStreak: number;
  history: HistoryItem[];
  seen: Set<string>;
  q: Question;
  choices: Choice[] | null;
  typed: string;
  locked: boolean;
  picked: string | null;
  feedback: null | { ok: boolean; title: string; detail?: string };
  hint: boolean;
  /** The hint opened by itself because a quarter of the time was used. */
  guide: boolean;
  anim: "" | "bounce" | "shake";
  ended: boolean;
  start: number;
  endAt: number;
  /** When the current question appeared, and when it was answered (stops its clock). */
  qStart: number;
  qStop: number;
}

const PRAISE = ["Brilliant!", "Super!", "You got it!", "Fantastic!", "Well done!", "Awesome!", "Spot on!", "Great thinking!"];
const ENCOURAGE = ["Nice try!", "Almost!", "Good effort!", "Keep going!"];
/** `given` value saved when the clock runs out. */
export const TIMED_OUT = "";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"];

export default function Play(props: Props) {
  const { topic, level, mode, input, tables, queue } = props;
  const qMs = props.seconds * 1000;
  const practice = !!queue;
  const isRace = mode === "race" && !practice;
  const total = queue ? queue.length : ROUND_LENGTH;

  const propsRef = useRef(props);
  propsRef.current = props;
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const timers = useRef<number[]>([]);
  const R = useRef<Round | null>(null);

  const makeQuestion = (r: Pick<Round, "n" | "seen">): Question => {
    if (queue) return queue[r.n];
    let q = generate(topic, level, tables);
    for (let i = 0; i < 40; i++) {
      const key = q.key || q.text;
      if (!r.seen.has(key)) { r.seen.add(key); break; }
      q = generate(topic, level, tables);
    }
    return q;
  };
  const choicesFor = (q: Question): Choice[] | null =>
    q.kind === "choice" ? q.choices! : input === "tap" ? numChoices(q.answer) : null;

  if (!R.current) {
    const seen = new Set<string>();
    const q = makeQuestion({ n: 0, seen });
    const now = Date.now();
    R.current = {
      n: 0, score: 0, streak: 0, bestStreak: 0, history: [], seen, q, choices: choicesFor(q),
      typed: "", locked: false, picked: null, feedback: null, hint: false, guide: false, anim: "", ended: false,
      start: now, endAt: now + RACE_SECONDS * 1000, qStart: now, qStop: 0,
    };
  }
  const r = R.current;
  const play = (fn: () => void) => { if (propsRef.current.sound) fn(); };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  function finish() {
    const s = R.current!;
    if (s.ended) return;
    s.ended = true;
    timers.current.forEach(clearTimeout);
    propsRef.current.onFinish({
      topic, level, mode: isRace ? "race" : "ten", score: s.score, answered: s.history.length, total,
      bestStreak: s.bestStreak, ms: Date.now() - s.start, history: s.history, practice, tables,
    });
  }

  function advance() {
    const s = R.current!;
    if (s.ended) return;
    s.n++;
    if (!isRace && s.n >= total) return finish();
    s.q = makeQuestion(s);
    s.choices = choicesFor(s.q);
    Object.assign(s, { typed: "", locked: false, picked: null, feedback: null, hint: false, guide: false, anim: "", qStart: Date.now(), qStop: 0 });
    rerender();
  }

  function answer(v: string) {
    const s = R.current!;
    if (s.locked || s.ended) return;
    s.locked = true;
    s.qStop = Date.now();
    s.picked = v;
    const ok = v !== TIMED_OUT && v === s.q.answer;
    s.history.push({ q: s.q, ok, given: v });
    if (ok) {
      s.score++;
      s.streak++;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      s.anim = "bounce";
      if (s.streak % 5 === 0) { play(sfx.streak); confetti(60); } else play(sfx.right);
      s.feedback = { ok, title: pick(PRAISE), detail: s.streak >= 3 ? `${s.streak} in a row!` : undefined };
      later(advance, isRace ? 500 : 1000);
    } else {
      s.streak = 0;
      s.anim = "shake";
      play(sfx.wrong);
      s.feedback = { ok, title: v === TIMED_OUT ? "Time's up! The answer is" : `${pick(ENCOURAGE)} The answer is`, detail: s.q.explain };
      if (isRace) later(advance, 1800);
    }
    rerender();
  }

  function keyPress(k: string) {
    const s = R.current!;
    if (s.locked || s.ended || s.choices) return;
    if (k === "del") s.typed = s.typed.slice(0, -1);
    else if (k === "ok") { if (s.typed !== "") answer(String(Number(s.typed))); return; }
    else if (s.typed.length < 5) s.typed = (s.typed === "0" ? "" : s.typed) + k;
    rerender();
  }

  // Clocks: the race clock, and each question's own clock.
  // A quarter of the way through a question the hint (with its picture) opens by itself.
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = R.current!;
      if (s.ended) return;
      const now = Date.now();
      if (isRace && now >= s.endAt) return finish();
      if (!s.locked) {
        const used = now - s.qStart;
        if (used >= qMs) return answer(TIMED_OUT);
        if (used >= qMs * GUIDE_AT && !s.hint && s.q.hint) {
          s.hint = true;
          s.guide = true;
          play(sfx.hint);
        }
      }
      rerender();
    }, 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear pending timeouts when leaving the screen
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Keyboard: digits / Backspace / Enter when typing, 1–4 to pick a choice, Enter for "Next"
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    const s = R.current!;
    if ((e.target as HTMLElement)?.tagName === "INPUT" || s.ended) return;
    if (s.locked) {
      if (e.key === "Enter" && s.feedback && !s.feedback.ok && !isRace && (e.target as HTMLElement)?.id !== "nextBtn") {
        e.preventDefault();
        advance();
      }
      return;
    }
    if (!s.choices) {
      if (/^[0-9]$/.test(e.key)) keyPress(e.key);
      else if (e.key === "Backspace") keyPress("del");
      else if (e.key === "Enter") keyPress("ok");
    } else if (/^[1-4]$/.test(e.key)) {
      const c = s.choices[Number(e.key) - 1];
      if (c) answer(c.v);
    }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // Focus "Next" after a wrong answer so Enter/Space works
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (r.feedback && !r.feedback.ok) nextRef.current?.focus();
  });

  const t = topicById(topic);
  const q = r.q;
  const left = Math.max(0, r.endAt - Date.now());
  const qLeft = Math.max(0, qMs - ((r.locked ? r.qStop : Date.now()) - r.qStart));
  const qSecs = Math.ceil(qLeft / 1000);
  const qState = qLeft <= Math.min(3000, qMs / 2) ? " low" : qLeft <= qMs / 2 ? " half" : "";
  const progress = isRace ? (left / (RACE_SECONDS * 1000)) * 100 : (Math.min(r.n, total) / total) * 100;
  const sub = topic === "tables" ? `${tables.join(", ")} times tables` : `${LEVELS[level].name}${practice ? " · practice" : ""}`;

  return (
    <section className="play" style={{ ["--topic" as string]: `var(--c-${topic})` }}>
      <div className="playbar">
        <button className="iconbtn" type="button" onClick={props.onQuit}>
          <span aria-hidden="true">←</span><span className="lbl"> Topics</span>
        </button>
        <div className="ptitle">
          {t.name}
          <small>{sub}</small>
        </div>
        <span className="chipstat"><span aria-hidden="true">★</span><span className="sr">Score</span> {r.score}</span>
        <span className={`chipstat${r.streak >= 3 ? " hot" : ""}`}>
          <span aria-hidden="true">🔥</span><span className="lbl"> Streak</span> {r.streak}
        </span>
      </div>
      <div className="progress" aria-hidden="true">
        <div style={{ width: `${progress}%` }} />
      </div>
      <div className="proglabel">
        {isRace
          ? `${Math.ceil(left / 1000)} seconds left · ${r.history.length} answered`
          : `Question ${Math.min(r.n + 1, total)} of ${total}`}
      </div>

      <div className={`qtimer${qState}`} role="timer" aria-label={`${qSecs} seconds left for this question`}>
        <span className="qclock" aria-hidden="true">⏱</span>
        <div className="qbar" aria-hidden="true">
          <div style={{ width: `${(qLeft / qMs) * 100}%` }} />
        </div>
        <b>{qSecs}s</b>
      </div>

      <div className={`qcard ${r.anim}`}>
        {q.visual && (
          <div className="qvisual">
            <Visual key={r.n} v={q.visual} />
          </div>
        )}
        {q.tag && <div className="qtag">{q.tag}</div>}
        <div className={`qtext${q.long ? " long" : ""}`} aria-live="polite">
          <RichText
            text={q.text}
            filled={r.locked}
            blank={r.locked ? <AnswerLabel value={q.answer} /> : r.typed || "?"}
          />
        </div>
        {r.hint && q.hint && (
          <div className={`hintbox${r.guide ? " guide" : ""}`}>
            {r.guide && <span className="guidetag">Need a hand? Here&apos;s a guide 👇</span>}
            <span>{q.hint}</span>
            {q.hintVisual && <Visual v={q.hintVisual} />}
          </div>
        )}
      </div>

      {r.choices ? (
        <div className={`answers${r.choices.length === 3 ? " three" : ""}`}>
          {r.choices.map((c) => {
            const state = !r.locked ? "" : c.v === q.answer ? " right" : c.v === r.picked ? " wrong" : "";
            return (
              <button key={c.v} type="button" className={`choice${state}`} disabled={r.locked} onClick={() => answer(c.v)}>
                <span><RichText text={c.label} /></span>
                {c.sub && <small>{c.sub}</small>}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="answers">
            <div className="typed">
              Your answer <output>{r.typed || " "}</output>
            </div>
          </div>
          <div className="keypad">
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className={k === "ok" ? "ok" : ""}
                aria-label={k === "del" ? "Delete" : k === "ok" ? "Check my answer" : k}
                disabled={r.locked}
                onClick={() => keyPress(k)}
              >
                {k === "del" ? "⌫" : k === "ok" ? "✓" : k}
              </button>
            ))}
          </div>
        </>
      )}

      {r.feedback && (
        <div className={`feedback ${r.feedback.ok ? "good" : "bad"}`} aria-live="assertive">
          <div>
            <div className="big">
              {r.feedback.title}
              {!r.feedback.ok && <> <AnswerLabel value={q.answer} />.</>}
            </div>
            {r.feedback.detail && (
              <div className="why">
                <RichText text={r.feedback.detail} />
              </div>
            )}
          </div>
          {!r.feedback.ok && !isRace && (
            <button id="nextBtn" ref={nextRef} className="btn primary" type="button" onClick={advance}>
              Next question →
            </button>
          )}
        </div>
      )}

      {q.hint && !r.hint && !r.locked && (
        <div className="playfoot">
          <button className="linkbtn" type="button" onClick={() => { r.hint = true; rerender(); }}>
            Show me a hint
          </button>
        </div>
      )}
    </section>
  );
}
