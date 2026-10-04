interface Item<T> {
  value: T;
  name: string;
  sub?: string;
}

interface Props<T> {
  label: string;
  items: Item<T>[];
  value: T;
  onChange: (v: T) => void;
  compact?: boolean;
}

export default function Segment<T extends string | number>({ label, items, value, onChange, compact }: Props<T>) {
  return (
    <div className="group">
      <span className="lab">{label}</span>
      <div className={`seg${compact ? " compact" : ""}`} role="group" aria-label={label}>
        {items.map((it) => (
          <button key={String(it.value)} type="button" aria-pressed={it.value === value} onClick={() => onChange(it.value)}>
            {it.name}
            {it.sub && <small>{it.sub}</small>}
          </button>
        ))}
      </div>
    </div>
  );
}
