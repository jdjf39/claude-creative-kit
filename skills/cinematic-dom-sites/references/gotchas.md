# Gotchas & verification

The environment and stack traps that make a cinematic page ship blank or broken,
and how to verify it actually works. Each was paid for by a real bug.

## The frozen preview pane (the big one)

The in-app / hidden preview tab runs with **`requestAnimationFrame` paused** and
reports **`innerHeight === 0`**, with `scrollTo` a no-op and scroll events not
firing. So:

- Anything gated on rAF (Motion's visibility, count-ups, canvas) is **frozen**.
- Anything gated on scroll position or `innerHeight` never advances.
- Screenshots of scrolled/animated states come back blank or unscrolled.

**Consequences for how you build:**
- **Reveals are visible by default** (the resting state is shown), driven by
  **IntersectionObserver + a setTimeout safety net** — both fire in hidden tabs.
  Never JS-gate opacity behind rAF. See `assets/Reveal.tsx`.
- **Count-ups / progress** render their final value by default.
- **Lenis is destroyed when the tab is hidden** so it can't swallow scroll in a
  paused loop (`assets/useLenis.ts`).

**Consequences for how you verify:** don't trust the preview pane for anything
motion- or scroll-related. Verify in a real browser (next section).

## Verify in a real browser, not the preview

Use headless real Chrome via `puppeteer-core` to drive scroll and screenshot the
revealed states, or Claude-in-Chrome MCP. Sketch:

```js
import puppeteer from '/path/to/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox','--hide-scrollbars'] })
const p = await b.newPage()
p.on('console', m => m.type()==='error' && console.log('ERR', m.text()))
await p.setViewport({ width:1440, height:900, deviceScaleFactor:2 })
await p.goto('http://localhost:PORT', { waitUntil:'networkidle2' })
await p.evaluate(() => document.querySelector('#process')?.scrollIntoView({block:'center'}))
await new Promise(r => setTimeout(r, 1200)) // let reveals fire
await p.screenshot({ path:'/tmp/section.png' })
await p.setViewport({ width:390, height:844, deviceScaleFactor:2, isMobile:true, hasTouch:true })
await p.reload({ waitUntil:'networkidle2' }); await p.screenshot({ path:'/tmp/mobile.png' })
await b.close()
```
Confirm: reveals actually fired (content visible), zero console errors, mobile
reflow is native (carousel/list, call bar), no horizontal scroll.

## Stack traps

- **Pin Vite 6.** `motion/react` throws "Invalid hook call / >1 copy of React"
  on Vite 8 + plugin-react 6 — the build passes but the runtime blanks `#root`.
  Dedupe/optimizeDeps don't fix it. Pin Vite 6 (and plugin-react 4), or drop
  Motion for a vanilla rAF scroll hook.
- **`lucide-react` has no brand icons.** Facebook/Instagram/X/etc. were removed;
  importing one throws and blanks the whole app. Use inline `<svg>` for socials.
- **Tailwind v4:** tokens in `@theme`, custom utilities via `@utility`, component
  classes in `@layer components` (so `font-bold`/family utilities still override
  per-element instead of being pinned). Watch Tailwind 4.3 on Node 24 (peer/
  build quirks) — pin a known-good 4.0.x if it bites.
- **`overflow-x: clip`, not `hidden`,** on the page shell — kills horizontal
  scroll from full-bleed elements without creating a scroll container that breaks
  `position: sticky`.
- **`100svh`, not `100vh`,** for full-height stages so mobile browser chrome
  doesn't cause jump/clipping.
- **WebGL maps (MapLibre) render blank in the frozen preview** — verify the map
  in a real browser with real data, screenshot only when focused.

## Pre-launch checklist

- Real business data in `business.ts`; `PLACEHOLDER` flag flipped only when
  confirmed. Phone/hours/address verified with the client.
- No invented reviews or stats.
- Every image has a specific `alt`; headings are a real `<h1>/<h2>` hierarchy.
- Reduced-motion path shows everything, calmly.
- Verified in real Chrome at desktop + ~390px; no console errors.
