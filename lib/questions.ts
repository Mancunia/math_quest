import type { Choice, Level, Question, TopicId } from "./types";
import { topicById } from "./topics";

/* ---------- helpers ---------- */
export const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pad = (n: number) => String(n).padStart(2, "0");
const fr = (k: number, d: number) => `{${k}/${d}}`;
const pickParts = (d: number, k: number) => shuffle([...Array(d).keys()]).slice(0, k);
const line = (from: number, to: number) => ({ type: "line", from, to }) as const;

function num(text: string, answer: number, extra: Partial<Question> & { explain: string }): Question {
  return { text, answer: String(answer), kind: "num", ...extra };
}

/** Three wrong answers close to the right one, plus the right one, shuffled. */
export function numChoices(answer: string): Choice[] {
  const ans = Number(answer);
  const deltas =
    ans < 20 ? [1, -1, 2, -2, 3, -3, 10] : ans < 200 ? [1, -1, 2, -2, 10, -10, 9, 11, -9] : [1, -1, 10, -10, 100, -100, 20, -20];
  const out = new Set<number>();
  for (const d of shuffle(deltas)) {
    const v = ans + d;
    if (v >= 0 && v !== ans) out.add(v);
    if (out.size === 3) break;
  }
  let extra = 4;
  while (out.size < 3) out.add(ans + extra++);
  return shuffle([ans, ...out]).map((v) => ({ v: String(v), label: String(v) }));
}

function mulExtras(a: number, b: number) {
  // Skip count in the bigger number, so there are fewer jumps.
  const step = Math.max(a, b), times = Math.min(a, b);
  const seq = [1, 2, 3].map((i) => step * i).join(", ");
  const small = a * b <= 30 && a > 0 && b > 0 && a <= 6;
  return {
    hint: small ? `${a} groups of ${b}. Count them all!` : `Count in ${step}s, ${times} times: ${seq}…`,
    hintVisual: small ? ({ type: "groups", groups: a, each: b } as const) : times > 0 ? ({ type: "jumps", step, count: times, ask: "last" } as const) : undefined,
    explain: `${a} × ${b} = ${a * b}`,
  };
}

const OBJECTS: [string, string][] = [
  ["🍎", "apples"], ["⭐", "stars"], ["🐞", "ladybirds"], ["🐟", "fish"], ["🌼", "flowers"],
  ["🚗", "cars"], ["🎈", "balloons"], ["🐥", "chicks"], ["🍓", "strawberries"], ["⚽", "balls"],
];

/* ---------- generators ---------- */
type Gen = (L: Level, tables: number[]) => Question;

const G: Record<TopicId, Gen> = {
  add(L) {
    let a: number, b: number;
    if (L === 0) { a = rnd(0, 10); b = rnd(0, 10 - a); }
    else if (L === 1) { a = rnd(10, 60); b = rnd(2, Math.min(39, 99 - a)); }
    else { a = rnd(100, 600); b = rnd(25, 399); }
    const ta = a - (a % 10), tb = b - (b % 10);
    return num(`${a} + ${b} = __`, a + b, {
      hint: L === 0 ? "Count all the dots." : L === 1 ? `Add the tens first, then the ones. ${ta} + ${tb} = ${ta + tb}` : "Add the ones, then the tens, then the hundreds. Remember to carry!",
      hintVisual: L === 0 ? { type: "dots", a, b, op: "+" } : { type: "columns", a, b, op: "+" },
      explain: `${a} + ${b} = ${a + b}`,
    });
  },
  sub(L) {
    let a: number, b: number;
    if (L === 0) { a = rnd(2, 10); b = rnd(0, a); }
    else if (L === 1) { a = rnd(20, 99); b = rnd(3, a - 5); }
    else { a = rnd(200, 999); b = rnd(35, a - 50); }
    return num(`${a} − ${b} = __`, a - b, {
      hint: L === 0 ? `Cross out ${b} and count what is left.` : L === 1 ? `Count back from ${a}. Take away the tens first, then the ones.` : "Take away the hundreds, then the tens, then the ones. You may need to exchange.",
      hintVisual: L === 0 ? { type: "dots", a, b, op: "-" } : { type: "columns", a, b, op: "-" },
      explain: `${a} − ${b} = ${a - b}`,
    });
  },
  mul(L) {
    let a: number, b: number;
    if (L === 0) { a = pick([1, 2, 5, 10]); b = rnd(1, 10); }
    else if (L === 1) { a = rnd(2, 10); b = rnd(1, 10); }
    else if (Math.random() < 0.3) { a = rnd(11, 25); b = rnd(2, 9); }
    else { a = rnd(2, 12); b = rnd(2, 12); }
    if (Math.random() < 0.5) [a, b] = [b, a];
    return num(`${a} × ${b} = __`, a * b, mulExtras(a, b));
  },
  div(L) {
    let d: number, q: number;
    if (L === 0) { d = pick([2, 5, 10]); q = rnd(1, 10); }
    else if (L === 1) { d = rnd(2, 10); q = rnd(1, 10); }
    else { d = rnd(2, 12); q = rnd(2, 12); }
    const t = d * q;
    const small = t <= 30 && d <= 6;
    return num(`${t} ÷ ${d} = __`, q, {
      hint: small
        ? `Share ${t} into ${d} equal groups. How many in each group?`
        : `How many ${d}s make ${t}? Count in ${d}s: ${[1, 2, 3].map((i) => d * i).join(", ")}… and keep going until you reach ${t}.`,
      hintVisual: small ? { type: "groups", groups: d, each: q } : { type: "jumps", step: d, count: q, ask: "count" },
      explain: `${t} ÷ ${d} = ${q}, because ${d} × ${q} = ${t}`,
    });
  },
  tables(L, tables) {
    const T = tables.length ? tables : [2, 5, 10];
    const a = pick(T), b = rnd(1, L === 0 ? 10 : 12);
    const flip = Math.random() < 0.3;
    const [x, y] = flip ? [b, a] : [a, b];
    return num(`${x} × ${y} = __`, a * b, mulExtras(x, y));
  },
  count(L) {
    if (L === 2) {
      const t = rnd(1, 9), o = rnd(0, 9);
      return num("What number do the blocks show?", 10 * t + o, {
        visual: { type: "blocks", tens: t, ones: o }, long: true, key: `b${t}-${o}`,
        hint: "Each tall bar is 10. Count the bars in 10s, then count on the small cubes.",
        hintVisual: { type: "jumps", step: 10, count: t, ask: "none" },
        explain: `${t} tens and ${o} ones make ${10 * t + o}`,
        review: `Blocks: ${t} tens, ${o} ones`,
      });
    }
    const n = L === 0 ? rnd(1, 10) : rnd(11, 20);
    const [emoji, name] = pick(OBJECTS);
    return num(`How many ${name}?`, n, {
      visual: { type: "objects", emoji, name, n }, long: true, key: `c${n}`,
      hint: L === 0 ? "Tap each one as you count it so you don't count it twice." : "Each full row has 5. Count the rows in 5s, then count on.",
      hintVisual: L === 0 ? undefined : { type: "jumps", step: 5, count: Math.floor(n / 5), ask: "none" },
      explain: `There are ${n} ${name}.`,
      review: `Count the ${name} (${n})`,
    });
  },
  compare(L) {
    let A: string, B: string, a: number, b: number;
    if (L === 0) { a = rnd(0, 20); b = Math.random() < 0.2 ? a : rnd(0, 20); A = String(a); B = String(b); }
    else if (L === 1) {
      a = rnd(10, 100);
      b = Math.random() < 0.2 ? a : Math.random() < 0.5 ? rnd(10, 100) : a + pick([-10, -1, 1, 10, 9, -9]);
      b = Math.max(0, b); A = String(a); B = String(b);
    } else {
      const kind = pick(["mul", "add", "big"] as const);
      if (kind === "mul") { const x = rnd(2, 12), y = rnd(2, 12); a = x * y; A = `${x} × ${y}`; }
      else if (kind === "add") { const x = rnd(15, 80), y = rnd(15, 80); a = x + y; A = `${x} + ${y}`; }
      else { a = rnd(100, 999); A = String(a); }
      b = Math.random() < 0.25 ? a : a + pick([-12, -5, -2, -1, 1, 2, 5, 12]); B = String(b);
    }
    const ans = a < b ? "<" : a > b ? ">" : "=";
    const words: Record<string, string> = { "<": "is less than", ">": "is greater than", "=": "is equal to" };
    const isExpr = A !== String(a);
    return {
      text: `${A} __ ${B}`, answer: ans, kind: "choice",
      choices: [
        { v: "<", label: "<", sub: "less than" },
        { v: "=", label: "=", sub: "equal to" },
        { v: ">", label: ">", sub: "greater than" },
      ],
      hint: "The crocodile's mouth always opens towards the bigger number. If both sides are the same, use =.",
      hintVisual: { type: "croc" },
      explain: `${A}${isExpr ? ` (= ${a})` : ""} ${words[ans]} ${B}`,
    };
  },
  missing(L) {
    if (L === 0) {
      const c = rnd(2, 10), a = rnd(0, c);
      return Math.random() < 0.5
        ? num(`${a} + __ = ${c}`, c - a, { hint: `Start at ${a} and count up to ${c}. How many did you count?`, hintVisual: line(a, c), explain: `${a} + ${c - a} = ${c}` })
        : num(`__ + ${a} = ${c}`, c - a, { hint: `What do you add to ${a} to make ${c}? Try ${c} − ${a}.`, hintVisual: line(a, c), explain: `${c - a} + ${a} = ${c}` });
    }
    if (L === 1) {
      if (Math.random() < 0.5) {
        const c = rnd(15, 60), a = rnd(2, c - 2);
        return num(`${a} + __ = ${c}`, c - a, { hint: `Work it out with ${c} − ${a}.`, hintVisual: line(a, c), explain: `${a} + ${c - a} = ${c}` });
      }
      const a = rnd(15, 60), b = rnd(2, a - 2);
      return num(`${a} − __ = ${a - b}`, b, { hint: `How far is it from ${a - b} up to ${a}?`, hintVisual: line(a - b, a), explain: `${a} − ${b} = ${a - b}` });
    }
    const k = pick(["mul", "div", "add", "sub"] as const);
    if (k === "mul") { const a = rnd(2, 12), b = rnd(2, 12); return num(`${a} × __ = ${a * b}`, b, { hint: `Think: ${a * b} ÷ ${a} = ?`, hintVisual: { type: "jumps", step: a, count: b, ask: "count" }, explain: `${a} × ${b} = ${a * b}` }); }
    if (k === "div") { const d = rnd(2, 12), q = rnd(2, 12); return num(`__ ÷ ${d} = ${q}`, d * q, { hint: `Use the opposite: ${q} × ${d} = ?`, hintVisual: { type: "jumps", step: d, count: q, ask: "last" }, explain: `${d * q} ÷ ${d} = ${q}` }); }
    if (k === "add") { const c = rnd(100, 300), a = rnd(20, c - 20); return num(`${a} + __ = ${c}`, c - a, { hint: `Work it out with ${c} − ${a}.`, hintVisual: line(a, c), explain: `${a} + ${c - a} = ${c}` }); }
    const a = rnd(100, 300), b = rnd(20, a - 20);
    return num(`${a} − __ = ${a - b}`, b, { hint: `Work it out with ${a} − ${a - b}.`, hintVisual: line(a - b, a), explain: `${a} − ${b} = ${a - b}` });
  },
  pattern(L) {
    let seq: number[], rule: string, miss: number;
    const five = [0, 1, 2, 3, 4];
    if (L === 0) {
      const s = rnd(0, 10), step = pick([1, 2]);
      seq = five.map((i) => s + i * step); rule = `It goes up by ${step} each time.`; miss = 4;
    } else if (L === 1) {
      const step = pick([2, 3, 4, 5, 10]);
      if (Math.random() < 0.3) { const s = step * rnd(5, 10); seq = five.map((i) => s - i * step); rule = `It goes down by ${step} each time.`; }
      else { const s = step * rnd(0, 5); seq = five.map((i) => s + i * step); rule = `It goes up by ${step} each time.`; }
      miss = rnd(1, 4);
    } else {
      if (Math.random() < 0.3) { const s = pick([1, 2, 3, 5]); seq = five.map((i) => s * 2 ** i); rule = "Each number is double the one before."; }
      else {
        const step = pick([4, 6, 7, 8, 9, 11, 12, 25, 50]), down = Math.random() < 0.35;
        const s = down ? step * rnd(5, 12) : rnd(0, 20);
        seq = five.map((i) => (down ? s - i * step : s + i * step));
        rule = `It goes ${down ? "down" : "up"} by ${step} each time.`;
      }
      miss = rnd(0, 4);
    }
    return num(seq.map((v, i) => (i === miss ? "__" : v)).join(", "), seq[miss], {
      hint: "Find the difference between two numbers that sit next to each other.",
      hintVisual: { type: "pattern", seq: seq.map((v, i) => (i === miss ? null : v)) },
      explain: `${rule} The missing number is ${seq[miss]}.`,
      review: seq.map((v, i) => (i === miss ? "?" : v)).join(", "),
    });
  },
  fraction(L) {
    const shaded = (dens: number[]): Question => {
      const d = pick(dens), k = d === 2 ? 1 : rnd(1, d - 1);
      const cands: [number, number][] = [[d - k, d], [k, d - k], [k, d + 1], [k + 1, d], [k - 1, d], [1, k + 1]];
      // A wrong option must not be equal in value to the answer (e.g. 1/3 when 2/6 is shaded).
      const sameValue = (a: number, b: number) => a * d === b * k;
      const seen = new Set([`${k}/${d}`]);
      const opts: Choice[] = [];
      for (const [a, b] of shuffle(cands.filter(([a, b]) => a > 0 && b > 1 && a < b && !sameValue(a, b)))) {
        const id = `${a}/${b}`;
        if (!seen.has(id)) { seen.add(id); opts.push({ v: id, label: fr(a, b) }); }
        if (opts.length === 3) break;
      }
      for (let n = 1; opts.length < 3; n++) {
        const id = `${n}/${d + n + 1}`;
        if (!seen.has(id) && !sameValue(n, d + n + 1)) { seen.add(id); opts.push({ v: id, label: fr(n, d + n + 1) }); }
      }
      const parts = pickParts(d, k);
      const pie = Math.random() < 0.5;
      return {
        text: "What fraction is shaded?", long: true, kind: "choice",
        visual: pie ? { type: "pie", d, shaded: parts } : { type: "bar", d, shaded: parts },
        hintVisual: pie ? { type: "pie", d, shaded: parts, labels: true } : { type: "bar", d, shaded: parts, labels: true },
        answer: `${k}/${d}`, key: `f${k}/${d}-${parts.join("")}`,
        choices: shuffle([{ v: `${k}/${d}`, label: fr(k, d) }, ...opts]),
        hint: "Count all the equal parts: that is the bottom number. Count the coloured parts: that is the top number.",
        explain: `${k} out of ${d} equal parts are shaded, so it is ${fr(k, d)}.`,
        review: `Shape with ${k} of ${d} parts shaded`,
      };
    };
    if (L === 0) return shaded([2, 3, 4]);
    if (L === 1) {
      if (Math.random() < 0.5) return shaded([2, 3, 4, 5, 6, 8]);
      const d = pick([2, 3, 4, 5, 10]), n = d * rnd(1, 10);
      return num(`${fr(1, d)} of ${n} = __`, n / d, {
        hint: `Share ${n} into ${d} equal groups. How many are in one group?`,
        hintVisual: { type: "groups", groups: d, each: n / d, shade: 1 },
        explain: `${n} ÷ ${d} = ${n / d}, so ${fr(1, d)} of ${n} is ${n / d}.`,
      });
    }
    if (Math.random() < 0.3) return shaded([5, 6, 8, 10, 12]);
    const d = pick([3, 4, 5, 6, 8, 10]), k = rnd(2, d - 1), n = d * rnd(2, 10);
    return num(`${fr(k, d)} of ${n} = __`, (k * n) / d, {
      hint: `First find ${fr(1, d)} of ${n} by dividing by ${d}. Then multiply by ${k}.`,
      hintVisual: { type: "groups", groups: d, each: n / d, shade: k },
      explain: `${fr(1, d)} of ${n} is ${n / d}, so ${fr(k, d)} is ${k} × ${n / d} = ${(k * n) / d}.`,
    });
  },
  time(L) {
    const words = (h: number, m: number) => {
      const nx = (h % 12) + 1;
      return m === 0 ? `${h} o'clock` : m === 15 ? `quarter past ${h}` : m === 30 ? `half past ${h}` : m === 45 ? `quarter to ${nx}` : "";
    };
    const fmt = (h: number, m: number) => `${h}:${pad(m)}`;
    const wrapH = (x: number) => ((((x - 1) % 12) + 12) % 12) + 1;
    const h = rnd(1, 12);
    let m: number, later = 0;
    if (L === 0) m = pick([0, 30]);
    else if (L === 1) m = Math.random() < 0.5 ? pick([0, 15, 30, 45]) : 5 * rnd(0, 11);
    else { m = 5 * rnd(0, 11); if (Math.random() < 0.4) later = pick([10, 15, 20, 25, 30, 40, 45]); }
    let ah = h, am = m;
    if (later) { const tot = h * 60 + m + later; ah = Math.floor(tot / 60) % 12 || 12; am = tot % 60; }
    const ans = fmt(ah, am);
    const cands = [
      fmt(wrapH(ah + 1), am), fmt(wrapH(ah - 1), am), fmt(ah, (am + 5) % 60),
      fmt(ah, (am + 55) % 60), fmt(ah, (am + 30) % 60), fmt(wrapH(ah + 1), (am + 15) % 60),
    ];
    if (am % 5 === 0 && am > 0) cands.unshift(fmt(am / 5, (ah * 5) % 60)); // hands mixed up
    const opts: string[] = [];
    const seen = new Set([ans]);
    for (const c of cands) { if (!seen.has(c)) { seen.add(c); opts.push(c); } if (opts.length === 3) break; }
    const choice = (t: string): Choice => {
      const [hh, mm] = t.split(":").map(Number);
      const w = L < 2 ? words(hh, mm) : "";
      return { v: t, label: t, sub: w || undefined };
    };
    const now = fmt(h, m);
    const w = L < 2 ? words(h, m) : "";
    return {
      text: later ? `The clock shows the time now. What time will it be in ${later} minutes?` : "What time does the clock show?",
      long: true, visual: { type: "clock", h, m }, hintVisual: { type: "clock", h, m, minutes: true }, answer: ans, kind: "choice",
      choices: shuffle([ans, ...opts]).map(choice),
      hint: later
        ? `First read the clock. Then move the long hand on by ${later} minutes, counting in 5s.`
        : "The short hand points to the hour. The long hand shows the minutes: count in 5s from the 12.",
      explain: later ? `The clock shows ${now}. ${later} minutes later it is ${ans}.` : `The clock shows ${ans}${w ? ` (${w})` : ""}.`,
      key: `t${now}${later}`,
      review: later ? `${now} + ${later} minutes` : `Clock showing ${now}`,
    };
  },
  mixed(L, tables) {
    const t = pick(["add", "sub", "mul", "div", "missing", "compare", "pattern", "fraction", "time"] as const);
    const q = G[t](L, tables);
    q.tag = topicById(t).name;
    return q;
  },
};

export function generate(topic: TopicId, level: Level, tables: number[]): Question {
  return G[topic](level, tables);
}

/** Exposed so tests can check every generator. */
export const GENERATORS = G;
