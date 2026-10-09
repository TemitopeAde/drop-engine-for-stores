// The beat sheet. 100 BPM, 4/4: a beat is 0.6 s, a bar 2.4 s. Bars count from 0.
import vo from "./vo.json";
import type { LineId } from "./script";

export const BPM = 100;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
/** Seconds at a bar (from 0), beat (from 1) and a fraction of a beat. */
export const b = (bar: number, beat = 1, fraction = 0) => bar * BAR + (beat - 1 + fraction) * BEAT;

export const BARS = 19;
export const DURATION = BARS * BAR; // 45.6 s

/** Scene windows, each starting on a bar. */
export const scene = {
  open: [b(0), b(2)],
  setPunch: [b(2), b(3)],
  create: [b(3), b(6)],
  countPunch: [b(6), b(7)],
  product: [b(7), b(9)],
  waitPunch: [b(9), b(10)],
  waitlist: [b(10), b(13)],
  livePunch: [b(13), b(14)],
  live: [b(14), b(16)],
  end: [b(16), b(19)],
} as const;

/** When each narration line starts; its length comes from vo.json. */
export const voice: Record<LineId, number> = {
  open: b(0, 3),
  set: b(2, 1, 0.25),
  count: b(6, 1, 0.25),
  waitlist: b(9, 1, 0.25),
  live: b(13, 1, 0.25),
  name: b(16, 2),
  tagline: b(16, 4),
  cta: b(18, 1),
};
export const voiceLength = vo as Record<LineId, number>;

/** Create drop: what the cursor does, in film seconds. */
export const create = {
  nameClick: b(3, 2),
  typeFrom: b(3, 2, 0.3),
  typeTo: b(3, 4),
  startClick: b(4, 1),
  endClick: b(4, 2),
  zoneClick: b(4, 3),
  waitlistClick: b(4, 4),
  productsClick: b(5, 1),
  productsFrom: b(5, 1, 0.3),
  productsTo: b(5, 2, 0.5),
  publishClick: b(5, 3),
  saved: b(5, 3, 0.7),
};

/** The storefront waitlist and the dashboard list. */
export const join = {
  emailClick: b(10, 1, 0.5),
  typeFrom: b(10, 2),
  typeTo: b(10, 4),
  consentClick: b(11, 1),
  joinClick: b(11, 2),
  joined: b(11, 2, 0.75),
  dashboard: b(11, 4),
  newRow: b(12, 1, 0.5),
};

/** Go live: the last seconds tick at real speed, then the drop opens. */
export const golive = {
  zeroAt: b(15, 1), // 33.6 + 2.4 = 36.0: the moment the drop opens
};

export const music = {
  drumsIn: b(2),
  breakdown: b(13),
  drop: golive.zeroAt,
  outro: b(17),
};
