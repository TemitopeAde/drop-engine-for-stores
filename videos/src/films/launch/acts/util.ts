import type { Word } from "../../../kit/punchlines";
import { clamp01 } from "../../../kit/time";
import { voice, voiceLength } from "../cues";
import { lines, type LineId } from "../script";

/** The part of `text` typed by `t`, between `from` and `to`. */
export const typed = (text: string, t: number, from: number, to: number) =>
  text.slice(0, Math.round(text.length * clamp01((t - from) / (to - from))));

/** A caret: solid while typing, then blinking at the system rate. */
export const caretOn = (t: number, typingTo: number) => t < typingTo + 0.1 || Math.floor((t - typingTo) / 0.53) % 2 === 1;

/**
 * Splits a narration line into punchline rows whose words land as they are
 * spoken: each word's time is its share of the measured voice length.
 */
export function spoken(id: LineId, rows: number[] = [Infinity], accent: string[] = []): Word[][] {
  const words = lines[id].split(" ");
  const start = voice[id];
  const length = voiceLength[id];
  const weights = words.map((word) => word.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const timed = words.map((text, index) => {
    const at = start + (acc / total) * length - 0.06;
    acc += weights[index];
    return { text, at, accent: accent.includes(text) };
  });
  const out: Word[][] = [];
  let index = 0;
  for (const count of rows) {
    if (index >= timed.length) break;
    out.push(timed.slice(index, index + count));
    index += count;
  }
  return out;
}
