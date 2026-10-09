// The narration. Every line is spoken exactly as it appears on screen.
export const lines = {
  open: "Your next launch deserves a moment.",
  set: "Set the moment.",
  count: "Count down on every product page.",
  waitlist: "Build your waitlist.",
  live: "Open right on time.",
  name: "Drop Engine.",
  tagline: "Launch products on schedule, with a live countdown.",
  cta: "Get it on the Wix App Market.",
} as const;

export type LineId = keyof typeof lines;
