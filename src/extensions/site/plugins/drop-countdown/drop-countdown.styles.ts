// Countdown markup assets, shared by the storefront plugin and the launch film.
const svg = (path: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
export const icons = {
  calendar: svg(
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  ),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  spinner: svg('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>'),
};

// Theme-driven values (font, colors, spacing) arrive as inline styles and
// custom properties; this sheet only owns structure and hierarchy.
export const styles = `
.dce{container-type:inline-size;line-height:1.45;text-align:start;border:1px solid color-mix(in srgb,currentColor 10%,transparent);box-shadow:0 1px 2px rgb(0 0 0/.04),0 12px 32px -18px rgb(0 0 0/.22)}
.dce *,.dce *::before,.dce *::after{box-sizing:border-box}
.dce[data-align=center]{text-align:center}
.dce-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:14px}
.dce[data-align=center] .dce-top{justify-content:center}
.dce-pill{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;font-size:.7em;font-weight:700;letter-spacing:.08em;line-height:1.2;text-transform:uppercase;color:var(--dce-accent);background:color-mix(in srgb,var(--dce-accent) 13%,transparent)}
.dce-pill[data-phase=ended]{color:inherit;background:color-mix(in srgb,currentColor 9%,transparent)}
.dce-dot{width:7px;height:7px;border-radius:50%;background:currentColor}
.dce-pill[data-phase=live] .dce-dot{animation:dce-pulse 1.8s ease-out infinite}
@keyframes dce-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,currentColor 55%,transparent)}80%,100%{box-shadow:0 0 0 7px transparent}}
.dce-tag{padding:4px 9px;border-radius:999px;border:1px dashed color-mix(in srgb,currentColor 35%,transparent);font-size:.68em;font-weight:600;opacity:.75}
.dce-title{margin:0;font-size:1.45em;font-weight:700;line-height:1.2;letter-spacing:-.015em}
.dce-name{margin:6px 0 0;opacity:.78}
.dce-meta{display:flex;align-items:center;gap:6px;margin:10px 0 0;font-size:.85em;opacity:.72}
.dce[data-align=center] .dce-meta{justify-content:center}
.dce-meta svg{flex:none}
.dce-caption{margin:0 0 10px;font-size:.7em;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.62}
.dce-units{display:grid;grid-template-columns:repeat(var(--dce-cols),minmax(0,1fr));gap:var(--dce-unit-gap)}
.dce-unit{padding:16px 6px 13px;text-align:center;border-radius:var(--dce-unit-radius);background:color-mix(in srgb,currentColor 6%,transparent);border:1px solid color-mix(in srgb,currentColor 9%,transparent)}
.dce-value{display:block;font-size:2.1em;font-weight:700;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.dce-label{display:block;margin-top:8px;font-size:.66em;font-weight:600;letter-spacing:.09em;text-transform:uppercase;opacity:.62}
.dce-track{height:6px;margin-top:14px;border-radius:999px;overflow:hidden;background:color-mix(in srgb,currentColor 10%,transparent)}
.dce-bar{display:block;height:100%;border-radius:inherit;background:var(--dce-accent);transition:width 1s linear}
.dce-notice{display:flex;align-items:flex-start;gap:10px;margin:0}
.dce-notice svg{flex:none;margin-top:.2em}
.dce-waitlist{border-top:1px solid color-mix(in srgb,currentColor 12%,transparent)}
.dce-wl-title{margin:0;font-weight:700}
.dce-wl-help{margin:3px 0 14px;font-size:.85em;opacity:.72}
.dce-row{display:flex;gap:8px}
.dce[data-align=center] .dce-row{justify-content:center}
.dce-input{flex:1 1 auto;min-width:0;padding:12px 14px;font:inherit;font-size:.95em;text-decoration:none;color:inherit;border-radius:var(--dce-control-radius);border:1px solid color-mix(in srgb,currentColor 24%,transparent);background:color-mix(in srgb,currentColor 4%,transparent);outline:none;transition:border-color .15s,box-shadow .15s}
.dce-input::placeholder{color:inherit;opacity:.5}
.dce-input:focus{border-color:var(--dce-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dce-accent) 22%,transparent)}
.dce-input[aria-invalid=true]{border-color:#d93a2b}
.dce-btn{flex:none;padding:12px 20px;font:inherit;font-size:.95em;font-weight:600;line-height:1.2;text-decoration:none;white-space:nowrap;cursor:pointer;border-radius:var(--dce-control-radius);border:1px solid var(--dce-accent);background:var(--dce-accent);color:var(--dce-on-accent);transition:filter .15s,transform .15s}
.dce-btn:hover:not(:disabled){filter:brightness(1.1)}
.dce-btn:active:not(:disabled){transform:translateY(1px)}
.dce-btn:disabled{opacity:.6;cursor:default}
.dce-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px}
.dce-btn[aria-busy]:disabled{opacity:1}
.dce-spin{display:inline-flex;animation:dce-spin 1s linear infinite}
@keyframes dce-spin{to{transform:rotate(360deg)}}
.dce-btn:focus-visible,.dce .dce-consent-input:focus-visible+.dce-box{outline:2px solid var(--dce-accent);outline-offset:2px}
.dce-btn-quiet{padding:8px 14px;font-size:.85em;color:inherit;background:transparent;border-color:color-mix(in srgb,currentColor 28%,transparent)}
.dce-consent{position:relative;display:flex;align-items:flex-start;gap:9px;margin-top:12px;font-size:.8em;text-align:start;cursor:pointer;user-select:none}
.dce-consent-text{opacity:.82}
.dce[data-align=center] .dce-consent{justify-content:center}
/* Site themes often restyle or hide native checkboxes; the input stays for semantics and our box shows its state. */
.dce .dce-consent-input{position:absolute!important;top:1px;left:0;width:16px!important;height:16px!important;margin:0!important;opacity:0!important;pointer-events:none!important}
.dce-box{flex:none;display:inline-grid;place-items:center;box-sizing:border-box;width:16px;height:16px;margin-top:1px;border:1.5px solid color-mix(in srgb,currentColor 55%,transparent);border-radius:4px;background:transparent;transition:background .15s,border-color .15s}
.dce-box::after{content:"";width:4px;height:8px;margin-top:-2px;border:solid var(--dce-on-accent);border-width:0 2px 2px 0;transform:rotate(45deg);opacity:0}
.dce .dce-consent-input:checked+.dce-box{background:var(--dce-accent);border-color:var(--dce-accent)}
.dce .dce-consent-input:checked+.dce-box::after{opacity:1}
.dce .dce-consent-input[aria-invalid=true]+.dce-box{border-color:#d93a2b}
.dce-status{margin:10px 0 0;font-size:.85em}
.dce-status:empty{display:none}
.dce-joined{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
.dce[data-align=center] .dce-joined{justify-content:center}
.dce-joined .dce-status{display:flex;align-items:center;gap:10px;margin:0;font-weight:600;font-size:.95em}
.dce-check{display:inline-grid;place-items:center;flex:none;width:28px;height:28px;border-radius:50%;color:var(--dce-on-accent);background:var(--dce-accent)}
.dce-trap{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.dce-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
@container (max-width:420px){.dce-row{flex-direction:column}.dce-btn{width:100%}}
@container (max-width:340px){.dce-value{font-size:1.55em}.dce-unit{padding:12px 4px 10px}.dce-label{font-size:.6em;letter-spacing:.05em}}
@media (prefers-reduced-motion:reduce){.dce *{animation:none!important;transition:none!important}}
`;
