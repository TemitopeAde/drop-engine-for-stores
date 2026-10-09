// Frame-driven twins of the Drop Engine dashboard
// (src/extensions/dashboard/pages/my-page/my-page.tsx, src/dashboard/DropForm.tsx,
// src/dashboard/Waitlist.tsx). Same markup, classes, Button and strings; the
// live versions load data through @wix/dashboard, so every value here is a prop.
import "@app/dashboard/dashboard.css";
import { Button } from "@app/components/ui/button";
import { t } from "@app/locales/en";
import { ArrowLeft, CalendarClock, CircleHelp, Download, LoaderCircle, Mail, Rocket } from "lucide-react";
import type { ReactNode } from "react";

import { color } from "../tokens";

export const APP_W = 1536;
export const APP_H = 864;

// Film-only: no CSS clocks. Spinners turn from t instead.
const still = `.de-app *,.de-app{transition:none!important;animation:none!important}.de-app{min-height:0}.de-sidebar{position:relative;height:auto}`;

export function Shell({ children, current, height = APP_H }: { children: ReactNode; current?: "drops"; height?: number }) {
  return (
    <div className="de-app" lang="en" dir="ltr" style={{ width: APP_W, height, overflow: "hidden" }}>
      <style>{still}</style>
      <aside className="de-sidebar">
        <div className="de-brand">
          <span className="de-brand-icon">
            <Rocket size={20} />
          </span>
          <span className="de-brand-name">Ember &amp; Oak</span>
        </div>
        <nav>
          <Button variant="ghost" aria-current={current === "drops" ? "page" : undefined}>
            <CalendarClock size={18} />
            {t("drops")}
          </Button>
          <Button variant="ghost">
            <CircleHelp size={18} />
            {t("guide")}
          </Button>
        </nav>
      </aside>
      <main className="de-main">{children}</main>
    </div>
  );
}

const Spinner = ({ turn, size = 16 }: { turn: number; size?: number }) => (
  <LoaderCircle size={size} style={{ rotate: `${turn * 360}deg` }} />
);

/** A text input value with a blinking caret while focused. */
function Typed({ value, caret, placeholder }: { value: string; caret: boolean; placeholder?: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", minHeight: 21 }}>
      {value || <span style={{ color: "#9aa7a1" }}>{placeholder}</span>}
      {caret ? <span style={{ width: 1.5, height: 18, marginLeft: 1, background: color.ink }} /> : null}
    </span>
  );
}

const focusRing = { outline: "3px solid #71aa96", outlineOffset: 3 } as const;

export type CreateState = {
  name: string;
  nameFocus: boolean;
  caret: boolean;
  start: string;
  end: string;
  zone: string;
  waitlist: boolean;
  products: number;
  focus?: "start" | "end" | "zone" | "waitlist" | "products" | "publish";
  busy: boolean;
  turn: number;
};

/** DropForm, as a new drop is filled in. */
export function CreateDrop({ s }: { s: CreateState }) {
  const field = { border: `1px solid ${color.line}`, borderRadius: 7, padding: "10px 12px", minWidth: 0, background: "#fff" } as const;
  return (
    <section className="de-form-page">
      <Button variant="ghost">
        <ArrowLeft size={16} />
        {t("back")}
      </Button>
      <div className="de-page-title">
        <h1>{t("create")}</h1>
        <p>{t("gatingHelp")}</p>
      </div>
      <form noValidate>
        <div className="de-form-grid">
          <div>
            <section className="de-card">
              <h2>{t("name")}</h2>
              <label className="de-field">
                {t("name")}
                <span data-target="name" style={{ ...field, ...(s.nameFocus ? focusRing : null) }}>
                  <Typed value={s.name} caret={s.caret} />
                </span>
              </label>
              {(["start", "end"] as const).map((key) => (
                <div className="de-field" key={key}>
                  <label>{t(key)}</label>
                  <div className="de-date-input">
                    <span data-target={key} style={{ ...field, flex: 1, ...(s.focus === key ? focusRing : null) }}>
                      <Typed value={s[key]} caret={false} placeholder="mm/dd/yyyy, --:-- --" />
                    </span>
                    {key === "start" && (
                      <Button type="button" variant="outline">
                        {t("now")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <label className="de-field">
                {t("zone")}
                <span data-target="zone" style={{ ...field, display: "flex", justifyContent: "space-between", ...(s.focus === "zone" ? focusRing : null) }}>
                  {s.zone}
                  <Chevron />
                </span>
              </label>
              <label className="de-field">
                {t("endBehavior")}
                <span style={{ ...field, display: "flex", justifyContent: "space-between" }}>
                  {t("RESTORE")}
                  <Chevron />
                </span>
              </label>
              <label className="de-check">
                <span data-target="waitlist" style={s.focus === "waitlist" ? { ...focusRing, borderRadius: 3 } : undefined}>
                  <input type="checkbox" checked={s.waitlist} readOnly style={{ margin: "3px 0 0", accentColor: color.green }} />
                </span>
                <span>
                  {t("waitlistSetting")}
                  <small>{t("waitlistSettingHelp")}</small>
                </span>
              </label>
            </section>
            <section className="de-card de-product-card">
              <div className="de-card-heading">
                <h2>{t("products")}</h2>
                <span role="status">
                  {s.products.toLocaleString("en")} {t("selected")}
                </span>
              </div>
              <Button type="button" variant="outline" data-target="products" style={s.focus === "products" ? focusRing : undefined}>
                {t("catalog")}
              </Button>
            </section>
          </div>
          <aside className="de-card de-launch-guide">
            <span className="de-eyebrow">{t("stage")}</span>
            <Rocket size={32} />
            <h2>{t("empty")}</h2>
            <p>{t("emptyHelp")}</p>
          </aside>
        </div>
        <div className="de-form-footer">
          <Button type="submit" variant="outline" disabled={s.busy}>
            {t("save")}
          </Button>
          <Button type="button" disabled={s.busy} data-target="publish">
            {s.busy && <Spinner turn={s.turn} />}
            <Rocket size={16} />
            {t("publish")}
          </Button>
        </div>
      </form>
    </section>
  );
}

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export type Entry = { email: string; joined: string; status: "SUBSCRIBED" | "UNSUBSCRIBED" };

/** Waitlist, with entries as props. `fresh` is the highlight on a new row (0..1). */
export function WaitlistPage({ name, subscribed, total, entries, fresh }: { name: string; subscribed: number; total: number; entries: { entry: Entry; enter: number }[]; fresh: number }) {
  return (
    <section className="de-form-page">
      <Button variant="ghost">
        <ArrowLeft size={16} />
        {t("back")}
      </Button>
      <header className="de-header">
        <div>
          <span className="de-eyebrow">{t("waitlistFor")}</span>
          <h1>{name}</h1>
          <p role="status" data-target="counts">
            {subscribed.toLocaleString("en")} {t("waitlistSubscribed")} · {total.toLocaleString("en")} {t("waitlistTotal")}
          </p>
        </div>
        <div className="de-header-actions">
          <Button variant="outline">
            <Download size={16} />
            {t("exportCsv")}
          </Button>
        </div>
      </header>
      <section className="de-card de-list">
        <div className="de-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("waitlistEmail")}</th>
                <th>{t("waitlistJoinedAt")}</th>
                <th>{t("waitlistStatus")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.map(({ entry, enter }, index) => (
                <tr
                  key={entry.email}
                  style={{
                    opacity: enter,
                    translate: `0 ${(1 - enter) * -14}px`,
                    background: index === 0 && fresh > 0 ? `rgb(225 245 233 / ${fresh})` : undefined,
                  }}
                >
                  <td style={{ fontSize: 14, fontWeight: 500 }}>{entry.email}</td>
                  <td>{entry.joined}</td>
                  <td>
                    <span className={`de-badge de-badge-${entry.status === "SUBSCRIBED" ? "live" : "cancelled"}`}>{t(entry.status)}</span>
                  </td>
                  <td>
                    <div className="de-row-actions">
                      {entry.status === "SUBSCRIBED" && <Button variant="ghost">{t("markUnsubscribed")}</Button>}
                      <Button variant="ghost">{t("removeEntry")}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export const MailIcon = Mail;
