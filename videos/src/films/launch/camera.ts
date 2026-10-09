// A camera over the 1536×864 app space: keys of [time, x, y, zoom] on springs.
// Screen = center + (point − focus) × zoom. Base: zoom 1.25 fills 1920×1080.
import { critical, track, type Key } from "../../kit/spring";
import { H, W } from "../../tokens";

export type CamKey = readonly [t: number, x: number, y: number, zoom: number];
export type Cam = { x: number; y: number; zoom: number };

export const BASE: CamKey = [0, 768, 432, 1.25];
const ease = critical(5.2);

/** Keeps the frame inside the page (app width 1536, height `appH`); a page smaller than the frame stays centered. */
function inside(cam: Cam, appH: number): Cam {
  const fit = (value: number, half: number, size: number) => (size <= 2 * half ? size / 2 : Math.min(size - half, Math.max(half, value)));
  return { zoom: cam.zoom, x: fit(cam.x, W / 2 / cam.zoom, 1536), y: fit(cam.y, H / 2 / cam.zoom, appH) };
}

export function camera(t: number, keys: readonly CamKey[], appH = 864): Cam {
  const along = (index: 1 | 2) => keys.map((key) => [key[0], key[index]] as Key);
  // Zoom moves in log space so pushing in and pulling out feel the same.
  const zoom = Math.exp(track(t, keys.map((key) => [key[0], Math.log(key[3])] as Key), ease));
  return inside({ x: track(t, along(1), ease), y: track(t, along(2), ease), zoom }, appH);
}

export const toScreen = (cam: Cam) => (x: number, y: number) => ({
  x: W / 2 + (x - cam.x) * cam.zoom,
  y: H / 2 + (y - cam.y) * cam.zoom,
});

export const transformOf = (cam: Cam) => ({
  position: "absolute" as const,
  left: 0,
  top: 0,
  transformOrigin: "0 0",
  translate: `${W / 2 - cam.x * cam.zoom}px ${H / 2 - cam.y * cam.zoom}px`,
  scale: String(cam.zoom),
});
