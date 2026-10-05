"use client";

import { useState } from "react";
import type { Shape2D, Solid, Visual as V } from "@/lib/types";
import { ANGLE_RULE, FLAT, SOLIDS, angleKind, capital, isSolid, shapeName, sideLabels, type Pt } from "@/lib/shapes";

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

const pts = (p: readonly Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

function Flat({ shape, marks, mini }: { shape: Shape2D; marks?: "sides" | "corners" | "symmetry"; mini?: boolean }) {
  const f = FLAT[shape];
  const what = marks === "sides" ? `, with its ${f.sides} sides numbered` : marks === "corners" ? `, with its ${f.sides} corners marked` : marks === "symmetry" ? `, with its ${f.symmetry} lines of symmetry drawn` : "";
  return (
    <svg className={`shape geo${mini ? " mini" : ""}`} viewBox="-16 -16 232 232" role="img" aria-label={`A ${f.name}${what}`}>
      {shape === "circle" ? <circle className="sh" cx="100" cy="100" r="82" /> : <polygon className="sh" points={pts(f.points)} />}
      {marks === "symmetry" && f.lines.map(([a, b], i) => <line key={i} className="symline" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />)}
      {marks === "corners" && f.points.map(([x, y], i) => <circle key={i} className="vdot" cx={x} cy={y} r="9" />)}
      {marks === "sides" &&
        sideLabels(f.points).map(([x, y], i) => (
          <text key={i} className="snum" x={x} y={y} textAnchor="middle" dominantBaseline="central">{i + 1}</text>
        ))}
    </svg>
  );
}

function SolidShape({ solid, marks, mini }: { solid: Solid; marks?: "vertices"; mini?: boolean }) {
  const s = SOLIDS[solid];
  const label = `A ${s.name}${marks ? `, with its ${s.vertices} vertices marked` : ""}`;
  let body: React.ReactNode;
  if (solid === "sphere") {
    body = (
      <>
        <circle className="sh" cx="100" cy="100" r="80" />
        <path className="hid" d="M20,100 A80,22 0 0 1 180,100" />
        <path className="edge thin" d="M20,100 A80,22 0 0 0 180,100" />
        <ellipse className="lite" cx="72" cy="66" rx="18" ry="12" />
      </>
    );
  } else if (solid === "cylinder") {
    body = (
      <>
        <path className="sh" d="M40,46 L40,154 A60,18 0 0 0 160,154 L160,46 Z" />
        <path className="hid" d="M40,154 A60,18 0 0 1 160,154" />
        <ellipse className="sh" cx="100" cy="46" rx="60" ry="18" />
        <ellipse className="lite" cx="100" cy="46" rx="60" ry="18" />
      </>
    );
  } else if (solid === "cone") {
    body = (
      <>
        <path className="sh" d="M40,156 L100,26 L160,156 A60,18 0 0 1 40,156 Z" />
        <path className="hid" d="M40,156 A60,18 0 0 1 160,156" />
      </>
    );
  } else {
    body = (
      <>
        {s.fronts.map((f, i) => <polygon key={i} className={`face f${i}`} points={pts(f)} />)}
        {s.hidden.map(([a, b], i) => <line key={`h${i}`} className="hid" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />)}
        {s.seen.map(([a, b], i) => <line key={`e${i}`} className="edge" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />)}
        {marks && s.corners.map(([x, y], i) => <circle key={`v${i}`} className="vdot" cx={x} cy={y} r="8" />)}
      </>
    );
  }
  return (
    <svg className={`shape geo solid${mini ? " mini" : ""}`} viewBox="-10 -10 220 220" role="img" aria-label={label}>
      {body}
    </svg>
  );
}

function Angle({ deg, withRef, mini }: { deg: number; withRef?: boolean; mini?: boolean }) {
  const V: Pt = [100, 110], r = 84, a = 48;
  const end = (len: number, d = deg): Pt => [V[0] + len * Math.cos((d * Math.PI) / 180), V[1] - len * Math.sin((d * Math.PI) / 180)];
  const [ax, ay] = end(a), [ex, ey] = end(r);
  const kind = angleKind(deg);
  return (
    <svg className={`shape geo angle${mini ? " mini" : ""}`} viewBox="0 0 200 200" role="img" aria-label={mini ? `A ${kind} angle` : "An angle between two lines"}>
      {deg === 90 ? (
        <path className="wedge" d={`M${V[0]},${V[1]} h30 v-30 h-30 Z`} />
      ) : (
        <path className="wedge" d={`M${V[0]},${V[1]} L${V[0] + a},${V[1]} A${a},${a} 0 ${deg > 180 ? 1 : 0} 0 ${ax.toFixed(1)},${ay.toFixed(1)} Z`} />
      )}
      {withRef && deg !== 90 && (
        <>
          <line className="refline" x1={V[0]} y1={V[1]} x2={V[0]} y2={V[1] - r} />
          <path className="refline" d={`M${V[0] + 16},${V[1]} v-16 h-16`} />
        </>
      )}
      <line className="arm" x1={V[0]} y1={V[1]} x2={V[0] + r} y2={V[1]} />
      <line className="arm" x1={V[0]} y1={V[1]} x2={ex.toFixed(1)} y2={ey.toFixed(1)} />
      <circle className="hubdot" cx={V[0]} cy={V[1]} r="5" />
    </svg>
  );
}

function Angles() {
  return (
    <div className="gallery" role="group" aria-label="Four types of angle">
      {[45, 90, 135, 250].map((d) => {
        const k = angleKind(d);
        return (
          <figure key={d}>
            <Angle deg={d} mini />
            <figcaption>{capital(k)}<small>{ANGLE_RULE[k]}</small></figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function Rect({ w, h, show }: { w: number; h: number; show: "sides" | "all" | "grid" }) {
  const u = Math.min(220 / w, 130 / h, 34);
  const W = w * u, H = h * u;
  return (
    <svg
      className="shape wide geo"
      viewBox={`-46 -28 ${W + 92} ${H + 56}`}
      role="img"
      aria-label={show === "grid" ? `A rectangle covered by ${h} rows of ${w} squares` : `A rectangle ${w} cm long and ${h} cm wide`}
    >
      <rect className="sh" x="0" y="0" width={W} height={H} />
      {show === "grid" && (
        <>
          {Array.from({ length: w - 1 }, (_, i) => <line key={`x${i}`} className="gridl" x1={(i + 1) * u} y1="0" x2={(i + 1) * u} y2={H} />)}
          {Array.from({ length: h - 1 }, (_, i) => <line key={`y${i}`} className="gridl" x1="0" y1={(i + 1) * u} x2={W} y2={(i + 1) * u} />)}
        </>
      )}
      {show !== "grid" && (
        <>
          <text className="rlab" x={W / 2} y="-9" textAnchor="middle">{w} cm</text>
          <text className="rlab" x={W + 8} y={H / 2} dominantBaseline="central">{h} cm</text>
          {show === "all" && (
            <>
              <text className="rlab" x={W / 2} y={H + 21} textAnchor="middle">{w} cm</text>
              <text className="rlab" x="-8" y={H / 2} textAnchor="end" dominantBaseline="central">{h} cm</text>
            </>
          )}
        </>
      )}
    </svg>
  );
}

function Gallery({ items }: { items: (Shape2D | Solid)[] }) {
  return (
    <div className="gallery" role="group" aria-label="Shapes with their names">
      {items.map((s) => (
        <figure key={s}>
          {isSolid(s) ? <SolidShape solid={s} mini /> : <Flat shape={s} mini />}
          <figcaption>{capital(shapeName(s))}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Named({ children, name }: { children: React.ReactNode; name?: string }) {
  if (!name) return <>{children}</>;
  return (
    <figure className="named">
      {children}
      <figcaption>{capital(name)}</figcaption>
    </figure>
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
    case "shape2d": return <Named name={v.label ? FLAT[v.shape].name : undefined}><Flat shape={v.shape} marks={v.marks} /></Named>;
    case "solid": return <Named name={v.label ? SOLIDS[v.solid].name : undefined}><SolidShape solid={v.solid} marks={v.marks} /></Named>;
    case "angle": return <Angle deg={v.deg} withRef={v.ref} />;
    case "angles": return <Angles />;
    case "rect": return <Rect w={v.w} h={v.h} show={v.show} />;
    case "gallery": return <Gallery items={v.items} />;
  }
}
