import { httpClient } from "@wix/essentials";
import { projectionSchema, type Projection } from "../../../../domain/projection";
import { t } from "../../../../locales/en";
import styles from "./launch-countdown.module.css";

const units = [
  [86_400, "days"],
  [3_600, "hours"],
  [60, "minutes"],
  [1, "seconds"],
] as const;

class LaunchCountdown extends HTMLElement {
  static get observedAttributes() {
    return ["product-id", "headline"];
  }

  private projection?: Projection;
  private synchronizedAt = 0;
  private timer?: ReturnType<typeof setInterval>;
  private refreshTimer?: ReturnType<typeof setInterval>;
  private controller?: AbortController;
  private editor = false;
  private unavailable = false;
  private previewOrigin = 0;

  connectedCallback() {
    void this.detectEditor();
    void this.load();
    this.timer = setInterval(() => this.render(), 1_000);
    this.refreshTimer = setInterval(() => void this.load(), 15_000);
  }

  disconnectedCallback() {
    clearInterval(this.timer);
    clearInterval(this.refreshTimer);
    this.controller?.abort();
  }

  attributeChangedCallback(name: string) {
    if (!this.isConnected) return;
    if (name === "product-id") void this.load();
    else this.render();
  }

  private async detectEditor() {
    try {
      const { window: wixWindow } = await import("@wix/site-window");
      this.editor = (await wixWindow.viewMode()) === "Editor";
      this.render();
    } catch {
      this.editor = false;
    }
  }

  private async load() {
    this.controller?.abort();
    const controller = (this.controller = new AbortController());
    const productId = this.getAttribute("product-id")?.trim();
    if (!productId) {
      this.projection = undefined;
      this.unavailable = false;
      this.render();
      return;
    }
    try {
      const url = new URL(/* @vite-ignore */ "/api/storefront", import.meta.url);
      url.searchParams.set("productId", productId);
      const response = await httpClient.fetchWithAuth(url.href, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("availability");
      const projection = projectionSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      this.projection = projection;
      this.synchronizedAt = performance.now();
      this.unavailable = false;
      this.render();
    } catch {
      if (!controller.signal.aborted) {
        this.unavailable = true;
        this.render();
      }
    }
  }

  private render() {
    const productId = this.getAttribute("product-id")?.trim();
    const now = this.projection
      ? this.projection.serverNow + performance.now() - this.synchronizedAt
      : Date.now();
    const preview = this.editor && !this.projection && !productId;
    this.previewOrigin ||= now;
    const previewStart = this.previewOrigin + ((2 * 24 + 6) * 60 + 45) * 60_000;
    const drop = preview
      ? { name: "Sample product", startsAt: previewStart, endsAt: previewStart + 2 * 86_400_000 }
      : this.projection?.drop;
    const phase = drop
      ? now < drop.startsAt
        ? "scheduled"
        : now < drop.endsAt
          ? "live"
          : "ended"
      : undefined;
    const root = document.createElement("section");
    root.className = styles.root;
    root.setAttribute("aria-label", t("editor"));
    const heading = document.createElement("h2");
    heading.className = styles.heading;
    heading.textContent = this.getAttribute("headline")?.trim() || t("opens");
    const status = document.createElement("p");
    status.className = styles.status;
    status.setAttribute("role", "status");
    status.textContent = this.unavailable
      ? t("outageViolation")
      : !productId && !preview
        ? t("selectProduct")
        : !this.projection?.drop && !preview
          ? this.projection
            ? t("noLaunch")
            : t("loading")
          : t(phase === "scheduled" ? "opens" : phase === "live" ? "live" : "ended");
    root.append(heading, status);

    if (drop && phase && phase !== "ended" && !this.unavailable) {
      const countdown = document.createElement("div");
      countdown.className = styles.countdown;
      countdown.setAttribute("role", "timer");
      countdown.setAttribute("aria-live", "off");
      let remaining = Math.max(0, Math.floor(((phase === "scheduled" ? drop.startsAt : drop.endsAt) - now) / 1_000));
      const spoken: string[] = [];
      for (const [divisor, label] of units) {
        const value = Math.floor(remaining / divisor);
        remaining %= divisor;
        const unit = document.createElement("div");
        unit.className = styles.unit;
        const number = document.createElement("strong");
        number.className = styles.number;
        number.textContent = String(value).padStart(2, "0");
        const name = document.createElement("span");
        name.className = styles.label;
        name.textContent = t(label);
        unit.append(number, name);
        countdown.append(unit);
        spoken.push(`${value} ${t(label).toLowerCase()}`);
      }
      countdown.setAttribute("aria-label", `${t(phase === "scheduled" ? "opens" : "live")}: ${spoken.join(", ")}`);
      root.append(countdown);
    }
    this.replaceChildren(root);
  }
}

export default LaunchCountdown;
