// Narration: macOS `say` (Samantha) reads each line, ffmpeg trims the silence,
// and the measured durations go to vo.json for the cues.
//   npx tsx scripts/voice.ts
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ffmpeg from "ffmpeg-static";

import { lines } from "../src/films/launch/script";
import { wavDuration } from "./wav";

const root = resolve(import.meta.dirname, "..");
const dir = join(root, "public/audio/launch/vo");
mkdirSync(dir, { recursive: true });

const durations: Record<string, number> = {};
for (const [id, text] of Object.entries(lines)) {
  const raw = join(dir, `${id}.raw.aiff`);
  const out = join(dir, `${id}.wav`);
  execFileSync("say", ["-v", "Samantha", "-r", "168", "-o", raw, text]);
  // Trim leading and trailing silence, add a 20 ms tail, normalize the level.
  execFileSync(ffmpeg!, [
    "-v", "error", "-y", "-i", raw,
    "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.02,loudnorm=I=-16:TP=-1.5:LRA=7",
    "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", out,
  ]);
  rmSync(raw);
  durations[id] = Number(wavDuration(out).toFixed(3));
  console.log(id.padEnd(9), durations[id].toFixed(2), "s", text);
}
writeFileSync(join(root, "src/films/launch/vo.json"), JSON.stringify(durations, null, 2) + "\n");
