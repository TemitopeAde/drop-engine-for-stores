# Drop Engine launch film

A 45.6 s, 1920×1080, 60 fps launch video built in Remotion from the app's real UI: `dashboard.css`, the `Button` component, the countdown plugin's stylesheet and the `en.ts` strings. Twins in `src/twins/` copy each screen's markup but run on film time instead of timers and API calls.

## Regenerate

```sh
npm install
npm run audio        # voice (macOS `say`, Samantha), music bed and SFX into public/audio/ (gitignored)
npm run studio       # scrub the film
npm run render       # 240 fps master → 60 fps motion blur → out/drop-engine-launch/v1/
npm run verify
```

Review stills: `npx tsx scripts/stills.ts out/stills <frame>... --composition Launch [--debug]`.
`--debug` prints every `[data-target]` box. Use it to re-measure `src/films/launch/layout.ts` after a UI change.

## Where things live

- `src/films/launch/script.ts`: the narration, which is also the on-screen text.
- `src/films/launch/cues.ts`: the beat sheet (100 BPM, 19 bars). `vo.json` holds the measured voice lengths.
- `src/films/launch/acts/`: Titles (mark, punchlines, end card), Create, Store, WaitlistDash.
- `scripts/music.ts`, `scripts/sfx.ts`: the original music and sound effects, synthesized. There's no license to clear.

## Claims

The film shows only shipped behavior: scheduling, the server-timed countdown, waitlist signups and the drop opening on time. The end card says "Get it on the Wix App Market". Change `cta` in `script.ts` until the app is listed.
