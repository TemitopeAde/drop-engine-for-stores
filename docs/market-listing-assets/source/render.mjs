// Renders the App Market images in docs/market-listing-assets/.
// Usage: node docs/market-listing-assets/source/render.mjs
// Images are HTML mockups that use the app's real UI copy and colors.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..");

const C = {
  bg: "#17382c",
  ink: "#172521",
  muted: "#64736d",
  line: "#e0e7e3",
  green: "#12654e",
  mint: "#8ee0bc",
  paper: "#eff5f1",
};

const base = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=block" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font-family:Roboto,system-ui,sans-serif;background:${C.bg};color:#fff;overflow:hidden;-webkit-font-smoothing:antialiased}
.stage{position:relative;width:100%;height:100%;padding:56px 64px 0}
.cap{text-align:center}
.cap h1{margin:0;font-size:40px;font-weight:700;letter-spacing:-.01em}
.cap p{margin:10px 0 0;font-size:21px;opacity:.75}
.win{background:#fff;color:${C.ink};border-radius:14px 14px 0 0;box-shadow:0 30px 80px -20px rgb(0 0 0/.55);overflow:hidden}
.bar{display:flex;align-items:center;gap:8px;height:38px;padding:0 16px;background:#f3f5f4;border-bottom:1px solid ${C.line}}
.bar i{width:11px;height:11px;border-radius:50%;background:#d6dcd9}
.bar .url{margin-left:14px;flex:1;height:22px;border-radius:6px;background:#fff;border:1px solid ${C.line};font-size:12px;color:${C.muted};display:flex;align-items:center;padding:0 10px}
/* countdown — mirrors src/extensions/site/plugins/drop-countdown */
.dce{--a:${C.green};color:${C.bg};background:${C.paper};border:1px solid rgb(23 56 44/.1);border-radius:14px;padding:22px;box-shadow:0 1px 2px rgb(0 0 0/.04),0 12px 32px -18px rgb(0 0 0/.22)}
.pill{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--a);background:rgb(18 101 78/.13)}
.pill b{width:7px;height:7px;border-radius:50%;background:currentColor}
.dce h3{margin:12px 0 0;font-size:22px;font-weight:700;letter-spacing:-.015em}
.dce .nm{margin:4px 0 0;font-size:15px;opacity:.78}
.dce .meta{margin:8px 0 14px;font-size:13px;opacity:.72}
.units{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.u{padding:14px 4px 11px;text-align:center;border-radius:10px;background:rgb(23 56 44/.06);border:1px solid rgb(23 56 44/.09)}
.u span{display:block;font-size:30px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.u small{display:block;margin-top:7px;font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;opacity:.62}
.track{height:6px;margin-top:14px;border-radius:999px;background:rgb(23 56 44/.1);overflow:hidden}
.track span{display:block;height:100%;width:68%;background:var(--a);border-radius:inherit}
.wl{margin-top:16px;padding-top:16px;border-top:1px solid rgb(23 56 44/.12)}
.wl h4{margin:0 0 10px;font-size:15px}
.row{display:flex;gap:8px}
.in{flex:1;padding:11px 13px;border-radius:8px;border:1px solid rgb(23 56 44/.24);background:rgb(23 56 44/.04);font-size:14px;opacity:.9}
.btn{padding:11px 18px;border-radius:8px;background:var(--a);color:#fff;font-size:14px;font-weight:600;white-space:nowrap}
.consent{display:flex;gap:8px;margin-top:10px;font-size:12.5px;opacity:.85}
.box{flex:none;width:15px;height:15px;border-radius:3px;background:var(--a);display:grid;place-items:center}
/* dashboard */
.dash{display:grid;grid-template-columns:200px 1fr;height:100%}
.side{background:#fff;border-right:1px solid ${C.line};padding:18px 12px;font-size:14px}
.side div{padding:9px 12px;border-radius:8px;color:${C.muted}}
.side .on{background:${C.paper};color:${C.green};font-weight:600}
.side .head{color:${C.ink};font-weight:700;font-size:15px;margin-bottom:8px}
.main{background:#f6f8f7;padding:26px 30px}
.ttl{display:flex;align-items:center;justify-content:space-between}
.ttl h2{margin:0;font-size:24px}
.ttl p{margin:4px 0 0;color:${C.muted};font-size:13.5px}
.card{background:#fff;border:1px solid ${C.line};border-radius:12px;padding:20px 22px;margin-top:18px}
.lbl{font-size:12.5px;font-weight:600;color:${C.muted};margin:0 0 6px}
.fld{border:1px solid #cfd8d4;border-radius:8px;padding:10px 12px;font-size:14px;background:#fff}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;margin:0 6px 6px 0;border-radius:999px;background:${C.paper};color:${C.green};font-size:13px;font-weight:500}
.b1{display:inline-block;padding:10px 18px;border-radius:999px;background:${C.green};color:#fff;font-size:14px;font-weight:600}
.b2{display:inline-block;padding:9px 17px;border-radius:999px;border:1px solid ${C.green};color:${C.green};font-size:14px;font-weight:600}
.radio{display:flex;align-items:center;gap:9px;font-size:14px;margin:6px 0}
.radio i{width:16px;height:16px;border-radius:50%;border:2px solid #b5c2bc}
.radio i.on{border:5px solid ${C.green}}
.tog{width:34px;height:20px;border-radius:999px;background:${C.green};position:relative;flex:none}
.tog::after{content:"";position:absolute;right:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#fff}
.st{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600}
.st.sch{background:#e8f0fb;color:#1f5bb5}.st.live{background:#e3f4ec;color:${C.green}}.st.sub{background:#e3f4ec;color:${C.green}}.st.uns{background:#eef0ef;color:${C.muted}}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-size:12px;font-weight:600;color:${C.muted};padding:10px 12px;border-bottom:1px solid ${C.line}}
td{padding:13px 12px;border-bottom:1px solid #edf1ef}
/* store */
.store{padding:0}
.nav{display:flex;align-items:center;justify-content:space-between;padding:16px 34px;border-bottom:1px solid ${C.line};font-size:14px}
.nav .logo{font-weight:900;letter-spacing:.14em;font-size:15px}
.nav .links{display:flex;gap:26px;color:${C.muted}}
.pdp{display:grid;grid-template-columns:1fr 1fr;gap:38px;padding:30px 34px}
.photo{border-radius:12px;background:linear-gradient(160deg,#f4ece2,#e7d7c4);display:grid;place-items:center;aspect-ratio:1}
.pname{margin:0;font-size:28px;font-weight:700;letter-spacing:-.01em}
.price{margin:6px 0 16px;font-size:19px;color:${C.muted}}
.cart{margin-top:14px;padding:14px;border-radius:8px;background:${C.ink};color:#fff;text-align:center;font-weight:600;font-size:15px}
</style>`;

// Sample product: a candle jar, drawn so no stock photography is needed.
const jar = (w = 220) => `
<svg width="${w}" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="110" cy="246" rx="86" ry="10" fill="rgb(0 0 0/.12)"/>
  <rect x="34" y="70" width="152" height="176" rx="22" fill="#2f4a3f"/>
  <rect x="34" y="70" width="152" height="176" rx="22" fill="url(#g)"/>
  <rect x="58" y="128" width="104" height="66" rx="6" fill="#f4ece2"/>
  <rect x="74" y="146" width="72" height="8" rx="4" fill="#2f4a3f"/>
  <rect x="84" y="164" width="52" height="6" rx="3" fill="#a08a72"/>
  <rect x="44" y="40" width="132" height="38" rx="10" fill="#b98b5a"/>
  <rect x="44" y="40" width="132" height="12" rx="6" fill="#cfa274"/>
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
</svg>`;

const countdown = ({ waitlist = true, compact = false } = {}) => `
<div class="dce"${compact ? ' style="padding:16px"' : ""}>
  <span class="pill"><b></b>Scheduled</span>
  <h3>This drop opens soon</h3>
  <p class="nm">Autumn Collection Drop</p>
  <p class="meta">Opens Fri, Oct 24 · 10:00 AM EDT</p>
  <div class="units">
    <div class="u"><span>02</span><small>Days</small></div>
    <div class="u"><span>14</span><small>Hours</small></div>
    <div class="u"><span>37</span><small>Minutes</small></div>
    <div class="u"><span>08</span><small>Seconds</small></div>
  </div>
  <div class="track"><span></span></div>
  ${
    waitlist
      ? `<div class="wl"><h4>Get notified when it opens</h4>
  <div class="row"><div class="in">alex@example.com</div><div class="btn">Join the waitlist</div></div>
  <div class="consent"><span class="box"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2l2 2 4-4.4" stroke="#fff" stroke-width="1.8" fill="none"/></svg></span>Email me about this drop. I can unsubscribe at any time.</div></div>`
      : ""
  }
</div>`;

const browser = (url, body, h) =>
  `<div class="win" style="height:${h}px"><div class="bar"><i></i><i></i><i></i><div class="url">${url}</div></div>${body}</div>`;

const storeNav = `<div class="nav"><span class="logo">EMBER &amp; OAK</span><span class="links"><span>Shop</span><span>Drops</span><span>About</span><span>Cart (1)</span></span></div>`;

const sidebar = (active) => `<div class="side">
  <div class="head">Your site</div>
  <div>Home</div><div>Catalog</div><div>Orders</div><div>Customers</div>
  <div class="${active === "drops" ? "on" : ""}">Drop Engine</div>
  <div class="${active === "waitlist" ? "on" : ""}" style="padding-left:24px">Waitlist</div>
  <div>Settings</div></div>`;

const page = (inner, caption, sub) => `<!doctype html><html><head><meta charset="utf-8">${base}</head><body><div class="stage">
  <div class="cap"><h1>${caption}</h1>${sub ? `<p>${sub}</p>` : ""}</div>
  <div style="position:absolute;left:64px;right:64px;bottom:0">${inner}</div></div></body></html>`;

// Stopwatch mark: ring, crown, and the remaining-time wedge.
const mark = (size, ring = "#fff", wedge = C.mint) => `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="43" y="6" width="14" height="9" rx="3" fill="${ring}"/>
  <rect x="47.5" y="12" width="5" height="8" fill="${ring}"/>
  <rect x="74" y="20" width="10" height="7" rx="2.5" transform="rotate(45 79 23.5)" fill="${ring}"/>
  <circle cx="50" cy="57" r="35" fill="none" stroke="${ring}" stroke-width="8"/>
  <path d="M50 57 L50 32 A25 25 0 0 1 71.65 69.5 Z" fill="${wedge}"/>
  <circle cx="50" cy="57" r="4.5" fill="${ring}"/>
</svg>`;

const images = [
  {
    file: "icon.png",
    w: 1000, h: 1000, scale: 1, opaque: true,
    html: `<!doctype html><html><head>${base}</head><body style="display:grid;place-items:center">${mark(620)}</body></html>`,
  },
  {
    file: "01-main.png",
    w: 1200, h: 900,
    html: `<!doctype html><html><head><meta charset="utf-8">${base}</head><body>
<div style="display:grid;grid-template-columns:1fr 520px;gap:40px;align-items:center;height:100%;padding:0 64px">
  <div>
    ${mark(96)}
    <h1 style="margin:26px 0 0;font-size:72px;font-weight:900;letter-spacing:-.025em;line-height:1">Drop Engine</h1>
    <p style="margin:22px 0 0;font-size:30px;line-height:1.35;opacity:.86;max-width:470px">Launch products on schedule, with a live countdown.</p>
  </div>
  <div style="background:#fff;border-radius:18px;padding:22px;box-shadow:0 30px 80px -20px rgb(0 0 0/.55);color:${C.ink}">
    <div class="photo" style="aspect-ratio:auto;height:230px">${jar(160)}</div>
    <p class="pname" style="font-size:22px;margin-top:16px">Ember Soy Candle</p>
    <p class="price" style="margin-bottom:12px;font-size:16px">$38.00</p>
    ${countdown({ waitlist: false, compact: true })}
  </div>
</div></body></html>`,
  },
  {
    file: "02-create-drop.png",
    w: 1200, h: 900,
    html: page(
      browser("manage.wix.com · Drop Engine", `<div class="dash" style="height:640px">${sidebar("drops")}<div class="main">
  <div class="ttl"><div><h2>Create drop</h2><p>Server time controls checkout. Cancelling immediately restores normal purchasing.</p></div>
  <div style="display:flex;gap:10px"><span class="b2">Save draft</span><span class="b1">Publish drop</span></div></div>
  <div class="card">
    <p class="lbl">Drop name</p><div class="fld">Autumn Collection Drop</div>
    <p class="lbl" style="margin-top:16px">Products <span style="font-weight:400">· 6 selected</span></p>
    <div><span class="chip">Ember Soy Candle</span><span class="chip">Moss Ceramic Mug</span><span class="chip">Cedar Diffuser</span><span class="chip">Oak Tray</span><span class="chip">+2 more</span><span class="b2" style="padding:5px 12px;font-size:13px">Choose products</span></div>
  </div>
  <div class="card"><div class="g3">
    <div><p class="lbl">Starts</p><div class="fld">Oct 24, 2026 · 10:00 AM</div></div>
    <div><p class="lbl">Ends</p><div class="fld">Oct 26, 2026 · 10:00 AM</div></div>
    <div><p class="lbl">Time zone</p><div class="fld">America/New_York</div></div></div>
    <div class="grid2" style="margin-top:16px">
      <div><p class="lbl">After the drop ends</p>
        <div class="radio"><i class="on"></i>Restore normal purchasing</div>
        <div class="radio"><i></i>Keep purchasing blocked</div></div>
      <div><p class="lbl">Waitlist</p><div style="display:flex;gap:10px;align-items:center;font-size:14px;margin-top:6px"><span class="tog"></span>Collect waitlist signups</div>
      <p style="font-size:12.5px;color:${C.muted};margin:8px 0 0">Shoppers can join from the product page countdown until the drop opens.</p></div>
    </div></div>
</div></div>`, 680),
      "Schedule a drop in minutes",
      "Pick products, a launch window and a time zone.",
    ),
  },
  {
    file: "03-product-page.png",
    w: 1200, h: 900,
    html: page(
      browser("emberandoak.com/product/ember-soy-candle", `<div class="store">${storeNav}<div class="pdp">
  <div class="photo">${jar(250)}</div>
  <div><p class="pname">Ember Soy Candle</p><p class="price">$38.00</p>${countdown()}<div class="cart">Add to Cart</div></div>
</div></div>`, 690),
      "A live countdown on every product page",
      "Added to your Wix Stores product page automatically.",
    ),
  },
  {
    file: "04-checkout-blocked.png",
    w: 1200, h: 900,
    html: page(
      browser("emberandoak.com/cart", `<div class="store">${storeNav}<div style="display:grid;grid-template-columns:1fr 320px;gap:30px;padding:30px 34px">
  <div>
    <h2 style="margin:0 0 18px;font-size:26px">My cart</h2>
    <div style="display:flex;gap:18px;align-items:center;padding:18px 0;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}">
      <div class="photo" style="width:110px;flex:none">${jar(74)}</div>
      <div style="flex:1"><div style="font-size:17px;font-weight:600">Ember Soy Candle</div><div style="color:${C.muted};margin-top:4px">Qty 1</div></div>
      <div style="font-size:17px">$38.00</div>
    </div>
    <div style="display:flex;gap:12px;align-items:flex-start;margin-top:18px;padding:16px 18px;border-radius:10px;background:#fdf1ef;border:1px solid #f3c9c2;color:#8c2b1f;font-size:15px">
      <svg width="20" height="20" viewBox="0 0 20 20" style="flex:none;margin-top:1px"><circle cx="10" cy="10" r="9" fill="#d93a2b"/><path d="M10 5.5v5.5M10 13.6v.1" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>
      This product is not available for purchase until the drop opens.</div>
    <div style="margin-top:22px;max-width:520px">${countdown({ waitlist: false, compact: true })}</div>
  </div>
  <div style="background:#f6f8f7;border-radius:12px;padding:22px;align-self:start">
    <h3 style="margin:0 0 14px;font-size:19px">Order summary</h3>
    <div style="display:flex;justify-content:space-between;font-size:15px;color:${C.muted}"><span>Subtotal</span><span>$38.00</span></div>
    <div style="display:flex;justify-content:space-between;font-size:15px;color:${C.muted};margin-top:8px"><span>Shipping</span><span>Calculated at checkout</span></div>
    <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-top:16px;padding-top:14px;border-top:1px solid ${C.line}"><span>Total</span><span>$38.00</span></div>
    <div style="margin-top:18px;padding:13px;border-radius:8px;background:#c9d1cd;color:#fff;text-align:center;font-weight:600">Checkout</div>
  </div>
</div></div>`, 690),
      "Checkout opens exactly on time",
      "Shoppers can browse and add to cart. Checkout waits for the launch.",
    ),
  },
  {
    file: "05-widget-settings.png",
    w: 1200, h: 900,
    html: page(
      `<div class="win" style="height:690px;display:grid;grid-template-columns:1fr 330px">
  <div style="background:#e9ecea;display:grid;place-items:center;padding:30px">
    <div style="width:470px;outline:2px solid #3b82f6;outline-offset:6px;border-radius:6px">
      <div class="dce" style="--a:#7a3e1d;background:#f8efe6;color:#3b2214;border-radius:4px;font-family:Georgia,serif">
        <span class="pill" style="background:rgb(122 62 29/.13)"><b></b>Scheduled</span>
        <h3>This drop opens soon</h3><p class="nm">Autumn Collection Drop</p><p class="meta">Opens Fri, Oct 24 · 10:00 AM EDT</p>
        <div class="units" style="grid-template-columns:repeat(3,1fr)">
          <div class="u" style="border-radius:2px;background:rgb(59 34 20/.06)"><span>02</span><small>Days</small></div>
          <div class="u" style="border-radius:2px;background:rgb(59 34 20/.06)"><span>14</span><small>Hours</small></div>
          <div class="u" style="border-radius:2px;background:rgb(59 34 20/.06)"><span>37</span><small>Minutes</small></div>
        </div>
        <div class="track"><span style="background:#7a3e1d"></span></div>
      </div>
    </div>
  </div>
  <div style="background:#fff;border-left:1px solid ${C.line};font-size:14px">
    <div style="padding:16px 18px;border-bottom:1px solid ${C.line};font-weight:700;font-size:16px">Drop countdown</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;padding:12px 18px;border-bottom:1px solid ${C.line}">
      ${["Content", "Typography", "Colors", "Countdown", "Layout"].map((t) => `<span style="padding:5px 10px;border-radius:999px;font-size:12.5px;${t === "Colors" ? `background:${C.paper};color:${C.green};font-weight:600` : `color:${C.muted}`}">${t}</span>`).join("")}
    </div>
    <div style="padding:16px 18px;display:grid;gap:16px">
      ${[["Text color", "#3b2214"], ["Background", "#f8efe6"], ["Accent", "#7a3e1d"]].map(([l, c]) => `<div style="display:flex;justify-content:space-between;align-items:center"><span>${l}</span><span style="display:flex;align-items:center;gap:8px;color:${C.muted};font-size:12.5px">${c}<i style="width:26px;height:26px;border-radius:6px;background:${c};border:1px solid #d5dbd8"></i></span></div>`).join("")}
      <div><p class="lbl">Font</p><div class="fld" style="font-family:Georgia,serif">Georgia</div></div>
      <div><p class="lbl">Corner radius · 4px</p><div style="height:4px;border-radius:9px;background:#dfe5e2;position:relative"><span style="position:absolute;left:0;width:14%;height:100%;background:${C.green};border-radius:9px"></span><i style="position:absolute;left:12%;top:-6px;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid ${C.green}"></i></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center"><span>Show seconds</span><span class="tog" style="background:#c6cfcb"></span></div>
      <div style="display:flex;justify-content:space-between;align-items:center"><span>Compact on mobile</span><span class="tog"></span></div>
      <span class="b2" style="text-align:center">Reset to theme</span>
    </div>
  </div></div>`,
      "Match the countdown to your brand",
      "Fonts, colors, spacing and layout, right in the Editor.",
    ),
  },
  {
    file: "06-waitlist.png",
    w: 1200, h: 900,
    html: page(
      browser("manage.wix.com · Drop Engine", `<div class="dash" style="height:640px">${sidebar("waitlist")}<div class="main">
  <div class="ttl"><div><h2>Waitlist · Autumn Collection Drop</h2><p>Shoppers can join from the product page while this drop is scheduled.</p></div><span class="b2">Export CSV</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px">
    <div class="card" style="margin:0"><div style="font-size:30px;font-weight:700">142</div><div style="color:${C.muted};font-size:13.5px;margin-top:2px">subscribed</div></div>
    <div class="card" style="margin:0"><div style="font-size:30px;font-weight:700">147</div><div style="color:${C.muted};font-size:13.5px;margin-top:2px">total entries</div></div>
  </div>
  <div class="card" style="padding:6px 10px">
    <table><thead><tr><th>Email address</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>
    ${[
      ["maya.chen@example.com", "Oct 21, 2026 · 9:14 AM", "sub"],
      ["j.rivera@example.com", "Oct 21, 2026 · 8:52 AM", "sub"],
      ["sam.okafor@example.com", "Oct 20, 2026 · 6:40 PM", "sub"],
      ["lena.weber@example.com", "Oct 20, 2026 · 3:05 PM", "uns"],
      ["priya.n@example.com", "Oct 20, 2026 · 11:27 AM", "sub"],
      ["tom.becker@example.com", "Oct 19, 2026 · 7:58 PM", "sub"],
    ].map(([e, d, s]) => `<tr><td>${e}</td><td style="color:${C.muted}">${d}</td><td><span class="st ${s}">${s === "sub" ? "Subscribed" : "Unsubscribed"}</span></td><td style="color:${C.muted};text-align:right">⋯</td></tr>`).join("")}
    </tbody></table></div>
</div></div>`, 680),
      "Build a waitlist before launch day",
      "Consent-based signups, deduplicated and ready to review.",
    ),
  },
  {
    file: "07-mobile.png",
    w: 1200, h: 900,
    html: `<!doctype html><html><head><meta charset="utf-8">${base}</head><body>
<div style="display:grid;grid-template-columns:1fr 390px;gap:30px;align-items:center;height:100%;padding:0 90px 0 80px">
  <div><h1 style="margin:0;font-size:46px;font-weight:700;letter-spacing:-.01em;line-height:1.1">Built for mobile shoppers</h1>
  <p style="margin:18px 0 0;font-size:22px;opacity:.75;line-height:1.4">The countdown adapts to small screens and right-to-left languages.</p></div>
  <div style="width:390px;height:800px;border-radius:52px;background:#0c1f18;padding:14px;box-shadow:0 30px 80px -20px rgb(0 0 0/.6)">
    <div style="height:100%;border-radius:40px;background:#fff;color:${C.ink};overflow:hidden">
      <div style="height:44px;display:flex;justify-content:center;align-items:center"><i style="width:110px;height:28px;border-radius:999px;background:#0c1f18"></i></div>
      <div style="display:flex;justify-content:space-between;padding:4px 20px 12px;border-bottom:1px solid ${C.line};font-size:13px"><b style="letter-spacing:.14em">EMBER &amp; OAK</b><span>☰</span></div>
      <div style="padding:16px 18px">
        <div class="photo" style="aspect-ratio:auto;height:190px">${jar(118)}</div>
        <p class="pname" style="font-size:21px;margin-top:14px">Ember Soy Candle</p><p class="price" style="font-size:15px;margin:4px 0 12px">$38.00</p>
        <div style="font-size:13px">${countdown({ compact: true }).replace('class="units"', 'class="units" style="gap:6px"')}</div>
      </div>
    </div>
  </div>
</div></body></html>`,
  },
  {
    file: "promo-banner.jpg",
    w: 540, h: 360, scale: 1,
    html: `<!doctype html><html><head>${base}</head><body style="background:${C.green}">
<div style="position:relative;height:100%;display:grid;place-items:center">
  <div style="position:absolute;width:420px;height:420px;border-radius:50%;background:rgb(255 255 255/.07);left:-90px;top:-150px"></div>
  <div style="position:absolute;width:300px;height:300px;border-radius:50%;background:rgb(255 255 255/.06);right:-70px;bottom:-140px"></div>
  <div style="display:flex;align-items:center;gap:34px;position:relative">
    ${mark(170, "#fff", C.mint)}
    <div style="background:linear-gradient(160deg,#f4ece2,#e7d7c4);border-radius:18px;padding:22px 26px;box-shadow:0 20px 40px -14px rgb(0 0 0/.45)">${jar(120)}</div>
  </div>
</div></body></html>`,
  },
];

const tmp = mkdtempSync(join(tmpdir(), "listing-"));
const browserApp = await chromium.launch({ executablePath: process.env.DROP_ENGINE_BROWSER || undefined });
try {
  for (const img of images) {
    const page = await browserApp.newPage({ viewport: { width: img.w, height: img.h }, deviceScaleFactor: img.scale ?? 2 });
    await page.setContent(img.html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const target = join(out, img.file);
    if (img.file.endsWith(".jpg")) {
      await page.screenshot({ path: target, type: "jpeg", quality: 92 });
    } else if (img.opaque) {
      // App icon must be 24-bit PNG: go through JPEG to drop the alpha channel.
      const jpg = join(tmp, "icon.jpg");
      await page.screenshot({ path: jpg, type: "jpeg", quality: 100 });
      execFileSync("sips", ["-s", "format", "png", "-m", "/System/Library/ColorSync/Profiles/sRGB Profile.icc", jpg, "--out", target], { stdio: "ignore" });
    } else {
      await page.screenshot({ path: target });
    }
    await page.close();
    console.log("wrote", img.file);
  }
} finally {
  await browserApp.close();
  rmSync(tmp, { recursive: true, force: true });
}
