// Drop Engine launch film. 1920×1080, 45.6 s, 100 BPM. See cues.ts for the beat sheet.
import { loadFont } from "@remotion/google-fonts/Roboto";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";

import { TargetLog } from "../../kit/debug";
import { useTime } from "../../kit/time";
import { color } from "../../tokens";
import { createClicks } from "./acts/Create";
import { Create } from "./acts/Create";
import { Store, storeClicks } from "./acts/Store";
import { Titles } from "./acts/Titles";
import { WaitlistDash } from "./acts/WaitlistDash";
import { create, DURATION, golive, join, scene, voice, voiceLength } from "./cues";
import type { LineId } from "./script";

loadFont("normal", { weights: ["400", "700", "800"], subsets: ["latin"] });

/** `mix`: "full" is voice, music and every effect; "ui" keeps only the clicks and typing. */
export type Mix = "full" | "ui";

export function Launch({ debug, mix = "full" }: { debug?: boolean; mix?: Mix }) {
  const t = useTime();
  return (
    <AbsoluteFill style={{ background: color.bg }}>
      <Titles t={t} />
      <Create t={t} debug={debug} />
      <Store t={t} debug={debug} />
      <WaitlistDash t={t} debug={debug} />
      {debug ? <TargetLog /> : null}
      <Mix mix={mix} />
    </AbsoluteFill>
  );
}

// Sound effects: peaks measured by scripts/sfx.ts, so each hit lands on its cue.
import peaks from "./sfx-peaks.json";
type Sfx = keyof typeof peaks;
const sfx: { name: Sfx; at: number; volume: number; length?: number }[] = [
  ...[scene.setPunch[0], scene.countPunch[0], scene.waitPunch[0], scene.livePunch[0], scene.end[0]].map((at) => ({ name: "whoosh" as Sfx, at, volume: 0.32 })),
  ...[...createClicks, ...storeClicks].map((at) => ({ name: "click" as Sfx, at, volume: 0.42 })),
  { name: "typing", at: create.typeFrom, volume: 0.3, length: create.typeTo - create.typeFrom },
  { name: "typing", at: join.typeFrom, volume: 0.3, length: join.typeTo - join.typeFrom },
  { name: "chime", at: create.saved, volume: 0.32 },
  { name: "chime", at: join.joined, volume: 0.32 },
  { name: "pop", at: join.newRow, volume: 0.35 },
  { name: "tick", at: golive.zeroAt - 2, volume: 0.3 },
  { name: "tick", at: golive.zeroAt - 1, volume: 0.3 },
  { name: "launch", at: golive.zeroAt, volume: 0.45 },
];

const lineIds = Object.keys(voice) as LineId[];

/** Music level: ducks under the voice, eases back in between lines. */
function musicVolume(t: number) {
  let duck = 0;
  for (const id of lineIds) {
    const start = voice[id] - 0.15;
    const end = voice[id] + voiceLength[id] + 0.25;
    const inside = Math.min(1, Math.max(0, Math.min((t - start) / 0.15, (end - t) / 0.35)));
    duck = Math.max(duck, inside);
  }
  const fadeOut = Math.min(1, Math.max(0, (DURATION - t) / 1.2));
  return (0.42 - 0.24 * duck) * fadeOut;
}

const uiSounds: Sfx[] = ["click", "typing"];

function Mix({ mix }: { mix: Mix }) {
  const full = mix === "full";
  const { fps } = useVideoConfig();
  const at = (seconds: number) => Math.round(seconds * fps);
  return (
    <>
      {full ? <Audio src={staticFile("audio/launch/music.wav")} volume={(frame) => musicVolume(frame / fps)} /> : null}
      {(full ? lineIds : []).map((id) => (
        <Sequence key={id} from={at(voice[id])} layout="none">
          <Audio src={staticFile(`audio/launch/vo/${id}.wav`)} volume={1} />
        </Sequence>
      ))}
      {sfx.filter(({ name }) => full || uiSounds.includes(name)).map(({ name, at: cue, volume, length }, index) => (
        <Sequence key={index} from={Math.max(0, at(cue - peaks[name]))} durationInFrames={length ? at(length + peaks[name]) : undefined} layout="none">
          <Audio src={staticFile(`audio/launch/sfx/${name}.wav`)} volume={volume} />
        </Sequence>
      ))}
    </>
  );
}
