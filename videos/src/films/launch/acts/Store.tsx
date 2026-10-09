// The storefront: the countdown ticking (bars 7–8), a shopper joining the
// waitlist (bars 10–11) and the drop opening on time (bars 14–15).
import { cursorAt, UserCursor, type CursorKey } from "../../../kit/cursor";
import { swapIn } from "../../../kit/move";
import { clamp01 } from "../../../kit/time";
import { Countdown, type WaitlistState } from "../../../twins/Countdown";
import { ProductPage } from "../../../twins/Store";
import { camera, toScreen, transformOf, type CamKey } from "../camera";
import { golive, join as j, scene } from "../cues";
import { target as p } from "../layout";
import { Surface, Window } from "./Window";
import { caretOn, typed } from "./util";

const NAME = "Autumn Collection Drop";
const OPENS = "Sat, Oct 24, 10:00 AM";
const ENDS = "Mon, Oct 26, 10:00 AM";
const WINDOW = 2 * 86400; // the drop runs 48 hours
// 2 days 14:37:08 before opening when the product scene starts.
const LEAD = 2 * 86400 + 14 * 3600 + 37 * 60 + 8;
const EMAIL = "maya.chen@example.com";

const views: { from: number; to: number; keys: CamKey[] }[] = [
  {
    from: scene.product[0],
    to: scene.product[1],
    keys: [
      [scene.product[0], 768, 432, 1.12],
      [scene.product[0] + 0.05, 768, 432, 1.25],
      [scene.product[0] + 1.6, p.units.x - 40, p.units.y - 30, 1.9],
    ],
  },
  {
    from: scene.waitlist[0],
    to: j.dashboard,
    keys: [
      [scene.waitlist[0], 1160, 520, 1.6],
      [scene.waitlist[0] + 0.05, 1160, 540, 1.9],
      [j.joinClick - 0.2, 1160, 560, 2.0],
    ],
  },
  {
    from: scene.live[0],
    to: scene.live[1],
    keys: [
      [scene.live[0], p.units.x - 60, p.units.y - 20, 1.7],
      [scene.live[0] + 0.05, p.units.x - 60, p.units.y - 20, 1.85],
      [golive.zeroAt - 0.1, p.units.x - 60, p.units.y - 40, 2.0],
      [golive.zeroAt + 1.0, p.units.x - 60, p.units.y - 10, 1.8],
    ],
  },
];

const cursorKeys: CursorKey[] = [
  { t: scene.waitlist[0], x: 1700, y: 1060 },
  { t: j.emailClick, x: p.email.x, y: p.email.y, world: true, click: true },
  { t: j.consentClick, x: p.consent.x, y: p.consent.y, world: true, click: true },
  { t: j.joinClick, x: p.join.x, y: p.join.y, world: true, click: true },
];

export const storeClicks = cursorKeys.filter((key) => key.click).map((key) => key.t);

export function Store({ t, debug }: { t: number; debug?: boolean }) {
  const view = views.find((v) => t >= v.from - 0.05 && t < v.to);
  if (!view) return null;
  const cam = debug ? camera(0, [[0, 768, 432, 1.25]]) : camera(t, view.keys);
  const fade = swapIn(t, view.from, view.to, 0, 0.18);
  const live = view === views[2] && t >= golive.zeroAt;

  let remaining: number;
  if (view === views[2]) remaining = live ? Math.floor(WINDOW - (t - golive.zeroAt)) : Math.floor(golive.zeroAt - t);
  else remaining = LEAD - Math.floor(t - scene.product[0]);

  let waitlist: WaitlistState | undefined;
  if (view === views[0]) waitlist = { email: "", focused: false, caret: false, consent: false, state: "form" };
  if (view === views[1])
    waitlist = {
      email: typed(EMAIL, t, j.typeFrom, j.typeTo),
      focused: t >= j.emailClick && t < j.joinClick,
      caret: t >= j.emailClick && t < j.consentClick && caretOn(t, j.typeTo),
      consent: t >= j.consentClick + 0.08,
      state: t >= j.joined ? "joined" : t >= j.joinClick ? "joining" : "form",
      turn: t - j.joinClick,
    };

  const cursor = view === views[1] ? cursorAt(t, cursorKeys, toScreen(cam)) : null;
  return (
    <Window opacity={fade.opacity} filter={fade.filter}>
      <div style={transformOf(cam)}>
        <Surface>
          <ProductPage
            countdown={
              <Countdown
                phase={live ? "live" : "scheduled"}
                remaining={remaining}
                name={NAME}
                when={live ? ENDS : OPENS}
                progress={live ? 1 - (t - golive.zeroAt) / WINDOW : 1}
                pulse={live ? clamp01(((t - golive.zeroAt) % 1.8) / 1.44) : 0}
                waitlist={waitlist}
              />
            }
          />
        </Surface>
      </div>
      {cursor && !debug ? <UserCursor {...cursor} /> : null}
    </Window>
  );
}
