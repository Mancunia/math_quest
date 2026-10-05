"use client";

import { LEVELS, TIME_MAX, TIME_MIN, TOPICS } from "@/lib/topics";

interface Props {
  onBack: () => void;
  onStart: () => void;
}

const STEPS = [
  { icon: "👤", title: "Pick who's playing", text: "Tap the player button at the top. Choose your profile, make a new one, or play as a guest." },
  { icon: "🎚️", title: "Choose your settings", text: "Pick a level, a game type (10 questions or a 60-second race) and how you want to answer." },
  { icon: "🧩", title: "Pick a topic", text: "Tap a topic card to start. For Times Tables you choose which tables first. Shapes starts with a short picture lesson, which you can skip." },
  { icon: "✏️", title: "Answer the questions", text: "Tap one of the 4 answers, or type your answer on the number pad and press ✓." },
  { icon: "⭐", title: "Earn stars", text: "See your stars at the end, then play again, practise your mistakes or check the leaderboard." },
];

const KEYS = [
  { keys: ["1", "2", "3", "4"], text: "Pick an answer when tapping" },
  { keys: ["0–9"], text: "Type a number when typing" },
  { keys: ["⌫"], text: "Delete a digit" },
  { keys: ["Enter"], text: "Check your answer, or go to the next question" },
];

const FAQ = [
  {
    q: "How do I get stars?",
    a: "In a 10-question game, get 5 right for 1 star, 7 for 2 stars and 9 or 10 for all 3. In a race, the more you get right in 60 seconds, the more stars you earn. Your best stars for each topic show on the topic cards.",
  },
  {
    q: "What happens if the clock runs out?",
    a: "It counts as a miss and the right answer is shown, so you can learn it for next time. After a quarter of the time, a hint with a picture opens by itself to help you.",
  },
  {
    q: "Can I get a hint?",
    a: "Yes. Tap “Show me a hint” under the question any time before you answer.",
  },
  {
    q: "What is “Practise my mistakes”?",
    a: "After a game, this button replays only the questions you got wrong. Practice rounds don't go on the leaderboard.",
  },
  {
    q: "How does the leaderboard work?",
    a: "Every finished game is saved with your name. 10-question games rank by correct answers, then the quickest time. Races rank by correct answers, then accuracy. Use the filters to see each game type, level and topic.",
  },
  {
    q: "What is a PIN?",
    a: "An optional 4-number code on a profile, so brothers and sisters don't play as each other. If it's forgotten, “Forgot the PIN?” lets a grown-up remove it.",
  },
];

export default function HowTo({ onBack, onStart }: Props) {
  return (
    <section className="panel howto">
      <div className="boardhead">
        <div>
          <h2>How to play</h2>
          <p>Everything you need to know to start your maths quest.</p>
        </div>
        <button className="btn" type="button" onClick={onBack}>← Back</button>
      </div>

      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="stepnum" aria-hidden="true">{i + 1}</span>
            <span className="stepicon" aria-hidden="true">{s.icon}</span>
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>

      <h3>The levels</h3>
      <ul className="chips">
        {LEVELS.map((l) => (
          <li key={l.name}><strong>{l.name}</strong> {l.age}</li>
        ))}
      </ul>

      <h3>The topics</h3>
      <ul className="howtopics">
        {TOPICS.map((t) => (
          <li key={t.id}>
            <span className="tdot" style={{ background: `var(--c-${t.id})` }} />
            <strong>{t.name}</strong> <span>{t.blurb}</span>
          </li>
        ))}
      </ul>

      <h3>Keyboard shortcuts</h3>
      <ul className="keys">
        {KEYS.map((k) => (
          <li key={k.text}>
            <span>{k.keys.map((key) => <kbd key={key}>{key}</kbd>)}</span>
            {k.text}
          </li>
        ))}
      </ul>

      <h3>Questions</h3>
      <div className="faq">
        {FAQ.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <details>
          <summary>For grown-ups: settings and saving</summary>
          <p>
            Each level has its own time per question, from {TIME_MIN} to {TIME_MAX} seconds (10 by default). Change it
            under “Time per question” on the home screen. Profiles, stars and the leaderboard are saved in
            this browser only, so they won't follow a child to another device, and clearing site data or using a private
            window starts fresh. Use the buttons at the top to switch sound on or off and change between light, dark and
            auto themes.
          </p>
        </details>
      </div>

      <div className="row center">
        <button className="btn primary" type="button" onClick={onStart}>Let's play!</button>
      </div>
    </section>
  );
}
