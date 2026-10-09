// Short, dry sound effects for the launch film, synthesized here.
// Each file's peak time goes to sfx-peaks.json so hits land on their cue.
//   npx tsx scripts/sfx.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { RATE, writeWav } from "./wav";

const root = resolve(import.meta.dirname, "..");
const dir = join(root, "public/audio/launch/sfx");
mkdirSync(dir, { recursive: true });

const make = (seconds: number, fn: (t: number, i: number) => number) => {
  const out = new Float32Array(Math.round(seconds * RATE));
  for (let i = 0; i < out.length; i++) out[i] = fn(i / RATE, i);
  return out;
};
const noise = () => Math.random() * 2 - 1;

const effects: Record<string, Float32Array> = {
  // A soft trackpad click.
  click: (() => {
    let lp = 0;
    return make(0.06, (t) => {
      lp += 0.5 * (noise() - lp);
      return (lp * 0.6 + Math.sin(2 * Math.PI * 1800 * t) * 0.3) * Math.exp(-t * 160);
    });
  })(),
  // Light key taps, about 12 per second, for a typing window.
  typing: (() => {
    let lp = 0;
    return make(2.5, (t) => {
      const local = t % 0.083;
      const tap = Math.floor(t / 0.083);
      const level = 0.6 + 0.4 * Math.abs(Math.sin(tap * 12.9898));
      lp += 0.45 * (noise() - lp);
      return lp * Math.exp(-local * 210) * level * 0.7;
    });
  })(),
  // A soft whoosh that peaks at 0.22 s.
  whoosh: (() => {
    let lp = 0;
    return make(0.6, (t) => {
      const env = t < 0.22 ? (t / 0.22) ** 2 : Math.exp(-(t - 0.22) * 9);
      lp += (0.02 + 0.12 * env) * (noise() - lp);
      return lp * env * 1.6;
    });
  })(),
  // Success chime: two soft sine bells, a fifth apart.
  chime: make(1.2, (t) => {
    const bell = (f: number, delay: number) => (t < delay ? 0 : Math.sin(2 * Math.PI * f * (t - delay)) * Math.exp(-(t - delay) * 4.5));
    return (bell(1046.5, 0) + 0.8 * bell(1568, 0.08) + 0.2 * bell(2093, 0.08)) * 0.35;
  }),
  // A small pop for the new waitlist row.
  pop: make(0.15, (t) => Math.sin(2 * Math.PI * (500 + 900 * Math.exp(-t * 40)) * t) * Math.exp(-t * 35) * 0.6),
  // A clock tick for the last seconds.
  tick: (() => {
    let hp = 0;
    let prev = 0;
    return make(0.05, (t) => {
      const n = noise();
      hp = 0.7 * (hp + n - prev);
      prev = n;
      return (hp * 0.5 + Math.sin(2 * Math.PI * 3200 * t) * 0.4) * Math.exp(-t * 220);
    });
  })(),
  // The go-live hit: a low thump under a bright bell bloom.
  launch: make(2.2, (t) => {
    const thump = Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-t * 25)) * t) * Math.exp(-t * 6);
    const bloom = [523.25, 659.25, 783.99, 1046.5].reduce((sum, f, k) => sum + Math.sin(2 * Math.PI * f * t + k) * Math.exp(-t * (2.2 + k * 0.4)), 0);
    return thump * 0.7 + bloom * 0.14 * Math.min(1, t / 0.01);
  }),
};

const peaks: Record<string, number> = {};
for (const [name, samples] of Object.entries(effects)) {
  let peak = 0;
  let at = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > peak) {
      peak = Math.abs(samples[i]);
      at = i;
    }
  }
  // Typing is a bed, not a hit: it starts on its cue.
  peaks[name] = name === "typing" ? 0 : Number((at / RATE).toFixed(4));
  writeWav(join(dir, `${name}.wav`), samples);
}
writeFileSync(join(root, "src/films/launch/sfx-peaks.json"), JSON.stringify(peaks, null, 2) + "\n");
console.log(peaks);
