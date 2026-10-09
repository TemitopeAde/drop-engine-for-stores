// Drop Engine's own colors, as hex so they can animate.
// Sources: src/dashboard/dashboard.css (.de-app), src/domain/widget-settings.ts
// (countdown defaults), docs/market-listing-assets (film background and mint).
export const color = {
  bg: "#17382c", // countdown default text/accent, listing image background
  mint: "#8ee0bc", // stopwatch wedge in the app icon
  ink: "#172521", // --de-ink
  muted: "#64736d", // --de-muted
  line: "#e0e7e3", // --de-line
  green: "#12654e", // --de-green
  paper: "#eff5f1", // countdown default background
  white: "#ffffff",
};

export const font = {
  // Punchlines use Roboto, matching the App Market images.
  display: '"Roboto", system-ui, sans-serif',
  // The dashboard and the countdown's default theme font.
  ui: "system-ui, sans-serif",
};

export const W = 1920;
export const H = 1080;
