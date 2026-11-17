# Scaffold recipe — what the assets don't carry

The assets are the engine; this is the exact wiring around them, taken from
the verified reference build. Ports: console=5196, world=5197 —
pick the next free one, `--strictPort`.

## package.json (pins that matter)

```json
{
  "scripts": {
    "dev": "vite --port <PORT> --strictPort",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port <PORT> --strictPort",
    "poster": "node scripts/poster.mjs",
    "shots": "node scripts/shots.mjs",
    "verify": "node scripts/verify.mjs"
  },
  "dependencies": {
    "lenis": "^1.1.17",
    "postprocessing": "^6.36.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.170.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/three": "^0.170.0",
    "@vitejs/plugin-react": "^4.3.4",
    "pngjs": "^7.0.0",
    "puppeteer-core": "^23.10.0",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.6.2",
    "vite": "^6.0.0"
  }
}
```

Vite 6 PINNED (cinematic-dom-sites doctrine). `tsconfig` trio from any
sibling project; `src/vite-env.d.ts` with `/// <reference types="vite/client" />`
or the css import fails tsc.

## index.html — the context census (verify depends on it)

```html
<script>
  document.documentElement.classList.add('js')
  ;(function () {
    window.__glCount = 0
    window.__glCountAll = 0
    var orig = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type) {
      var ctx = orig.apply(this, arguments)
      if (ctx && (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl')) {
        window.__glCountAll++
        if (this.isConnected) window.__glCount++
      }
      return ctx
    }
  })()
</script>
```

Plus font preloads for the three self-hosted woff2 families.

## File placement

```
src/lib/        env.ts useLenis.ts useReveal.ts useWaypoint.ts   (env+useWaypoint from assets)
src/world/      engine.ts timeline.ts cameraRig.ts quality.ts postfx.ts WorldStage.tsx
src/world/materials/  IceMaterial.ts env.ts
src/world/gen/  rng.ts crystals.ts particles.ts
src/world/scene/      buildWorld.ts  chunks…   ← PER-PROJECT, returns { update(p,fx,travel), dispose, coreMesh }
src/sections/   one component per waypoint + ui.tsx (WorldSection/Kicker/TopBar)
scripts/        verify.mjs poster.mjs shots.mjs perf.mjs (from assets/verify, adapt IDs)
```

`timeline.template.ts` → `src/world/timeline.ts`: edit SECTION_IDS,
WAYPOINTS (cam/look/fov/fx per waypoint) and nothing else — the
measurement, easing, travel, and localP machinery is generic.

## App wiring (the exact order that works)

```tsx
const WorldStage = lazy(() => import('./world/WorldStage'))
// in App():
const caps = useMemo(() => detectCaps(), [])
useLenis(caps.tier === 'full')
useReveal()
useWorldSync()          // stamps data-active from the shared timeline
useEffect(() => {       // SPA hash restore BEFORE engine measures
  if (!location.hash) return
  document.querySelector(location.hash)?.scrollIntoView({ behavior: 'instant', block: 'start' })
}, [])
return (
  <>
    <img src="/world-poster.webp" alt="" aria-hidden className="world-poster"
         onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
    {caps.tier !== 'static' && <Suspense fallback={null}><WorldStage tier={caps.tier} /></Suspense>}
    <TopBar />
    <main>…sections…</main>
    <Footer />
  </>
)
```

`useWorldSync` = rAF-throttled scroll listener → `measureAnchors()` +
`activeIndexAt(scrollProgress(), anchors)` → `data-active` on
`[data-world]` elements. Runs on static tier too (emphasis works without
WebGL).

## Section markup pattern

```tsx
<section id={id} data-world={id} data-active="false" style={{ minHeight: `${vh}vh` }} className="relative">
  <div className="sticky top-0 flex h-screen items-center justify-center px-5 md:px-16">
    <div className="copy-scrim max-w-xl px-4 py-10 md:px-10">{children}</div>
  </div>
</section>
```

Heights that worked: hero 120 / travel sections 140–170 / multi-item dwell
(vault) 200 / footer auto. Total ≤ ~1000vh. Footer still carries
`data-world` (any element — the selector is `[data-world=…]`, not
`section[…]`).

## CSS blocks to carry over (src/index.css)

From the reference build: `.world-stage` (fixed, explicit 100% box —
a canvas without one takes its buffer size), `.world-poster` +
`html.w-live` fade, `.world-loader` line, `.copy-scrim` radial
darkener, the `.rv` reveal system, `@theme` brand tokens. `main, header,
footer { position: relative; z-index: 10 }` puts all DOM above the canvas.

## Poster cycle

Build → preview → `npm run poster` (bakes public/world-poster.webp via
`__world.capturePoster` — the REAL p=0 frame through the post chain) →
rebuild so dist picks it up → verify. Re-bake whenever the hero framing or
materials change; the verify diff (≤2.5%, DOM hidden both sides) will tell
you when you forgot.

## v2 additions — loop wiring + textures

Wiring order for the infinite loop:
1. `useWorldLoop(caps.tier)` replaces any Lenis hook (it owns landing,
   publishing, and hash restore in loop modes; static tier keeps a plain
   `scrollIntoView` hash effect in App).
2. `.void-span` (90svh) before `<main>` and after the last section —
   **only when tier ≠ static**. No footer; contact folds into the CTA
   section; last section is a near-empty `return` (130vh, one mono line).
3. `html.w-loop` (set by the hook) hides the scrollbar.
4. Engine reads `loopProgress()` every rAF — no scroll listener.
5. Section measurement uses `docTop(el) = rect.top + scrollY` — NEVER
   offsetTop (positioned-ancestor trap once voids exist).

Textures: run `fetch-tex.sh` once per project (PolyHaven CC0 → public/tex/
{2k,1k} + winter_1k.hdr, ~5MB full / ~2MB lite). Stable filenames
{ice,wall,snow}_{color,normal,rough}.jpg are what textures.ts expects.
Poster cycle unchanged, but remember: bake AFTER the look settles, and the
poster is the restP frame (hero anchor), not p=0.
