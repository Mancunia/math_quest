"use client";

import { useEffect, useState } from "react";
import Visual from "./Visual";
import RichText from "./RichText";
import { LEVELS, topicById } from "@/lib/topics";
import type { Lesson as Card, Level, TopicId } from "@/lib/types";

interface Props {
  topic: TopicId;
  level: Level;
  cards: Card[];
  onStart: () => void;
  onBack: () => void;
}

/** A few picture cards that teach a topic before the round starts. */
export default function Lesson({ topic, level, cards, onStart, onBack }: Props) {
  const [i, setI] = useState(0);
  const last = i === cards.length - 1;
  const card = cards[i];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => Math.min(cards.length - 1, n + 1));
      else if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length]);

  return (
    <section className="lesson" style={{ ["--topic" as string]: `var(--c-${topic})` }}>
      <div className="boardhead">
        <div>
          <h2>{topicById(topic).name} lesson</h2>
          <p>{LEVELS[level].name} · a quick look before the quiz</p>
        </div>
        <button className="btn" type="button" onClick={onBack}>← Topics</button>
      </div>

      <div className="qcard lcard" aria-live="polite">
        <span className="lstep">Card {i + 1} of {cards.length}</span>
        <h3>{card.title}</h3>
        {card.visual && (
          <div className="qvisual">
            <Visual key={i} v={card.visual} />
          </div>
        )}
        <p><RichText text={card.text} /></p>
      </div>

      <div className="ldots" aria-hidden="true">
        {cards.map((_, n) => <span key={n} className={n === i ? "on" : ""} />)}
      </div>

      <div className="row center lnav">
        <button className="btn" type="button" disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
        {last ? (
          <button className="btn primary" type="button" onClick={onStart}>Start the quiz ▶</button>
        ) : (
          <button className="btn primary" type="button" onClick={() => setI(i + 1)}>Next →</button>
        )}
      </div>
      {!last && (
        <div className="playfoot">
          <button className="linkbtn" type="button" onClick={onStart}>Skip to the quiz</button>
        </div>
      )}
    </section>
  );
}
