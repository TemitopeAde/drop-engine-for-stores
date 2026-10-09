import { Composition } from "remotion";

import { DURATION } from "./films/launch/cues";
import { Launch } from "./films/launch/Launch";
import { H, W } from "./tokens";

type Props = { fps?: number; debug?: boolean; mix?: "full" | "ui" };

export function Root() {
  return (
    <Composition
      id="Launch"
      component={Launch as React.FC<Props>}
      width={W}
      height={H}
      fps={60}
      durationInFrames={Math.round(DURATION * 60)}
      defaultProps={{ fps: 60, debug: false } satisfies Props}
      calculateMetadata={({ props }) => {
        const fps = Number(props.fps ?? 60);
        return { fps, durationInFrames: Math.round(DURATION * fps) };
      }}
    />
  );
}
