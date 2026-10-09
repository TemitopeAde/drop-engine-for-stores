// An original 100 BPM bed for the launch film, synthesized here (no license to clear).
// Soft pad chords every bar, kick/hat groove from bar 2, a breakdown and riser
// over the "Open right on time." bar, the full groove back on the go-live hit,
// and a ring-out under the end card.
//   npx tsx scripts/music.ts
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { BAR, BARS, BEAT, b, golive, music } from "../src/films/launch/cues";
import { RATE, writeWav } from "./wav";

const root = resolve(import.meta.dirname, "..");
const dir = join(root, "public/audio/launch");
mkdirSync(dir, { recursive: true });

const length = Math.ceil((BARS * BAR + 1.5) * RATE);
const L = new Float32Array(length);
const R = new Float32Array(length);
const add = (i: number, l: number, r = l) => {
  if (i >= 0 && i < length) {
    L[i] += l;
    R[i] += r;
  }
};
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// Fmaj9 – Am7 – Dm9 – Bbmaj7(#11): warm, unresolved, forward-leaning.
const chords = [
  [53, 60, 64, 67, 69],
  [57, 60, 64, 67, 71],
  [50, 57, 60, 64, 65],
  [46, 57, 62, 65, 64],
];
const bass = [41, 45, 38, 46];

// Pad: detuned saws through a soft low-pass, slow attack, one chord per bar.
function pad(bar: number, level: number) {
  const chord = chords[bar % 4];
  const start = Math.round(b(bar) * RATE);
  const n = Math.round(BAR * 1.15 * RATE);
  for (const note of chord) {
    for (const detune of [-0.07, 0.07]) {
      const f = hz(note + detune);
      let phase = Math.random();
      let lp = 0;
      const pan = 0.5 + detune * 3;
      for (let i = 0; i < n; i++) {
        phase = (phase + f / RATE) % 1;
        const saw = 2 * phase - 1;
        lp += 0.035 * (saw - lp);
        const tt = i / RATE;
        const env = Math.min(1, tt / 0.35) * Math.min(1, (BAR * 1.15 - tt) / 0.5);
        const v = lp * env * level * 0.05;
        add(start + i, v * (1 - pan + 0.5), v * (pan + 0.5));
      }
    }
  }
}

function bassNote(at: number, midi: number, dur: number, level: number) {
  const start = Math.round(at * RATE);
  const f = hz(midi);
  const n = Math.round(dur * RATE);
  for (let i = 0; i < n; i++) {
    const tt = i / RATE;
    const env = Math.min(1, tt / 0.01) * Math.exp(-tt * 2.2) * Math.min(1, (dur - tt) / 0.05);
    add(start + i, Math.sin(2 * Math.PI * f * tt) * env * level * 0.32);
  }
}

function kick(at: number, level: number) {
  const start = Math.round(at * RATE);
  let phase = 0;
  for (let i = 0; i < 0.35 * RATE; i++) {
    const tt = i / RATE;
    const f = 48 + 90 * Math.exp(-tt * 30);
    phase += (2 * Math.PI * f) / RATE;
    add(start + i, Math.sin(phase) * Math.exp(-tt * 9) * level * 0.55);
  }
}

function hat(at: number, level: number) {
  const start = Math.round(at * RATE);
  let hp = 0;
  let prev = 0;
  for (let i = 0; i < 0.06 * RATE; i++) {
    const noise = Math.random() * 2 - 1;
    hp = 0.86 * (hp + noise - prev);
    prev = noise;
    const v = hp * Math.exp(-(i / RATE) * 70) * level * 0.09;
    add(start + i, v * 0.8, v);
  }
}

function snap(at: number, level: number) {
  const start = Math.round(at * RATE);
  let bp = 0;
  for (let i = 0; i < 0.18 * RATE; i++) {
    const noise = Math.random() * 2 - 1;
    bp += 0.3 * (noise - bp);
    add(start + i, bp * Math.exp(-(i / RATE) * 22) * level * 0.22);
  }
}

/** Filtered noise rising into `to`. */
function riser(from: number, to: number) {
  const start = Math.round(from * RATE);
  const n = Math.round((to - from) * RATE);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    lp += (0.01 + 0.25 * u * u) * (Math.random() * 2 - 1 - lp);
    add(start + i, lp * u * u * 0.22);
  }
}

for (let bar = 0; bar < BARS; bar++) {
  const t0 = b(bar);
  const full = t0 >= music.drumsIn && !(t0 >= music.breakdown && t0 < music.drop) && t0 < music.outro;
  pad(bar, t0 >= music.outro ? 0.9 : 1);
  if (t0 >= music.drumsIn && t0 < music.outro + BAR) bassNote(t0, bass[bar % 4], BAR * 0.95, t0 >= music.breakdown && t0 < music.drop ? 0.5 : 1);
  if (!full) continue;
  for (let beat = 0; beat < 4; beat++) {
    const at = t0 + beat * BEAT;
    if (beat === 0 || beat === 2) kick(at, 1);
    if (beat === 1 || beat === 3) snap(at, 0.8);
    hat(at + BEAT / 2, 1);
    if (bar >= 7) hat(at + BEAT * 0.75, 0.45);
  }
}
// Breakdown: the riser lands on the moment the drop opens.
riser(golive.zeroAt - 2.4, golive.zeroAt);
kick(golive.zeroAt, 1.3);
// The groove resumes after the go-live hit until the outro.
for (let at = golive.zeroAt; at < music.outro; at += BEAT) {
  const beat = Math.round((at - golive.zeroAt) / BEAT) % 4;
  if (at > golive.zeroAt && (beat === 0 || beat === 2)) kick(at, 1);
  if (beat === 1 || beat === 3) snap(at, 0.8);
  hat(at + BEAT / 2, 1);
}

// Normalize to a gentle peak.
let peak = 0;
for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
for (let i = 0; i < length; i++) {
  L[i] = (L[i] / peak) * 0.8;
  R[i] = (R[i] / peak) * 0.8;
}
writeWav(join(dir, "music.wav"), L, R);
console.log(`music.wav: ${(length / RATE).toFixed(1)} s`);
