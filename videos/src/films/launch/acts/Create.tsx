// Bars 3–5: a merchant fills in Create drop and publishes it.
import { cursorAt, UserCursor, type CursorKey } from "../../../kit/cursor";
import { swapIn } from "../../../kit/move";
import { clamp01 } from "../../../kit/time";
import { CreateDrop, Shell, type CreateState } from "../../../twins/Dashboard";
import { Toast } from "../../../twins/Toast";
import { camera, toScreen, transformOf, type CamKey } from "../camera";
import { create as c, scene } from "../cues";
import { target as p } from "../layout";
import { Surface, Window } from "./Window";
import { caretOn, typed } from "./util";

const [from, to] = scene.create;

const keys: CamKey[] = [
  [from, 768, 432, 1.12],
  [from + 0.05, 768, 432, 1.25],
  [c.nameClick - 0.35, 660, 400, 1.75],
  [c.startClick - 0.25, 660, 470, 1.75],
  [c.waitlistClick - 0.3, 660, 650, 1.75],
  [c.productsClick - 0.3, 700, 800, 1.6],
  [c.publishClick - 0.45, 936, 823, 1.6],
];

const cursorKeys: CursorKey[] = [
  { t: from, x: 1500, y: 1000 },
  { t: c.nameClick, x: p.name.x, y: p.name.y, world: true, click: true },
  { t: c.startClick, x: p.start.x, y: p.start.y, world: true, click: true },
  { t: c.endClick, x: p.end.x, y: p.end.y, world: true, click: true },
  { t: c.zoneClick, x: p.zone.x, y: p.zone.y, world: true, click: true },
  { t: c.waitlistClick, x: p.waitlist.x, y: p.waitlist.y, world: true, click: true },
  { t: c.productsClick, x: p.products.x, y: p.products.y, world: true, click: true },
  { t: c.publishClick, x: p.publish.x, y: p.publish.y, world: true, click: true },
];

export const createClicks = cursorKeys.filter((key) => key.click).map((key) => key.t);

export function Create({ t, debug }: { t: number; debug?: boolean }) {
  if (t < from - 0.05 || t > to) return null;
  const cam = debug ? camera(0, [[0, 768, 432, 1.25]]) : camera(t, keys, 1160);
  const fade = swapIn(t, from, to, 0, 0.18);
  const after = (cue: number) => t >= cue + 0.12;
  const s: CreateState = {
    name: typed("Autumn Collection Drop", t, c.typeFrom, c.typeTo),
    nameFocus: t >= c.nameClick && t < c.startClick,
    caret: t >= c.nameClick && t < c.startClick && caretOn(t, c.typeTo),
    start: after(c.startClick) ? "10/24/2026, 10:00 AM" : "",
    end: after(c.endClick) ? "10/26/2026, 10:00 AM" : "",
    zone: after(c.zoneClick) ? "America/New York" : "UTC",
    waitlist: after(c.waitlistClick),
    products: Math.round(6 * clamp01((t - c.productsFrom) / (c.productsTo - c.productsFrom))),
    focus:
      t >= c.publishClick ? "publish" : t >= c.productsClick ? "products" : t >= c.waitlistClick ? "waitlist" : t >= c.zoneClick ? "zone" : t >= c.endClick ? "end" : t >= c.startClick ? "start" : undefined,
    busy: t >= c.publishClick && t < c.saved,
    turn: (t - c.publishClick) * 1,
  };
  const cursor = cursorAt(t, cursorKeys, toScreen(cam));
  return (
    <Window opacity={fade.opacity} filter={fade.filter}>
      <div style={transformOf(cam)}>
        <Surface>
          <Shell current="drops" height={1160}>
            <CreateDrop s={s} />
          </Shell>
        </Surface>
      </div>
      <Toast enter={clamp01((t - c.saved) / 0.35)} scale={cam.zoom} />
      {debug ? null : <UserCursor {...cursor} />}
    </Window>
  );
}
