# Doctrine & Verification

The hard-won rules that keep live graphics from shipping blank or janky, and how
to actually verify them. Every rule here was paid for by a real bug.

## Table of contents
1. Why the preview pane lies
2. Visible-by-default (frozen-preview-safe)
3. Scroll progress without rAF
4. Performance guardrails
5. Accessibility & SEO
6. The real-Chrome verification harness

---

## 1. Why the preview pane lies

The in-app / hidden preview tab runs with `requestAnimationFrame` **paused** and
frequently reports `window.innerWidth/innerHeight === 0` (and `documentElement`
clientWidth/Height 0). Consequences:

- Any rAF-driven canvas never advances — frozen on whatever it drew first.
- Any canvas sized from `window.innerWidth * dpr` collapses to `0×0` and draws
  nothing. `readPixels` returns all zeros; screenshots are black.

This is an **environment artifact, not your bug**. Do not chase it, and do not
try to "fix" the effect to make the preview show it. Verify in real Chrome
(section 6). Confirm the diagnosis if unsure:

```js
// in the preview pane's console
({ inner: [innerWidth, innerHeight], doc: [document.documentElement.clientWidth, document.documentElement.clientHeight] })
// → {inner:[0,0], doc:[0,0]} means the whole pane is frozen; nothing viewport-sized renders here
```

## 2. Visible-by-default (frozen-preview-safe)

Because rAF may never tick, the **meaningful** state must be what renders at
frame 0 — mirroring the DOM reveal rule (reveals are visible by default,
transform-only CSS, driven by IntersectionObserver + a safety timer, never
JS-gated opacity behind rAF).

For canvases:
- **Seed across the screen at init.** A particle field CPU-randomizes all
  positions up front, so frame 0 is already a full field, not all-at-origin.
- **Default a reveal to its payoff.** Initialize `progress = 1` (assembled
  shape). A scroll handler overrides it the instant the tab is live; a
  frozen/no-JS render still shows the finished shape, not dust.
- **`preserveDrawingBuffer: true`** so a paused tab keeps the last frame instead
  of clearing to black. The cost is negligible for a few thousand points and it
  buys you never-blank behavior in hidden/paused contexts.

## 3. Scroll progress without rAF

`getBoundingClientRect()` reads fire in hidden tabs; rAF callbacks do not.
Compute scroll progress from the rect (correct immediately), and only *render*
via rAF:

```js
const readScroll = () => {
  const r = track.getBoundingClientRect()
  const scrollable = r.height - window.innerHeight
  const p = scrollable > 4 ? Math.min(Math.max(-r.top / scrollable, 0), 1) : 1
  // shape the arc, e.g. assemble → hold → disperse
  progress = p < 0.42 ? ease(p / 0.42) : p < 0.68 ? 1 : 1 - ease((p - 0.68) / 0.28)
}
```

## 4. Performance guardrails

- **DPR cap:** `Math.min(window.devicePixelRatio || 1, 2)`. Retina at 3× doubles
  fill cost for no visible gain.
- **Count scales to viewport:** base the particle count on `innerWidth*innerHeight`
  and halve on coarse pointers (`matchMedia('(pointer: coarse)')`).
- **Pause when hidden:** on `visibilitychange`, cancel rAF when `document.hidden`,
  resume when visible. Saves battery and GPU.
- **Additive-blowout:** with `blendFunc(ONE, ONE)` / premultiplied additive,
  dense overlaps sum toward white. Keep per-particle alpha low (peak ~0.5) and
  color the points (sapphire, not white) so accumulation stays on-brand.
- **Drift vs lattice:** organic drift (curl noise) hides a multitude of sins;
  rigid grids/lattices expose every imperfection. Grids are the hardest shape to
  make look good — budget extra time or avoid.
- **Cleanup:** delete buffers/programs and remove every listener on unmount, or
  React StrictMode's double-mount leaks contexts.

## 5. Accessibility & SEO

- A `<canvas>` is invisible to search engines and screen readers. **Never** put
  words or navigable links only in the canvas.
- Decorative canvases: `aria-hidden="true"` + `pointer-events-none`.
- `prefers-reduced-motion: reduce` → draw exactly one static frame and return
  (no loop). Provide a sensible still (assembled shape / calm gradient).
- Don't let the effect reduce real-text contrast. Test the headline over the
  busiest frame.

## 6. The real-Chrome verification harness

The preview pane can't render WebGL, so verify with headless real Chrome. This
uses `puppeteer-core` driving the system Chrome with software WebGL + a short
settle so the animation advances. Adapt paths.

```js
// shoot.mjs — run with: node shoot.mjs
import puppeteer from '/path/to/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/tmp/shots'
const URL = 'http://localhost:5182'

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
         '--ignore-gpu-blocklist','--enable-webgl','--no-sandbox','--hide-scrollbars'],
})
async function shot(vp, name, scrollFrac = 0, selector = null) {
  const page = await browser.newPage()
  const errs = []
  page.on('console', m => m.type() === 'error' && errs.push(m.text()))
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message))
  await page.setViewport(vp)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
  const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length)
  if (selector) await page.evaluate((s, f) => {
    const el = document.querySelector(s)
    const top = window.scrollY + el.getBoundingClientRect().top
    window.scrollTo({ top: top + (el.offsetHeight - innerHeight) * f, behavior: 'instant' })
  }, selector, scrollFrac)
  await new Promise(r => setTimeout(r, 1500)) // let it drift / assemble
  await page.screenshot({ path: `${OUT}/${name}` })
  console.log(name, 'canvases=' + canvases, 'errors=' + JSON.stringify(errs.slice(0,5)))
  await page.close()
}
await shot({ width:1440, height:900, deviceScaleFactor:2 }, 'desktop.png', 0.55, '#brand')
await shot({ width:390, height:844, deviceScaleFactor:2, isMobile:true, hasTouch:true }, 'mobile.png', 0.55, '#brand')
await browser.close()
```

`puppeteer-core` + a downloaded Chrome usually already exist under
`~/.cache/puppeteer/`; if a project has `puppeteer-core` in `node_modules`, reuse
its path. **A pixel-read sanity check** (drawing happened) from inside the page:
count non-transparent samples via `gl.readPixels` — but only meaningful with
`preserveDrawingBuffer: true` (otherwise the buffer is empty between frames).

Report honestly afterward: a still badly undersells motion — the value is the
drift, the assembly, the cursor wake. Share the real local URL so the user sees
it live.
