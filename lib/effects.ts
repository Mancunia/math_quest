/* Sound effects (Web Audio) and confetti. Browser only. */

let ac: AudioContext | null = null;

function tones(freqs: number[], step = 0.11, type: OscillatorType = "sine", vol = 0.18) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ac = ac || new Ctx();
    const t0 = ac.currentTime;
    freqs.forEach((f, i) => {
      const o = ac!.createOscillator();
      const g = ac!.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + i * step);
      g.gain.exponentialRampToValueAtTime(vol, t0 + i * step + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * step + step * 1.6);
      o.connect(g).connect(ac!.destination);
      o.start(t0 + i * step);
      o.stop(t0 + i * step + step * 1.8);
    });
  } catch {
    /* no audio available */
  }
}

export const sfx = {
  right: () => tones([660, 880], 0.09, "triangle"),
  wrong: () => tones([260, 200], 0.14, "sine", 0.14),
  hint: () => tones([523, 784], 0.1, "sine", 0.1),
  streak: () => tones([523, 659, 784, 1046], 0.08, "triangle"),
  finish: () => tones([523, 659, 784, 1046, 784, 1046], 0.12, "triangle"),
};

interface Piece { x: number; y: number; vx: number; vy: number; s: number; r: number; vr: number; c: string; life: number }
let canvas: HTMLCanvasElement | null = null;
let pieces: Piece[] = [];
let raf = 0;
const COLOURS = ["#FF7A2F", "#2F7BFF", "#8E4FE0", "#00998F", "#E2489E", "#FFC531", "#3E9E2E"];

export function confetti(n = 120) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "confetti";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  for (let i = 0; i < n; i++) {
    pieces.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 200, y: window.innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, s: 6 + Math.random() * 7,
      r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: COLOURS[i % COLOURS.length], life: 0,
    });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}

function tick() {
  if (!canvas) return;
  const cx = canvas.getContext("2d")!;
  cx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of pieces) {
    p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore();
  }
  pieces = pieces.filter((p) => p.y < canvas!.height + 40 && p.life < 300);
  if (pieces.length) raf = requestAnimationFrame(tick);
  else { raf = 0; cx.clearRect(0, 0, canvas.width, canvas.height); }
}
