import { httpClient } from "@wix/essentials";
import { z } from "zod";
import {
  projectionSchema,
  type Projection,
} from "../../../../domain/projection";
import {
  parseWidgetSettings,
  type WidgetSettings,
} from "../../../../domain/widget-settings";
import { en, t, type MessageKey } from "../../../../locales/en";
import { tp } from "../../../../locales/plugin.en";
import { icons, styles } from "./drop-countdown.styles";
const credentialsSchema = z.object({ id: z.string(), token: z.string() });
const joinResponseSchema = z.object({
  status: z.enum(["joined", "already"]),
  id: z.string().optional(),
  token: z.string().optional(),
});
const storageKey = (dropId: string) => `drop-engine-waitlist:${dropId}`;
// Storage can be unavailable (privacy modes, sandboxing); the form still works without it.
function readCredentials(dropId: string) {
  try {
    const parsed = credentialsSchema.safeParse(
      JSON.parse(localStorage.getItem(storageKey(dropId)) || "null"),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
function writeCredentials(
  dropId: string,
  value: z.infer<typeof credentialsSchema> | null,
) {
  try {
    if (value) localStorage.setItem(storageKey(dropId), JSON.stringify(value));
    else localStorage.removeItem(storageKey(dropId));
  } catch {
    // Not persisted: the visitor can still sign up, just not leave from this browser later.
  }
}
const apiUrl = (path: string) =>
  new URL(/* @vite-ignore */ path, import.meta.url).href;
async function errorMessage(response: Response) {
  const body = z
    .object({ error: z.string() })
    .safeParse(await response.json().catch(() => null));
  if (!body.success) return t("failed");
  if (body.data.error === "fieldsRequired") return t("waitlistInvalid");
  return body.data.error in en ? t(body.data.error as MessageKey) : t("failed");
}

type Drop = NonNullable<Projection["drop"]>;
type Phase = "scheduled" | "live" | "ended";
const units = [
  [86400, "days"],
  [3600, "hours"],
  [60, "minutes"],
  [1, "seconds"],
] as const;
const PREVIEW_ID = "editor-preview";
function formatDate(value: number) {
  try {
    return new Intl.DateTimeFormat(document.documentElement.lang || undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(value);
  } catch {
    return new Date(value).toLocaleString();
  }
}
function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// The label stays while a request is in flight; a spinner shows it is working.
function setBusy(button: HTMLButtonElement, busy: boolean) {
  button.disabled = busy;
  button.toggleAttribute("aria-busy", busy);
  if (busy) {
    const spinner = element("span", "dce-spin");
    spinner.innerHTML = icons.spinner;
    button.prepend(spinner);
  } else button.querySelector(".dce-spin")?.remove();
}

class DropCountdown extends HTMLElement {
  static get observedAttributes() {
    return ["product-id", "drop-settings"];
  }
  private timer?: ReturnType<typeof setInterval>;
  private refreshTimer?: ReturnType<typeof setInterval>;
  private controller?: AbortController;
  private resizeObserver?: ResizeObserver;
  private projection?: Projection;
  private synchronizedAt = 0;
  private unavailable = false;
  private editor = false;
  private previewOrigin = 0;
  private sheet = Object.assign(document.createElement("style"), {
    textContent: styles,
  });
  // The waitlist lives outside the ticking display so typing survives re-renders.
  private root = document.createElement("section");
  private display = document.createElement("div");
  private waitlistSlot = document.createElement("div");
  private waitlistDropId?: string;
  // Rebuilt only when the layout changes; each tick patches these nodes in place
  // so the live pulse and progress transitions run smoothly.
  private layoutKey = "";
  private values: HTMLElement[] = [];
  private bar?: HTMLElement;
  private timerRegion?: HTMLElement;
  connectedCallback() {
    this.root.className = "dce";
    this.root.append(this.display, this.waitlistSlot);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(this);
    }
    void this.detectEditor();
    void this.load();
    this.timer = setInterval(() => this.render(), 1000);
    this.refreshTimer = setInterval(() => void this.load(), 15_000);
  }
  disconnectedCallback() {
    clearInterval(this.timer);
    clearInterval(this.refreshTimer);
    this.controller?.abort();
    this.resizeObserver?.disconnect();
  }
  attributeChangedCallback(name: string) {
    if (!this.isConnected) return;
    if (name === "product-id") {
      this.projection = undefined;
      void this.load();
    } else this.render();
  }
  private memberEmailRequest?: Promise<string | undefined>;
  // Logged-in members shouldn't have to retype the address they sign in with.
  private memberEmail() {
    this.memberEmailRequest ??= import("@wix/site-members")
      .then(({ currentMember }) =>
        currentMember.getMember({ fieldsets: ["FULL"] }),
      )
      .then(
        (member) =>
          member?.loginEmail ||
          member?.contactDetails?.emails?.[0] ||
          undefined,
      )
      .catch(() => undefined)
      .then((value) => {
        // Retry next render if nobody was logged in yet.
        if (!value) this.memberEmailRequest = undefined;
        return value;
      });
    return this.memberEmailRequest;
  }
  // In the editor there is often no product or published drop yet; a sample
  // keeps the plugin visible so merchants can style it.
  private async detectEditor() {
    try {
      const { window: wixWindow } = await import("@wix/site-window");
      this.editor = (await wixWindow.viewMode()) === "Editor";
      if (this.editor) this.render();
    } catch {
      this.editor = false;
    }
  }
  private async load() {
    this.controller?.abort();
    const controller = (this.controller = new AbortController());
    const productId = this.getAttribute("product-id");
    if (!productId) {
      this.projection = undefined;
      this.unavailable = false;
      this.render();
      return;
    }
    try {
      const url = new URL(apiUrl("/api/storefront"));
      url.searchParams.set("productId", productId);
      const response = await httpClient.fetchWithAuth(url.href, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("availability");
      const value = projectionSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      this.projection = value;
      this.synchronizedAt = performance.now();
      this.unavailable = false;
      this.render();
    } catch {
      if (controller.signal.aborted) return;
      this.unavailable = true;
      this.render();
    }
  }
  private sample(): { drop: Drop; now: number } {
    const now = Date.now();
    this.previewOrigin ||= now;
    const startsAt = this.previewOrigin + ((2 * 24 + 6) * 60 + 45) * 60_000;
    return {
      now,
      drop: {
        id: PREVIEW_ID,
        name: tp("previewName"),
        phase: "SCHEDULED",
        startsAt,
        endsAt: startsAt + 2 * 86_400_000,
        waitlist: true,
      },
    };
  }
  private render() {
    const real = this.projection?.drop;
    const preview = this.editor && !real;
    if (!real && !this.unavailable && !preview) {
      this.layoutKey = "";
      this.replaceChildren();
      return;
    }
    const settings = parseWidgetSettings(this.getAttribute("drop-settings"));
    this.applySettings(settings);
    if (this.root.parentNode !== this)
      this.replaceChildren(this.sheet, this.root);
    if (this.unavailable && !preview) {
      this.renderNotice();
      this.syncWaitlist(null, settings);
      return;
    }
    const { drop, now } =
      preview || !this.projection
        ? this.sample()
        : {
            drop: real!,
            // Monotonic elapsed time avoids client clock changes; server remains authoritative.
            now:
              this.projection.serverNow +
              performance.now() -
              this.synchronizedAt,
          };
    const phase: Phase =
      now < drop.startsAt ? "scheduled" : now < drop.endsAt ? "live" : "ended";
    const key = JSON.stringify([
      phase,
      drop.id,
      drop.name,
      drop.startsAt,
      drop.endsAt,
      preview,
      settings.headline,
      settings.showName,
      settings.showSeconds,
    ]);
    if (key !== this.layoutKey) {
      this.layoutKey = key;
      this.buildLayout(drop, phase, preview, settings);
    }
    this.tick(drop, phase, now);
    this.syncWaitlist(
      drop.waitlist && phase === "scheduled" ? drop.id : null,
      settings,
    );
  }
  private applySettings(settings: WidgetSettings) {
    const root = this.root;
    root.setAttribute("aria-label", t("editor"));
    root.dataset.align = settings.align;
    root.style.cssText = `box-sizing:border-box;width:100%;min-width:0;overflow-wrap:anywhere;margin:16px ${settings.align === "center" ? "auto" : "0"};`;
    root.style.color = settings.textColor;
    root.style.background = settings.background;
    root.style.font = settings.font;
    root.style.textDecoration = settings.textDecoration;
    root.style.padding = `${settings.padding}px`;
    root.style.borderRadius = `${settings.radius}px`;
    root.style.maxWidth = `${settings.maxWidth}px`;
    root.style.setProperty("--dce-accent", settings.accentColor);
    root.style.setProperty("--dce-on-accent", settings.background);
    root.style.setProperty(
      "--dce-unit-gap",
      `${Math.max(6, Math.round(settings.gap / 2))}px`,
    );
    root.style.setProperty(
      "--dce-unit-radius",
      `${Math.min(settings.radius, 14)}px`,
    );
    root.style.setProperty(
      "--dce-control-radius",
      `${Math.min(settings.radius, 10)}px`,
    );
    if (settings.compact && this.getBoundingClientRect().width < 360)
      root.style.padding = `${Math.min(settings.padding, 16)}px`;
  }
  private renderNotice() {
    this.layoutKey = "unavailable";
    const notice = element("p", "dce-notice");
    notice.innerHTML = icons.info;
    notice.append(t("outageViolation"));
    this.values = [];
    this.bar = this.timerRegion = undefined;
    this.display.replaceChildren(notice);
  }
  private buildLayout(
    drop: Drop,
    phase: Phase,
    preview: boolean,
    settings: WidgetSettings,
  ) {
    const content: HTMLElement[] = [];
    const top = element("div", "dce-top");
    const pill = element("span", "dce-pill");
    pill.dataset.phase = phase;
    pill.append(
      element("span", "dce-dot"),
      tp(
        phase === "scheduled"
          ? "statusScheduled"
          : phase === "live"
            ? "statusLive"
            : "statusEnded",
      ),
    );
    top.append(pill);
    if (preview) top.append(element("span", "dce-tag", tp("previewBadge")));
    content.push(top);
    const heading = element(
      "h3",
      "dce-title",
      settings.headline ||
        t(
          phase === "scheduled" ? "opens" : phase === "live" ? "live" : "ended",
        ),
    );
    // Family and style follow the panel's font; size and weight set hierarchy.
    heading.style.fontFamily = "inherit";
    heading.style.fontStyle = "inherit";
    heading.style.color = "inherit";
    content.push(heading);
    if (settings.showName) content.push(element("p", "dce-name", drop.name));
    const meta = element("p", "dce-meta");
    meta.innerHTML = icons.calendar;
    meta.append(
      `${tp(phase === "scheduled" ? "opensAt" : phase === "live" ? "endsAt" : "endedAt")} ${formatDate(phase === "scheduled" ? drop.startsAt : drop.endsAt)}`,
    );
    content.push(meta);
    this.values = [];
    this.bar = this.timerRegion = undefined;
    if (phase !== "ended") {
      const timer = element("div", "dce-timer");
      timer.style.marginTop = `${settings.gap + 4}px`;
      timer.append(
        element(
          "p",
          "dce-caption",
          tp(phase === "scheduled" ? "opensIn" : "endsIn"),
        ),
      );
      const grid = element("div", "dce-units");
      grid.setAttribute("role", "timer");
      grid.setAttribute("aria-live", "off");
      const shown = units.filter(
        ([, label]) => label !== "seconds" || settings.showSeconds,
      );
      grid.style.setProperty("--dce-cols", String(shown.length));
      for (const [, label] of shown) {
        const unit = element("div", "dce-unit");
        const value = element("strong", "dce-value", "00");
        unit.append(value, element("span", "dce-label", t(label)));
        grid.append(unit);
        this.values.push(value);
      }
      this.timerRegion = grid;
      timer.append(grid);
      if (phase === "live") {
        const track = element("div", "dce-track");
        this.bar = element("span", "dce-bar");
        track.append(this.bar);
        timer.append(track);
      }
      content.push(timer);
    }
    this.display.replaceChildren(...content);
  }
  private tick(drop: Drop, phase: Phase, now: number) {
    if (phase === "ended" || !this.timerRegion) return;
    let remaining = Math.max(
      0,
      Math.floor(
        ((phase === "scheduled" ? drop.startsAt : drop.endsAt) - now) / 1000,
      ),
    );
    const parts: string[] = [];
    let index = 0;
    for (const [divisor, label] of units) {
      const value = Math.floor(remaining / divisor);
      remaining %= divisor;
      if (label === "seconds" && this.values.length < units.length) continue;
      const node = this.values[index];
      if (node) node.textContent = String(value).padStart(2, "0");
      parts.push(`${value} ${t(label).toLowerCase()}`);
      index++;
    }
    this.timerRegion.setAttribute(
      "aria-label",
      `${tp(phase === "scheduled" ? "opensIn" : "endsIn")} ${parts.join(", ")}`,
    );
    if (this.bar) {
      const span = Math.max(1, drop.endsAt - drop.startsAt);
      const elapsed = Math.min(1, Math.max(0, (now - drop.startsAt) / span));
      this.bar.style.width = `${(1 - elapsed) * 100}%`;
    }
  }
  private syncWaitlist(dropId: string | null, settings: WidgetSettings) {
    const spacing = dropId ? `${settings.gap}px` : "0";
    this.waitlistSlot.className = dropId ? "dce-waitlist" : "";
    this.waitlistSlot.style.marginTop = spacing;
    this.waitlistSlot.style.paddingTop = spacing;
    if (dropId === (this.waitlistDropId ?? null)) return;
    this.waitlistDropId = dropId ?? undefined;
    this.waitlistSlot.replaceChildren(
      ...(dropId ? [this.waitlist(dropId)] : []),
    );
  }
  private waitlist(dropId: string) {
    const preview = dropId === PREVIEW_ID;
    const container = document.createElement("div");
    const status = element("p", "dce-status");
    status.setAttribute("role", "status");
    const button = (label: MessageKey, quiet = false) =>
      element("button", quiet ? "dce-btn dce-btn-quiet" : "dce-btn", t(label));
    const showJoined = (message: MessageKey) => {
      const leave = button("waitlistLeave", true);
      leave.type = "button";
      leave.addEventListener("click", () => void submitLeave(leave));
      const check = element("span", "dce-check");
      check.innerHTML = icons.check;
      status.replaceChildren(check, t(message));
      const row = element("div", "dce-joined");
      row.append(status, leave);
      container.replaceChildren(row);
    };
    const submitLeave = async (leave: HTMLButtonElement) => {
      const credentials = readCredentials(dropId);
      if (!credentials) return showForm("");
      setBusy(leave, true);
      try {
        const response = await httpClient.fetchWithAuth(
          apiUrl("/api/waitlist"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "leave", dropId, ...credentials }),
          },
        );
        if (!response.ok) throw new Error(await errorMessage(response));
        writeCredentials(dropId, null);
        showForm(t("waitlistLeft"));
      } catch (error) {
        status.textContent =
          error instanceof Error && error.message ? error.message : t("failed");
        setBusy(leave, false);
      }
    };
    const showForm = (message: string) => {
      const form = document.createElement("form");
      form.noValidate = true;
      const renderedAt = performance.now();
      const emailId = `drop-waitlist-email-${dropId}`;
      const label = element("label", "dce-sr", t("waitlistEmail"));
      label.htmlFor = emailId;
      const email = element("input", "dce-input");
      email.id = emailId;
      email.type = "email";
      email.name = "email";
      email.autocomplete = "email";
      email.placeholder = tp("emailPlaceholder");
      email.required = true;
      email.maxLength = 254;
      if (!preview)
        void this.memberEmail().then((value) => {
          // Never overwrite what the visitor already typed.
          if (value && !email.value) email.value = value;
        });
      const consentLabel = element("label", "dce-consent");
      const consent = element("input", "dce-consent-input");
      consent.type = "checkbox";
      consent.required = true;
      const box = element("span", "dce-box");
      box.setAttribute("aria-hidden", "true");
      consentLabel.append(
        consent,
        box,
        element("span", "dce-consent-text", t("waitlistConsent")),
      );
      consent.addEventListener("change", () =>
        consent.removeAttribute("aria-invalid"),
      );
      // Honeypot: off-screen and skipped by keyboard and assistive tech.
      const trap = element("div", "dce-trap");
      trap.setAttribute("aria-hidden", "true");
      const website = document.createElement("input");
      website.type = "text";
      website.name = "website";
      website.tabIndex = -1;
      website.autocomplete = "off";
      trap.append(website);
      const submit = button("waitlistJoin");
      submit.type = "submit";
      const row = element("div", "dce-row");
      row.append(email, submit);
      status.textContent = message;
      form.append(
        element("p", "dce-wl-title", t("waitlistTitle")),
        element("p", "dce-wl-help", tp("waitlistHelp")),
        label,
        row,
        consentLabel,
        trap,
        status,
      );
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void join();
      });
      const join = async () => {
        if (submit.disabled) return;
        if (preview) {
          status.textContent = tp("previewSubmit");
          return;
        }
        if (!email.checkValidity() || !consent.checked) {
          status.textContent = t("waitlistInvalid");
          email.setAttribute("aria-invalid", String(!email.checkValidity()));
          if (!consent.checked) consent.setAttribute("aria-invalid", "true");
          (email.checkValidity() ? consent : email).focus();
          return;
        }
        email.removeAttribute("aria-invalid");
        setBusy(submit, true);
        status.textContent = "";
        try {
          const response = await httpClient.fetchWithAuth(
            apiUrl("/api/waitlist"),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "join",
                dropId,
                email: email.value,
                productId: this.getAttribute("product-id") || undefined,
                consent: true,
                website: website.value,
                elapsedMs: Math.round(performance.now() - renderedAt),
              }),
            },
          );
          if (!response.ok) throw new Error(await errorMessage(response));
          const result = joinResponseSchema.parse(await response.json());
          if (result.status === "already") {
            status.textContent = t("waitlistAlready");
          } else {
            if (result.id && result.token) {
              writeCredentials(dropId, { id: result.id, token: result.token });
              showJoined("waitlistJoined");
            } else {
              const check = element("span", "dce-check");
              check.innerHTML = icons.check;
              status.replaceChildren(check, t("waitlistJoined"));
              const done = element("div", "dce-joined");
              done.append(status);
              container.replaceChildren(done);
            }
            return;
          }
        } catch (error) {
          status.textContent =
            error instanceof Error && error.message
              ? error.message
              : t("failed");
        }
        setBusy(submit, false);
      };
      container.replaceChildren(form);
    };
    if (!preview && readCredentials(dropId)) showJoined("waitlistJoined");
    else showForm("");
    return container;
  }
}
export default DropCountdown;
