// The Drop Engine stopwatch mark (docs/market-listing-assets/icon.png), drawn from t:
// `draw` traces the ring, `sweep` opens the remaining-time wedge (0..1 of 120°).
import { color } from "../tokens";

export function Mark({ size, draw = 1, sweep = 1, ring = color.white, wedge = color.mint }: { size: number; draw?: number; sweep?: number; ring?: string; wedge?: string }) {
  const angle = (sweep * 120 * Math.PI) / 180;
  const r = 25;
  const x = 50 + r * Math.sin(angle);
  const y = 57 - r * Math.cos(angle);
  const crown = Math.min(1, Math.max(0, (draw - 0.6) / 0.4));
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <g opacity={crown}>
        <rect x="43" y="6" width="14" height="9" rx="3" fill={ring} />
        <rect x="47.5" y="12" width="5" height="8" fill={ring} />
        <rect x="74" y="20" width="10" height="7" rx="2.5" transform="rotate(45 79 23.5)" fill={ring} />
      </g>
      <circle
        cx="50"
        cy="57"
        r="35"
        fill="none"
        stroke={ring}
        strokeWidth="8"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - draw}
        transform="rotate(-90 50 57)"
      />
      {sweep > 0.001 ? (
        <path d={`M50 57 L50 32 A25 25 0 ${angle > Math.PI ? 1 : 0} 1 ${x.toFixed(3)} ${y.toFixed(3)} Z`} fill={wedge} />
      ) : null}
      <circle cx="50" cy="57" r="4.5" fill={ring} opacity={crown} />
    </svg>
  );
}
