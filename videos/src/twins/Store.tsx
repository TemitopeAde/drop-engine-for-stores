// A sample Wix Stores product page ("Ember & Oak", as in the App Market images)
// hosting the real countdown twin. Sized like the dashboard so one camera fits both.
import type { ReactNode } from "react";

import { color } from "../tokens";
import { APP_H, APP_W } from "./Dashboard";

export const Jar = ({ width = 220 }: { width?: number }) => (
  <svg width={width} viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="110" cy="246" rx="86" ry="10" fill="rgb(0 0 0 / .12)" />
    <rect x="34" y="70" width="152" height="176" rx="22" fill="#2f4a3f" />
    <rect x="34" y="70" width="152" height="176" rx="22" fill="url(#jar-shine)" />
    <rect x="58" y="128" width="104" height="66" rx="6" fill="#f4ece2" />
    <rect x="74" y="146" width="72" height="8" rx="4" fill="#2f4a3f" />
    <rect x="84" y="164" width="52" height="6" rx="3" fill="#a08a72" />
    <rect x="44" y="40" width="132" height="38" rx="10" fill="#b98b5a" />
    <rect x="44" y="40" width="132" height="12" rx="6" fill="#cfa274" />
    <defs>
      <linearGradient id="jar-shine" x1="0" x2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".12" />
        <stop offset=".35" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

export function ProductPage({ countdown, cartPressed = 0 }: { countdown: ReactNode; cartPressed?: number }) {
  return (
    <div style={{ width: APP_W, height: APP_H, background: "#fff", color: color.ink, fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 56px", borderBottom: `1px solid ${color.line}`, fontSize: 16 }}>
        <span style={{ fontWeight: 800, letterSpacing: ".16em", fontSize: 18 }}>EMBER &amp; OAK</span>
        <span style={{ display: "flex", gap: 34, color: color.muted }}>
          <span>Shop</span>
          <span>Drops</span>
          <span>About</span>
          <span>Cart (0)</span>
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 600px", gap: 64, padding: "40px 56px" }}>
        <div style={{ borderRadius: 14, background: "linear-gradient(160deg,#f4ece2,#e7d7c4)", display: "grid", placeItems: "center", height: 700 }}>
          <Jar width={300} />
        </div>
        <div>
          <div style={{ fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: color.muted, fontWeight: 600 }}>Autumn Collection</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 38, fontWeight: 700, letterSpacing: "-.01em" }}>Ember Soy Candle</h1>
          <div style={{ margin: "6px 0 22px", fontSize: 22, color: color.muted }}>$38.00</div>
          <div data-target="countdown">{countdown}</div>
          <div
            style={{
              marginTop: 18,
              width: 560,
              padding: 16,
              borderRadius: 8,
              background: color.ink,
              color: "#fff",
              textAlign: "center",
              fontWeight: 600,
              fontSize: 16,
              scale: String(1 - cartPressed * 0.03),
            }}
          >
            Add to Cart
          </div>
        </div>
      </div>
    </div>
  );
}
