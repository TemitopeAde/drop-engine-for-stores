// Target centers in app coordinates (1536 px wide dashboard/storefront space).
// Measured with --debug stills at the base camera (zoom 1.25: app = screen / 1.25),
// out/stills/debug/f780.png (Create drop) and f1500.png (storefront).
export const target = {
  name: { x: 733, y: 331 }, // measured 916,414
  start: { x: 702, y: 420 }, // measured 877,525
  end: { x: 733, y: 510 }, // measured 916,637
  zone: { x: 733, y: 597 }, // measured 916,746
  waitlist: { x: 322, y: 734 }, // measured 402,917
  products: { x: 386, y: 899 }, // measured 482,1124
  publish: { x: 1405, y: 989 }, // measured 1756,1236
  countdown: { x: 1180, y: 458 }, // measured 1475,572
  units: { x: 1160, y: 455 }, // measured 1450,569
  email: { x: 1078, y: 606 }, // measured 1348,757
  join: { x: 1337, y: 606 }, // measured 1671,757
  consent: { x: 915, y: 650 }, // checkbox, measured 1144,813
};
