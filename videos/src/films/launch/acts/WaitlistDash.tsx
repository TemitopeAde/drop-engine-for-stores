// End of bar 11 to bar 12: the new signup lands in the dashboard waitlist.
import { swapIn } from "../../../kit/move";
import { step } from "../../../kit/spring";
import { clamp01 } from "../../../kit/time";
import { Shell, WaitlistPage, type Entry } from "../../../twins/Dashboard";
import { camera, transformOf, type CamKey } from "../camera";
import { join as j, scene } from "../cues";
import { Surface, Window } from "./Window";

const from = j.dashboard;
const to = scene.waitlist[1];

const existing: Entry[] = [
  { email: "j.rivera@example.com", joined: "Oct 21, 2026, 8:52 AM", status: "SUBSCRIBED" },
  { email: "sam.okafor@example.com", joined: "Oct 20, 2026, 6:40 PM", status: "SUBSCRIBED" },
  { email: "lena.weber@example.com", joined: "Oct 20, 2026, 3:05 PM", status: "UNSUBSCRIBED" },
  { email: "priya.n@example.com", joined: "Oct 20, 2026, 11:27 AM", status: "SUBSCRIBED" },
  { email: "tom.becker@example.com", joined: "Oct 19, 2026, 7:58 PM", status: "SUBSCRIBED" },
];
const fresh: Entry = { email: "maya.chen@example.com", joined: "Oct 22, 2026, 9:14 AM", status: "SUBSCRIBED" };

const keys: CamKey[] = [
  [from, 900, 420, 1.3],
  [from + 0.05, 900, 420, 1.42],
  [j.newRow + 0.4, 900, 440, 1.5],
];

export function WaitlistDash({ t, debug }: { t: number; debug?: boolean }) {
  if (t < from - 0.05 || t > to) return null;
  const cam = debug ? camera(0, [[0, 768, 432, 1.25]]) : camera(t, keys);
  const fade = swapIn(t, from, to, 0, 0.18);
  const landed = t >= j.newRow;
  const enter = clamp01(step(t - j.newRow, { stiffness: 170, damping: 26 }));
  const highlight = landed ? 1 - clamp01((t - j.newRow - 0.9) / 0.8) : 0;
  return (
    <Window opacity={fade.opacity} filter={fade.filter}>
      <div style={transformOf(cam)}>
        <Surface>
          <Shell>
            <WaitlistPage
              name="Autumn Collection Drop"
              subscribed={landed ? 142 : 141}
              total={landed ? 147 : 146}
              entries={[...(landed ? [{ entry: fresh, enter }] : []), ...existing.map((entry) => ({ entry, enter: 1 }))]}
              fresh={highlight}
            />
          </Shell>
        </Surface>
      </div>
    </Window>
  );
}
