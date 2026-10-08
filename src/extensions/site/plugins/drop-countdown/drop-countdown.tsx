import { httpClient } from "@wix/essentials";
import {
  projectionSchema,
  type Projection,
} from "../../../../domain/projection";
import { parseWidgetSettings } from "../../../../domain/widget-settings";
import { t } from "../../../../locales/en";
class DropCountdown extends HTMLElement {
  static get observedAttributes() {
    return ["product-id", "drop-settings"];
  }
  private timer?: ReturnType<typeof setInterval>;
  private refreshTimer?: ReturnType<typeof setInterval>;
  private controller?: AbortController;
  private projection?: Projection;
  private synchronizedAt = 0;
  private unavailable = false;
  connectedCallback() {
    void this.load();
    this.timer = setInterval(() => this.render(), 1000);
    this.refreshTimer = setInterval(() => void this.load(), 15_000);
  }
  disconnectedCallback() {
    clearInterval(this.timer);
    clearInterval(this.refreshTimer);
    this.controller?.abort();
  }
  attributeChangedCallback(name: string) {
    if (!this.isConnected) return;
    if (name === "product-id") {
      this.projection = undefined;
      void this.load();
    } else this.render();
  }
  private async load() {
    this.controller?.abort();
    const controller = (this.controller = new AbortController());
    const productId = this.getAttribute("product-id");
    if (!productId) {
      this.replaceChildren();
      return;
    }
    try {
      const url = new URL(
        /* @vite-ignore */ "/api/storefront",
        import.meta.url,
      );
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
  private render() {
    const drop = this.projection?.drop;
    if (!drop && !this.unavailable) {
      this.replaceChildren();
      return;
    }
    const settings = parseWidgetSettings(this.getAttribute("drop-settings"));
    const root = document.createElement("section");
    root.setAttribute("aria-label", t("editor"));
    root.style.cssText =
      "box-sizing:border-box;width:100%;margin:16px 0;border:0;";
    root.style.color = settings.textColor;
    root.style.background = settings.background;
    root.style.font = settings.font;
    root.style.textDecoration = settings.textDecoration;
    root.style.padding = `${settings.padding}px`;
    root.style.borderRadius = `${settings.radius}px`;
    root.style.maxWidth = `${settings.maxWidth}px`;
    if (this.unavailable) {
      root.textContent = t("outageViolation");
      this.replaceChildren(root);
      return;
    }
    if (!drop || !this.projection) return;
    // Monotonic elapsed time avoids client clock changes; server remains authoritative.
    const now =
      this.projection.serverNow + performance.now() - this.synchronizedAt;
    const scheduled = now < drop.startsAt,
      live = !scheduled && now < drop.endsAt;
    const heading = document.createElement("h3");
    heading.textContent =
      settings.headline || t(scheduled ? "opens" : live ? "live" : "ended");
    heading.style.cssText =
      "font:inherit;font-size:1.25em;font-weight:600;margin:0 0 8px";
    root.append(heading);
    if (settings.showName) {
      const name = document.createElement("p");
      name.textContent = drop.name;
      name.style.margin = "0 0 16px";
      root.append(name);
    }
    if (scheduled || live) {
      let remaining = Math.max(
        0,
        Math.floor(((scheduled ? drop.startsAt : drop.endsAt) - now) / 1000),
      );
      const countdown = document.createElement("div");
      countdown.style.display = "flex";
      countdown.style.gap = `${settings.gap}px`;
      countdown.style.flexWrap = "wrap";
      const divisors = [86400, 3600, 60, 1],
        labels = ["days", "hours", "minutes", "seconds"] as const;
      for (let i = 0; i < divisors.length; i++) {
        const value = Math.floor(remaining / divisors[i]);
        remaining %= divisors[i];
        if (i === 3 && !settings.showSeconds) continue;
        const unit = document.createElement("div");
        const number = document.createElement("strong");
        number.textContent = String(value).padStart(2, "0");
        number.style.cssText =
          "display:block;font-variant-numeric:tabular-nums;font-size:1.75em";
        const label = document.createElement("span");
        label.textContent = t(labels[i]);
        label.style.fontSize = ".7em";
        unit.append(number, label);
        countdown.append(unit);
      }
      root.append(countdown);
    }
    if (settings.compact && this.getBoundingClientRect().width < 360)
      root.style.padding = `${Math.min(settings.padding, 16)}px`;
    this.replaceChildren(root);
  }
}
export default DropCountdown;
