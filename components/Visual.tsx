"use client";

import { useState } from "react";
import type { Visual as V } from "@/lib/types";

const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [100 + r * Math.sin(a), 100 - r * Math.cos(a)] as const;
};

function Clock({ h, m, minutes }: { h: number; m: number; minutes?: boolean }) {
  const [hx, hy] = pt(((h % 12) + m / 60) * 30, 42);
  const [mx, my] = pt(m * 6, 70);
  return (
    <svg
      className={`clock${minutes ? " withmins" : ""}`}
      viewBox={minutes ? "-28 -28 256 256" : "0 0 200 200"}
      role="img"
      aria-label={minutes ? "A clock face with the minutes counted in 5s around the outside" : "A clock face"}
    >
      {minutes &&
        Array.from({ length: 12 }, (_, i) => {
          const [x, y] = pt(i * 30, 110);
          return (
            <text key={`m${i}`} className="cmin" x={x} y={y} textAnchor="middle" dominantBaseline="central">
              {i * 5}
            </text>
          );
        })}
      <circle className="cface" cx="100" cy="100" r="92" />
      {Array.from({ length: 60 }, (_, i) => {
        const big = i % 5 === 0;
        const [x1, y1] = pt(i * 6, big ? 78 : 82);
        const [x2, y2] = pt(i * 6, 87);
        return <line key={i} className="tick" x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={big ? 3.5 : 1.5} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = pt((i + 1) * 30, 64);
        return (
          <text key={i} className="cnum" x={x} y={y} textAnchor="middle" dominantBaseline="central">
            {i + 1}
          </text>
        );
      })}
      <line className="hhand" x1="100" y1="100" x2={hx} y2={hy} />
      <line className="mhand" x1="100" y1="100" x2={mx} y2={my} />
      <circle className="hub" cx="100" cy="100" r="7" />
    </svg>
  );
}

function Pie({ d, shaded, labels }: { d: number; shaded: number[]; labels?: boolean }) {
  const P = (a: number, r = 80) => [100 + r * Math.sin(a), 100 - r * Math.cos(a)];
  // Number the shaded parts first, so the count of coloured parts is easy to read.
  const order = [...shaded.slice().sort((x, y) => x - y), ...Array.from({ length: d }, (_, i) => i).filter((i) => !shaded.includes(i))];
  return (
    <svg className="shape" viewBox="0 0 200 200" role="img" aria-label={`A circle cut into ${d} equal parts with ${shaded.length} shaded`}>
      {Array.from({ length: d }, (_, i) => {
        const a0 = (i / d) * 2 * Math.PI, a1 = ((i + 1) / d) * 2 * Math.PI;
        const [x0, y0] = P(a0), [x1, y1] = P(a1);
        return (
          <path
            key={i}
            className={shaded.includes(i) ? "sh" : "un"}
            d={`M100,100 L${x0.toFixed(2)},${y0.toFixed(2)} A80,80 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`}
          />
        );
      })}
      {labels &&
        Array.from({ length: d }, (_, i) => {
          const [x, y] = P(((i + 0.5) / d) * 2 * Math.PI, d === 2 ? 40 : 52);
          return (
            <text key={`l${i}`} className={`plabel${shaded.includes(i) ? " on" : ""}`} x={x} y={y} textAnchor="middle" dominantBaseline="central">
              {order.indexOf(i) + 1}
            </text>
          );
        })}
    </svg>
  );
}

function Bar({ d, shaded, labels }: { d: number; shaded: number[]; labels?: boolean }) {
  const w = 240 / d;
  const order = [...shaded.slice().sort((x, y) => x - y), ...Array.from({ length: d }, (_, i) => i).filter((i) => !shaded.includes(i))];
  return (
    <svg className="shape wide" viewBox="0 0 250 80" role="img" aria-label={`A bar cut into ${d} equal parts with ${shaded.length} shaded`}>
      {Array.from({ length: d }, (_, i) => (
        <rect key={i} className={shaded.includes(i) ? "sh" : "un"} x={5 + i * w} y={10} width={w} height={60} />
      ))}
      {labels &&
        Array.from({ length: d }, (_, i) => (
          <text key={`l${i}`} className={`plabel${shaded.includes(i) ? " on" : ""}`} x={5 + (i + 0.5) * w} y={40} textAnchor="middle" dominantBaseline="central">
            {order.indexOf(i) + 1}
          </text>
        ))}
    </svg>
  );
}

function Dots({ a, b, op }: { a: number; b: number; op: "+" | "-" }) {
  const dots =
    op === "+"
      ? [...Array(a).fill("dot"), ...Array(b).fill("dot b")]
      : Array.from({ length: a }, (_, i) => (i >= a - b ? "dot x" : "dot"));
  return (
    <div className="dots" aria-hidden="true">
      {dots.map((c, i) => (
        <span key={i} className={c} />
      ))}
    </div>
  );
}

function Groups({ groups, each, shade }: { groups: number; each: number; shade?: number }) {
  return (
    <div className="groups" aria-hidden="true">
      {Array.from({ length: groups }, (_, g) => (
        <div className={`g${shade !== undefined && g < shade ? " pick" : ""}`} key={g}>
          {Array.from({ length: each }, (_, i) => (
            <span key={i} className="dot" />
          ))}
        </div>
      ))}
    </div>
  );
}

function Objects({ emoji, name, n }: { emoji: string; name: string; n: number }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setDone((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div className="objs">
      {Array.from({ length: n }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`obj${done.has(i) ? " done" : ""}`}
          aria-label={`${name.replace(/s$/, "")}${done.has(i) ? ", counted" : ""}`}
          aria-pressed={done.has(i)}
          onClick={() => toggle(i)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function Blocks({ tens, ones }: { tens: number; ones: number }) {
  return (
    <div className="blocks" role="img" aria-label="Base ten blocks">
      {Array.from({ length: tens }, (_, t) => (
        <div className="ten" key={t}>
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      ))}
      {ones > 0 && (
        <div className="ones">
          {Array.from({ length: ones }, (_, i) => (
            <span className="one" key={i} />
          ))}
        </div>
      )}
    </div>
  );
}


const PLACES = ["Th", "H", "T", "O"];

function Columns({ a, b, op }: { a: number; b: number; op: "+" | "-" }) {
  const n = Math.max(String(a).length, String(b).length, String(op === "+" ? a + b : a).length);
  const digits = (v: number) => String(v).padStart(n, " ").split("");
  const cols = PLACES.slice(-n);
  return (
    <div className="columns" role="img" aria-label={`${a} ${op === "+" ? "plus" : "take away"} ${b}, set out in columns`} style={{ ["--n" as string]: n }}>
      <span />
      {cols.map((c) => <span key={c} className="head">{c}</span>)}
      <span />
      {digits(a).map((d, i) => <span key={`a${i}`}>{d.trim()}</span>)}
      <span className="op">{op === "+" ? "+" : "−"}</span>
      {digits(b).map((d, i) => <span key={`b${i}`}>{d.trim()}</span>)}
      <span className="rule" />
      <span />
      {cols.map((c) => <span key={`q${c}`} className="ans">?</span>)}
    </div>
  );
}

function Jumps({ step, count, ask }: { step: number; count: number; ask: "last" | "count" | "none" }) {
  const stops = Array.from({ length: count }, (_, i) => step * (i + 1));
  return (
    <div className="jumpwrap">
      <div className="jumps" role="img" aria-label={`Counting in ${step}s`}>
        <b className="stop zero">0</b>
        {stops.map((v, i) => {
          const hide = ask === "last" && i === count - 1;
          return (
            <span className="leg" key={i}>
              <small className="hop">+{step}</small>
              <b className={`stop${hide ? " ask" : ""}`}>
                {hide ? "?" : v}
                {ask !== "count" && <i>{i + 1}</i>}
              </b>
            </span>
          );
        })}
      </div>
      <small className="caption">
        {ask === "count" ? `How many jumps of ${step} to reach ${step * count}?` : ask === "last" ? `${count} jumps of ${step}` : `Count in ${step}s`}
      </small>
    </div>
  );
}

function Line({ from, to }: { from: number; to: number }) {
  return (
    <svg className="numline" viewBox="0 0 300 100" role="img" aria-label={`A jump on a number line from ${from} to ${to}`}>
      <defs>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="arrowfill" />
        </marker>
      </defs>
      <line className="axis" x1="10" y1="70" x2="290" y2="70" />
      <line className="tickl" x1="50" y1="60" x2="50" y2="80" />
      <line className="tickl" x1="250" y1="60" x2="250" y2="80" />
      <path className="arc" d="M50,60 Q150,10 250,60" markerEnd="url(#arrowhead)" />
      <text className="lbl" x="50" y="94" textAnchor="middle">{from}</text>
      <text className="lbl" x="250" y="94" textAnchor="middle">{to}</text>
      <text className="lbl q" x="150" y="20" textAnchor="middle">+ ?</text>
    </svg>
  );
}

function Pattern({ seq }: { seq: (number | null)[] }) {
  const gap = (x: number | null, y: number | null) => {
    if (x === null || y === null) return "";
    if (x !== 0 && y === x * 2 && seq.filter((v) => v !== null).length > 2) return "×2";
    return y >= x ? `+${y - x}` : `−${x - y}`;
  };
  return (
    <div className="pattern" role="img" aria-label="The pattern with the jumps between neighbours marked">
      {seq.map((v, i) => (
        <span className="leg" key={i}>
          {i > 0 && <small className="hop">{gap(seq[i - 1], v) || "?"}</small>}
          <b className={`stop${v === null ? " ask" : ""}`}>{v ?? "?"}</b>
        </span>
      ))}
    </div>
  );
}

function Mouth({ dir }: { dir: "<" | ">" }) {
  // Open crocodile jaws. The wide side faces the bigger number.
  const flip = dir === ">";
  return (
    <svg className="mouth" viewBox="0 0 60 50" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path className="jaw" d="M8,25 L55,4 L55,13 L22,25 L55,37 L55,46 Z" />
      <path className="tooth" d="M30,18 l4,5 l2,-7 M42,13 l4,5 l2,-7 M30,32 l4,-5 l2,7 M42,37 l4,-5 l2,7" />
      <circle className="eye" cx="44" cy="7" r="3" />
    </svg>
  );
}

function Croc() {
  return (
    <div className="croc" role="img" aria-label="The crocodile mouth opens towards the bigger number: 3 is less than 8, and 8 is greater than 3">
      <div className="crow"><b className="small">3</b><Mouth dir="<" /><b className="big">8</b></div>
      <div className="crow"><b className="big">8</b><Mouth dir=">" /><b className="small">3</b></div>
      <small className="caption">The mouth opens wide to eat the bigger number 🐊</small>
    </div>
  );
}

export default function Visual({ v }: { v: V }) {
  switch (v.type) {
    case "clock": return <Clock h={v.h} m={v.m} minutes={v.minutes} />;
    case "pie": return <Pie d={v.d} shaded={v.shaded} labels={v.labels} />;
    case "bar": return <Bar d={v.d} shaded={v.shaded} labels={v.labels} />;
    case "dots": return <Dots a={v.a} b={v.b} op={v.op} />;
    case "groups": return <Groups groups={v.groups} each={v.each} shade={v.shade} />;
    case "objects": return <Objects emoji={v.emoji} name={v.name} n={v.n} />;
    case "blocks": return <Blocks tens={v.tens} ones={v.ones} />;
    case "columns": return <Columns a={v.a} b={v.b} op={v.op} />;
    case "jumps": return <Jumps step={v.step} count={v.count} ask={v.ask} />;
    case "line": return <Line from={v.from} to={v.to} />;
    case "pattern": return <Pattern seq={v.seq} />;
    case "croc": return <Croc />;
  }
}
