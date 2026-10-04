import { Fragment } from "react";

/**
 * Renders question text with two tokens:
 *   "__"    the blank (shows `blank` content, styled as a dashed box)
 *   "{k/d}" a stacked fraction
 */
export function Frac({ k, d }: { k: number | string; d: number | string }) {
  return (
    <span className="frac" aria-label={`${k} over ${d}`}>
      <span>{k}</span>
      <span>{d}</span>
    </span>
  );
}

interface Props {
  text: string;
  blank?: React.ReactNode;
  filled?: boolean;
}

export default function RichText({ text, blank = "?", filled = false }: Props) {
  const parts = text.split(/(__|\{\d+\/\d+\})/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p === "__")
          return (
            <span key={i} className={`blank${filled ? " filled" : ""}`}>
              {blank}
            </span>
          );
        const m = p.match(/^\{(\d+)\/(\d+)\}$/);
        if (m) return <Frac key={i} k={m[1]} d={m[2]} />;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/** Turns "3/4" style answers into a fraction, otherwise plain text. */
export function AnswerLabel({ value }: { value: string }) {
  const m = value.match(/^(\d+)\/(\d+)$/);
  return m ? <Frac k={m[1]} d={m[2]} /> : <>{value}</>;
}
