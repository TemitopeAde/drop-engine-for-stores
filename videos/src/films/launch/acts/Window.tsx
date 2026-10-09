import type { ReactNode } from "react";

import { H, W } from "../../../tokens";

/** Full-frame layer for an app scene; the app space inside is framed by the camera. */
export function Window({ children, opacity, filter }: { children: ReactNode; opacity: number; filter?: string }) {
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden", opacity, filter }}>
      {children}
    </div>
  );
}

/** The app surface: rounded and lifted while the camera is pulled back, flush at full frame. */
export function Surface({ children }: { children: ReactNode }) {
  return <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 40px 120px -30px rgb(0 0 0 / .6)" }}>{children}</div>;
}
