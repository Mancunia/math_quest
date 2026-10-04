"use client";

interface Props {
  tables: number[];
  onChange: (tables: number[]) => void;
  onBack: () => void;
  onStart: () => void;
}

const ALL = Array.from({ length: 12 }, (_, i) => i + 1);

export default function TablesPicker({ tables, onChange, onBack, onStart }: Props) {
  const toggle = (n: number) =>
    onChange(tables.includes(n) ? tables.filter((x) => x !== n) : [...tables, n].sort((a, b) => a - b));
  return (
    <section className="panel">
      <h2>Which times tables?</h2>
      <p>Tap the tables you want to practise. You can pick as many as you like.</p>
      <div className="chips">
        {ALL.map((n) => (
          <button
            key={n}
            type="button"
            className="chip"
            aria-pressed={tables.includes(n)}
            aria-label={`${n} times table`}
            onClick={() => toggle(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="row">
        <button className="btn" type="button" onClick={() => onChange(ALL)}>Pick all</button>
        <button className="btn" type="button" onClick={() => onChange([])}>Clear</button>
        <span className="spacer" />
        <button className="btn" type="button" onClick={onBack}>Back</button>
        <button className="btn primary" type="button" disabled={!tables.length} onClick={onStart}>Start</button>
      </div>
    </section>
  );
}
