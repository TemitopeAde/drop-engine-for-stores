// Frame-driven twin of the storefront countdown
// (src/extensions/site/plugins/drop-countdown/drop-countdown.tsx).
// Same DOM, classes and stylesheet; the plugin's setInterval clock and its
// fetches are replaced by props computed from film time.
import { icons, styles } from "@app/extensions/site/plugins/drop-countdown/drop-countdown.styles";
import { t } from "@app/locales/en";
import { tp } from "@app/locales/plugin.en";

import { color } from "../tokens";

export type Phase = "scheduled" | "live";

export type WaitlistState = {
  email: string;
  focused: boolean;
  caret: boolean;
  consent: boolean;
  state: "form" | "joining" | "joined";
  /** Spinner turns while joining (the plugin spins it with CSS). */
  turn?: number;
};

const units = [
  [86400, "days"],
  [3600, "hours"],
  [60, "minutes"],
  [1, "seconds"],
] as const;

// Film-only overrides: no CSS clocks (the live dot's pulse is drawn from t).
const still = `.dce *,.dce{animation:none!important;transition:none!important}`;

export function Countdown({
  phase,
  remaining,
  name,
  when,
  progress = 1,
  pulse = 0,
  waitlist,
  width = 560,
}: {
  phase: Phase;
  /** Whole seconds until the boundary. */
  remaining: number;
  name: string;
  /** Formatted date, as the plugin's formatDate prints it. */
  when: string;
  /** Live phase: share of the window left (the bar). */
  progress?: number;
  /** 0..1 position in the live dot's pulse. */
  pulse?: number;
  waitlist?: WaitlistState;
  width?: number;
}) {
  // defaultWidgetSettings, resolved to the theme fallbacks.
  const settings = { text: color.bg, background: color.paper, accent: color.bg, padding: 24, gap: 16, radius: 12 };
  let left = Math.max(0, remaining);
  const values = units.map(([divisor]) => {
    const value = Math.floor(left / divisor);
    left %= divisor;
    return String(value).padStart(2, "0");
  });
  return (
    <section
      className="dce"
      data-align="start"
      style={
        {
          boxSizing: "border-box",
          width,
          minWidth: 0,
          overflowWrap: "anywhere",
          margin: 0,
          color: settings.text,
          background: settings.background,
          font: "normal 400 16px system-ui",
          padding: settings.padding,
          borderRadius: settings.radius,
          "--dce-accent": settings.accent,
          "--dce-on-accent": settings.background,
          "--dce-unit-gap": `${Math.max(6, Math.round(settings.gap / 2))}px`,
          "--dce-unit-radius": `${Math.min(settings.radius, 14)}px`,
          "--dce-control-radius": `${Math.min(settings.radius, 10)}px`,
        } as React.CSSProperties
      }
    >
      <style>{styles + still}</style>
      <div>
        <div className="dce-top">
          <span className="dce-pill" data-phase={phase}>
            <span
              className="dce-dot"
              style={phase === "live" ? { boxShadow: `0 0 0 ${pulse * 7}px rgb(23 56 44 / ${0.55 * (1 - pulse)})` } : undefined}
            />
            {tp(phase === "scheduled" ? "statusScheduled" : "statusLive")}
          </span>
        </div>
        <h3 className="dce-title" style={{ fontFamily: "inherit", fontStyle: "inherit", color: "inherit" }}>
          {t(phase === "scheduled" ? "opens" : "live")}
        </h3>
        <p className="dce-name">{name}</p>
        <p className="dce-meta">
          <span style={{ display: "inline-flex" }} dangerouslySetInnerHTML={{ __html: icons.calendar }} />
          {`${tp(phase === "scheduled" ? "opensAt" : "endsAt")} ${when}`}
        </p>
        <div className="dce-timer" style={{ marginTop: settings.gap + 4 }}>
          <p className="dce-caption">{tp(phase === "scheduled" ? "opensIn" : "endsIn")}</p>
          <div className="dce-units" style={{ "--dce-cols": "4" } as React.CSSProperties} data-target="units">
            {units.map(([, label], index) => (
              <div className="dce-unit" key={label}>
                <strong className="dce-value">{values[index]}</strong>
                <span className="dce-label">{t(label)}</span>
              </div>
            ))}
          </div>
          {phase === "live" ? (
            <div className="dce-track">
              <span className="dce-bar" style={{ width: `${progress * 100}%` }} />
            </div>
          ) : null}
        </div>
      </div>
      {waitlist && phase === "scheduled" ? <Waitlist state={waitlist} gap={settings.gap} /> : null}
    </section>
  );
}

function Waitlist({ state, gap }: { state: WaitlistState; gap: number }) {
  if (state.state === "joined") {
    return (
      <div className="dce-waitlist" style={{ marginTop: gap, paddingTop: gap }}>
        <div className="dce-joined">
          <p className="dce-status" role="status">
            <span className="dce-check" dangerouslySetInnerHTML={{ __html: icons.check }} />
            {t("waitlistJoined")}
          </p>
          <button className="dce-btn dce-btn-quiet" type="button">
            {t("waitlistLeave")}
          </button>
        </div>
      </div>
    );
  }
  const joining = state.state === "joining";
  return (
    <div className="dce-waitlist" style={{ marginTop: gap, paddingTop: gap }}>
      <form noValidate>
        <p className="dce-wl-title">{t("waitlistTitle")}</p>
        <p className="dce-wl-help">{tp("waitlistHelp")}</p>
        <div className="dce-row">
          <span
            className="dce-input"
            data-target="email"
            style={{
              display: "flex",
              alignItems: "center",
              minHeight: 47,
              ...(state.focused ? { borderColor: color.bg, boxShadow: "0 0 0 3px rgb(23 56 44 / 0.22)" } : null),
            }}
          >
            {state.email ? state.email : <span style={{ opacity: 0.5 }}>{tp("emailPlaceholder")}</span>}
            {state.caret ? <span style={{ display: "inline-block", width: 1.5, height: "1.15em", marginLeft: 1, background: "currentColor" }} /> : null}
          </span>
          <button className="dce-btn" type="button" disabled={joining} aria-busy={joining || undefined} data-target="join">
            {joining ? (
              <span className="dce-spin" style={{ rotate: `${(state.turn ?? 0) * 360}deg` }} dangerouslySetInnerHTML={{ __html: icons.spinner }} />
            ) : null}
            {t("waitlistJoin")}
          </button>
        </div>
        <label className="dce-consent" data-target="consent">
          {/* Headless Chrome ignores accent-color through var() on a read-only box; same value, inline. */}
          <input type="checkbox" checked={state.consent} readOnly style={{ accentColor: color.bg }} />
          {t("waitlistConsent")}
        </label>
      </form>
    </div>
  );
}
