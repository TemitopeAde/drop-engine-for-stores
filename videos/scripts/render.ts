// Final render: a 240 fps master (4 subframes per 60 fps frame), blended with
// ffmpeg tmix into 60 fps motion blur, then the deliverables.
//   npx tsx scripts/render.ts <CompositionId> <file-name> --duration 45.6 [--poster 44.8] [--version v1]
// ffmpeg is ffmpeg-static (Remotion's bundled ffmpeg has no tmix/select).
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const [composition, name] = args;
const duration = Number(flag("--duration"));
const posterSeconds = Number(flag("--poster") ?? duration / 2);
const version = flag("--version") ?? "v1";
if (!composition || !name || !duration) throw new Error("Usage: npx tsx scripts/render.ts <CompositionId> <file-name> --duration <s> [--poster <s>] [--version v1]");

const root = resolve(import.meta.dirname, "..");
const out = join(root, "out", name, version);
mkdirSync(out, { recursive: true });
const ffmpeg = ffmpegPath!;
const run = (command: string, list: string[]) => execFileSync(command, list, { cwd: root, stdio: "inherit" });
const master = join(out, "master-240.mp4");
const audio = join(out, "audio.wav");
const mixed = join(out, "audio-norm.wav");
const blurred = join(out, "blurred-60.mov");

// 1. The 240 fps master, muted, 4:4:4.
run("npx", ["remotion", "render", "src/index.ts", composition, master, "--props", JSON.stringify({ fps: 240 }), "--codec", "h264", "--crf", "8", "--pixel-format", "yuv444p", "--image-format", "png", "--muted", "--concurrency", "8", "--log", "error"]);
// 2. The mix once at 60 fps, then loudness-normalized for web playback.
run("npx", ["remotion", "render", "src/index.ts", composition, audio, "--codec", "wav", "--log", "error"]);
run(ffmpeg, ["-v", "error", "-y", "-i", audio, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", mixed]);
// 3. Motion blur: average 4 subframes, keep 1 -> 60 fps. The master is untagged limited-range BT.601.
run(ffmpeg, [
  "-v", "error", "-y", "-i", master,
  "-vf", "tmix=frames=4:weights='1 1 1 1',select='not(mod(n+1\\,4))',setpts=N/(60*TB),scale=in_range=tv:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv444p10le",
  "-r", "60", "-c:v", "prores_ks", "-profile:v", "4444", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
  blurred,
]);
const h264 = ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv", "-movflags", "+faststart"];
// 4. Deliverables: with sound, muted, WebM, poster.
run(ffmpeg, ["-v", "error", "-y", "-i", blurred, "-i", mixed, ...h264, "-c:a", "aac", "-b:a", "256k", "-shortest", join(out, `${name}.mp4`)]);
run(ffmpeg, ["-v", "error", "-y", "-i", blurred, ...h264, "-an", join(out, `${name}-muted.mp4`)]);
run(ffmpeg, ["-v", "error", "-y", "-i", blurred, "-i", mixed, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-row-mt", "1", "-pix_fmt", "yuv420p", "-c:a", "libopus", "-b:a", "160k", join(out, `${name}.webm`)]);
run(ffmpeg, ["-v", "error", "-y", "-ss", String(posterSeconds), "-i", blurred, "-frames:v", "1", "-q:v", "2", join(out, "poster.jpg")]);

for (const file of [master, blurred, audio, mixed]) rmSync(file);
for (const file of [`${name}.mp4`, `${name}-muted.mp4`, `${name}.webm`, "poster.jpg"]) {
  console.log(`${file}: ${(statSync(join(out, file)).size / 1e6).toFixed(1)} MB`);
}
