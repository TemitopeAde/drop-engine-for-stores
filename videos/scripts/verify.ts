// Checks rendered deliverables by decoding them (port of the skill's verify.py, no Python needed).
//   npx tsx scripts/verify.ts out/drop-engine-launch/v1 --duration 45.6 [--bg 23,56,44] [--probe 6.0:960,900]
// For every .mp4/.webm: duration to the frame, frame 0 decodes to the background,
// each probe prints its decoded color, and files with sound report their loudness.
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";

const args = process.argv.slice(2);
const values = (name: string) => args.flatMap((arg, i) => (arg === name ? [args[i + 1]] : []));
const dir = resolve(args[0]);
const duration = Number(values("--duration")[0]);
const bg = (values("--bg")[0] ?? "23,56,44").split(",").map(Number);
const probes = values("--probe");
const ffmpeg = ffmpegPath!;

const pixel = (file: string, seconds: number, x: number, y: number) => {
  const raw = execFileSync(ffmpeg, ["-v", "error", "-ss", String(seconds), "-i", file, "-frames:v", "1", "-vf", `crop=2:2:${x}:${y},scale=1:1:in_range=tv:out_range=pc,format=rgb24`, "-f", "rawvideo", "-"]);
  return [raw[0], raw[1], raw[2]];
};

let failed = false;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) failed = true;
};

for (const name of readdirSync(dir).filter((file) => /\.(mp4|webm)$/.test(file))) {
  const file = join(dir, name);
  console.log(`\n${name}`);
  const info = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" }).stderr;
  const [, h, m, s] = info.match(/Duration: (\d+):(\d+):([\d.]+)/) ?? [];
  const seconds = Number(h) * 3600 + Number(m) * 60 + Number(s);
  check(Math.abs(seconds - duration) <= 1 / 60 + 0.02, `duration ${seconds.toFixed(3)} s (want ${duration})`);
  check(/1920x1080/.test(info), "1920×1080");
  const first = pixel(file, 0, 960, 540);
  check(first.every((v, i) => Math.abs(v - bg[i]) <= 2), `frame 0 center rgb(${first}) vs bg rgb(${bg})`);
  for (const probe of probes) {
    const [at, xy] = probe.split(":");
    const [x, y] = xy.split(",").map(Number);
    console.log(`     probe ${at}s @${x},${y}: rgb(${pixel(file, Number(at), x, y)})`);
  }
  if (/Audio:/.test(info)) {
    const loud = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-af", "ebur128=peak=true", "-vn", "-f", "null", "-"], { encoding: "utf8" }).stderr;
    const integrated = Number(loud.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)?.[0]);
    const peak = Number(loud.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)?.[0]);
    check(integrated > -19 && integrated < -13, `loudness ${integrated} LUFS (target -16)`);
    check(peak <= -0.5, `true peak ${peak} dBFS`);
  }
}
process.exit(failed ? 1 : 0);
