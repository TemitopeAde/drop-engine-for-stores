// The opening mark, the punchlines between scenes, and the end lockup.
import { Easing } from "remotion";

import { Punchlines, type Card } from "../../../kit/punchlines";
import { clamp01 } from "../../../kit/time";
import { Mark } from "../../../twins/Mark";
import { color, font } from "../../../tokens";
import { b, scene, voice } from "../cues";
import { lines } from "../script";
import { spoken } from "./util";

const land = Easing.bezier(0.22, 1, 0.36, 1);
const theme = { font: font.display, color: color.white, accent: color.mint, weight: 700 };

const cards: Card[] = [
  { lines: spoken("open", [3, 3], ["moment."]), out: scene.open[1] - 0.3, y: 690, size: 104 },
  { lines: spoken("set", [3], ["moment."]), out: scene.setPunch[1] - 0.2, y: 540, size: 150 },
  { lines: spoken("count", [2, 4], ["Count", "down"]), out: scene.countPunch[1] - 0.2, y: 540, size: 120 },
  { lines: spoken("waitlist", [3], ["waitlist."]), out: scene.waitPunch[1] - 0.2, y: 540, size: 150 },
  { lines: spoken("live", [4], ["on", "time."]), out: scene.livePunch[1] - 0.2, y: 540, size: 150 },
];

export function Titles({ t }: { t: number }) {
  return (
    <>
      <OpenMark t={t} />
      <Punchlines t={t} cards={cards} theme={theme} />
      <End t={t} />
    </>
  );
}

function OpenMark({ t }: { t: number }) {
  const [from, to] = scene.open;
  if (t > to) return null;
  const draw = land(clamp01((t - from - 0.15) / 1.1));
  const sweep = land(clamp01((t - b(0, 3)) / 1.6));
  const leave = clamp01((t - (to - 0.3)) / 0.18);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "grid", justifyItems: "center", opacity: 1 - leave, filter: leave ? `blur(${leave * 12}px)` : undefined }}>
      <Mark size={230} draw={draw} sweep={sweep} />
    </div>
  );
}

function End({ t }: { t: number }) {
  const [from] = scene.end;
  if (t < from - 0.05) return null;
  const draw = land(clamp01((t - from) / 0.9));
  const sweep = land(clamp01((t - from - 0.2) / 1.2));
  const name = land(clamp01((t - voice.name + 0.05) / 0.4));
  const tagWords = spoken("tagline")[0];
  const cta = land(clamp01((t - voice.cta + 0.05) / 0.45));
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", justifyItems: "center", alignContent: "center", fontFamily: font.display, color: color.white }}>
      <Mark size={170} draw={draw} sweep={sweep} />
      <div
        style={{
          marginTop: 28,
          fontSize: 148,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1,
          opacity: name,
          filter: name < 1 ? `blur(${(1 - name) * 16}px)` : undefined,
          translate: `0 ${(1 - name) * 36}px`,
        }}
      >
        {lines.name.replace(/\.$/, "")}
      </div>
      <div style={{ marginTop: 30, display: "flex", gap: "0.26em", fontSize: 44, fontWeight: 400, color: "#d9efe5" }}>
        {tagWords.map((word) => {
          const u = land(clamp01((t - word.at) / 0.3));
          return (
            <span key={word.text} style={{ opacity: u, filter: u < 1 ? `blur(${(1 - u) * 10}px)` : undefined, translate: `0 ${(1 - u) * 18}px` }}>
              {word.text}
            </span>
          );
        })}
      </div>
      {/* The dashboard's own inverted button (.de-guide-hero .de-button-default). */}
      <div
        style={{
          marginTop: 56,
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          padding: "20px 34px",
          borderRadius: 12,
          background: color.white,
          color: color.green,
          fontSize: 34,
          fontWeight: 600,
          opacity: cta,
          translate: `0 ${(1 - cta) * 24}px`,
          boxShadow: "0 2px 4px #00000012",
        }}
      >
        {lines.cta.replace(/\.$/, "")}
      </div>
    </div>
  );
}
