---
name: world-sites
description: >
  Build igloo.inc-genre "3D world" sites the house way — a full-screen
  persistent three.js world under the page where SCROLL FLIES THE CAMERA
  along a spline through waypoints, while all copy/UI stays real DOM synced
  to the same timeline (the hybrid contract). Ships the verified world
  engine (spline camera rig, rect-based pure-f(p) timeline, quality tiers,
  pmndrs post chain, ice/glass materials, procedural crystal generators,
  scroll-deterministic particles, loader, real-Chrome verify suite). Use
  WHENEVER asked for: an "igloo style" site, a "3D world" site, a
  "fly-through" or "camera flies through a scene on scroll" experience, a
  scroll-driven 3D descent/journey, a WebGL world with DOM copy over it,
  "world engine", a crystal/ice/glass cavern aesthetic, or an
  Awwwards-grade immersive scroll site. Composes with cinematic-dom-sites
  (page chassis doctrine) and live-graphics (GPU doctrine) — this skill is
  the world layer between them.
---

# World Sites

The genre igloo.inc made famous (Awwwards SOTY '24): the page IS a 3D world.
Scroll doesn't move a document — it flies a camera along a path through a
persistent scene. Igloo did it fully in WebGL (even the text is shaders).
**We invert one decision: copy stays real DOM.** That one change keeps SEO,
anchors, find-in-page, a11y, and the frozen-preview doctrine — and costs
almost nothing visually, because the DOM rides above the canvas and both
layers read the same timeline so they cannot drift.

Proven end-to-end in a reference build: 46-assertion verify
suite, 8.3ms avg frame at DPR 2 with the full post chain + one transmission
mesh. All assets here are byte-copies of that verified build.

## The hybrid contract (the architecture in one breath)

- ONE fixed full-viewport canvas at `z-0`, `aria-hidden`,
  `pointer-events:none`. DOM sections at `z-10` in **normal flow**, each a
  tall block (120–200vh) with `position:sticky` copy that dwells while the
  camera travels. No pinning library, no scroll hijack, native scrollbar.
- Global `p = scrollY / (scrollHeight − vh)`, rect-derived, never
  rAF-accumulated. Everything — camera pose, fx rack, growth scrubs, DOM
  emphasis — is a **pure function of p**. Scroll back = perfect reverse.
- Each DOM section carries `data-world="<waypoint id>"`. The engine
  measures the sections' dwell midpoints into an **anchor table** (p at
  which the camera sits exactly at waypoint i; anchor₀=0, anchorₙ=1). The
  DOM sync and the engine both derive from that same table → lockstep is
  verifiable mechanically (`engine waypoint == DOM data-active == camera
  within ε of f(p)` at any p).
- Between anchors, camera param eases with **smootherstep** (zero 1st+2nd
  derivative) → real dwell plateaus at every waypoint while copy is read —
  the deliberate UX improvement over igloo's continuous motion.
- `travelAt(p)` = normalized |du/dp| (peaks mid-segment, zero at dwells).
  Drive EVERYTHING speed-reactive from it — chromatic aberration, frost,
  particle drift/brightness — and rest frames stay deterministic (poster
  diffs work).

## Quality tiers (decided BEFORE the engine chunk downloads)

`assets/engine/env.ts` → `full` (fine pointer + wide + WebGL: composer,
transmission, DPR 2) / `lite` (WebGL but touch/narrow: DPR 1.3, no
composer, fake ice only, ~half counts) / `static` (reduced-motion or no
WebGL: baked poster + plain scrolling page; three.js never even
requested — assert it in verify). Every expensive knob lives in
`quality.ts`. Lite→static is a config flip.

## The glass/ice doctrine

- **Fake-first.** `IceMaterial.ts` `iceFake()`: dark MeshPhysicalMaterial +
  onBeforeCompile-injected fresnel rim, triplanar frost sparkle, fake
  interior scatter, per-instance tint. Dress the WHOLE world in it.
- **`transmission` on exactly ONE hero mesh, full tier only** (`iceReal()`).
  It re-renders the scene per frame. One transmissive core is a set-piece;
  twenty is a slideshow.
- Facets come from geometry (non-indexed + computeVertexNormals =
  flat-shaded), not normal maps.
- Emissive cyan **blows to white through ACES past ~0.95 intensity** — ramp
  color toward cyan on ignition but hold intensities back.

## Build workflow (phases with gates — do not skip gates)

1. **Chassis**: scaffold per cinematic-dom-sites doctrine (Vite 6 pin,
   React 18, Tailwind v4, three ~0.170, lenis, `postprocessing`); all
   sections with real copy; tier gate; code-split WorldStage. Gate: copy in
   DOM everywhere, static tier never downloads three.
2. **Spine first** (highest risk): engine + spline rig + timeline with
   placeholder boxes. Gate: the lockstep sweep + deep-link + reversal.
3. **Materials/lighting** → readback asserts lit+brand-colored; call budget.
4. **Procedural world** → growth monotone+reversible; tri budget; 10s
   scripted-scroll frame-time gate.
5. **Post FX + the one transmission mesh** → perf still green; lite
   provably skips composer.
6. **Loader + poster + regression** → poster-vs-live ≤2.5%; loader
   non-blocking.

Verify in REAL Chrome via the suite templates in `assets/verify/` (adapt
IDs/waypoints). Never judge WebGL in the preview pane.

## The infinite loop (v2 — endless seamless scroll, no footer)

Two mechanisms exist; pick by world shape:
- **Periodic field** (a ribbon-flow build): geometry repeats in Z, camera rides
  modulo one period. For continuous flows (tunnels, ribbons).
- **Closed circuit** (the world in these assets): waypoint-chamber
  worlds close the camera spline instead — `CatmullRomCurve3(pts, true,
  'centripetal')`, control point k at t=k/N, `getPointAt(0)===getPointAt(1)`.
  Add a 'return' waypoint whose flight + the WRAP SEGMENT land every fx
  channel exactly on hero's values as p→1⁻ (de-ignite behind thickening fog).

The machinery (all in `assets/engine/`):
- `p = fract(virtualScroll / limit)`; `useWorldLoop.ts` publishes
  `window.__worldScroll` — its ABSENCE is the static-tier switch
  (loopProgress clamps, page simply ends; never wrap-yank reduced-motion
  users).
- Modes: full+smooth = Lenis `{infinite:true}`; nosmooth/lite = native
  scroll + hard-wrap teleport (`y≥max−1→1`, `y≤0→max−2`); wrap lands inside
  two IDENTICAL 90svh `.void-span` bookends. Hide the scrollbar in loop
  modes (its jump is the one visual tell).
- **restP convention:** p=0 is MID-WRAP. The rest frame (poster, landing,
  verify) is `anchors[0]` — the hero anchor after the top void. Every
  "at rest" consumer must use `restP(anchors)`, never 0.
- Wrap segment math: spans `[a_last,1)∪[0,a₀)`, `d = pp≥a_last ?
  pp−a_last : pp+1−a_last`, `t = plateau(d/span)`; `fract(1)≡0` collapses
  the seam. Damping goes the SHORTEST WAY AROUND (`d>0.5→d−=1`).
- Particle drift phases must be INTEGER multiples of 2π in p (travel at
  the seam is nonzero) or the seam diff fails.
- **Seam proof** (verify): deterministic `__world.renderAt(p,w,h)` stills
  (grain OFF via postfx.setStill) — `Δ(frame(0), frame(1−ε)) < 0.3%` AND
  `Δ(frame(0), frame(0.5)) > 5%` (travel guard).
- **Measure document-absolute**: `rect.top + scrollY`, never `offsetTop`
  (it's relative to positioned ancestors — the void spacer shifted every
  anchor by 810px until this was fixed).
- Puppeteer `clip` is DOCUMENT-relative — full-viewport screenshots only
  once the rest frame lives past the void.

## The realism doctrine (v2 — "actually look real")

- **Pale world, accent signal.** Real ice is white-blue; the brand color
  exists ONLY in emissive accents (rim/scatter ignition ramp, core light,
  particles). A fully saturated world reads as toy plastic.
- **Real PBR textures, fetched CC0 at build time** (`assets/verify/
  fetch-tex.sh`): PolyHaven texture CDN (`dl.polyhaven.org/file/ph-assets/
  Textures/jpg/2k/<slug>/…`; query `api.polyhaven.com/files/<slug>` for
  URLs). No ice texture on PolyHaven → **white veined marble IS the ice**
  (marble_01 for crystals, marble_cliff_01 for cavern walls at repeat<1 to
  kill the masonry read), snow_02 for floors. ambientCG is an alternative
  when reachable. Self-host everything; runtime zero-external holds.
- Shard UVs: per-facet planar projection at world scale (non-indexed = no
  seams). NO `computeTangents` — three r170 derivative-TBN handles
  normal maps untangented, and tangents fight flatShading.
- Async without pop-in: world builds pale-untextured synchronously →
  `loadWorldTextures` (allSettled + 6s timeout) assigns maps + swaps the
  procedural env for the 1K HDRI (`RGBELoader`→PMREM, full tier only) →
  engine holds the reveal (`drawn` gate on `world.ready`) so the first
  visible frame is fully dressed. Texture failure = pale world, still ships.
- Enclosure kills "shapes floating in void": displaced tunnel tube +
  chamber domes (BackSide) + snow floors (`assets/gen/cavern.ts`, seeded
  CPU fbm from `noise.ts`). Keep enclosure materials matte and dim — mass,
  not jewelry. Watch floor-plane vs set-piece heights (the core was buried
  in snow until floated).
- Copy needs a REAL panel on a pale world (semi-opaque cold-dark card +
  hairline; no backdrop-filter over live WebGL) — a radial wash only works
  on dark worlds.

## v3 — "resembling real life" (the shapes themselves must be real)

Textures alone don't make realism — SILHOUETTES do. The v3 kit:
- `gen/icicles.ts` — smooth melted icicle/stalagmite lathe (indexed = soft
  normals, asymmetric cross-section, melt ripples, gentle bow, cylindrical
  UVs). Faceted shards stay for chunks; geometry normals decide the look,
  so materials default `flatShading:false` and serve both.
- **Glass crystals** (`quality.glassCrystals`, full tier): real
  `transmission` on the crystal materials — three renders ONE shared
  transmission target per frame, cost ≈ +0.1ms on this scene. This is the
  single biggest "it's actually ice" upgrade. Tone the fake scatter down
  in the ignite REGISTRY (update() recomputes from captured base values —
  mutating the uniform directly gets overwritten every frame).
- `materials/models.ts` + `verify/fetch-models.mjs` — PolyHaven CC0
  photoscanned rocks (moon_rock_* read as pale cave boulders), GLTFLoader,
  normalized to unit size, tinted into the scene light; loaded async into
  the same `world.ready` reveal gate. Real scanned geometry anchors the
  procedural world in reality.
- `gen/shafts.ts` — additive light-shaft cones. NEVER place one near the
  camera axis: edge-on shafts render as a dark column against the sky
  (observed empirically at the hero; side-on beams read as light).
- Debris volumes must stay clear of camera positions (a stray instance at
  the hero camera reads as a giant dark slab).

## v4 — tying the world to the BUSINESS ("The Life of a Call" kit)

A gorgeous abstract world sells nothing. The fix: the visitor rides the
CLIENT'S ACTUAL PRODUCT through the loop — every waypoint is a literal,
nameable object. Kit (all in `assets/gen/`, verified): `handset.ts`
(procedural telephone receiver + coiled cord + ringRipple sound rings),
`cable.ts` (braided line + shared combMaterial data pulses — reused by
`exchange.ts` switchboard threads), `waveform.ts` (48-bar CPU equalizer,
the voice speaking), `stations.ts` (counter bell, gear train, app panes),
`calendar.ts` (slot wall crystallizing via the growth scrub + canvas label
rails whose fonts promise JOINS world.ready), `nodes.ts` (business blocks
igniting), `callmote.ts` (one mote riding a CLOSED spine, K=1/loop — the
next call arriving as you wrap). The infinite loop IS the pitch when the
narrative loops ("the signal never sleeps").

New doctrine from this build:
- **Alpha-periodicity rule**: any birth/death animation cycle must satisfy
  alpha(0) == alpha(1) (fade IN at birth too) or the seam diff catches the
  pop — the emission moment is a discontinuity unless faded.
- Integer-K everywhere held; gears use integer TURNS per loop (mod-2π
  equivalence makes rotation seam-free).
- Composition beats size: recognizable objects must never hide behind the
  DOM panels (hero copy left, object right); waveform bars must run
  PERPENDICULAR to the sightline or they collapse into one bar; tunnel
  sheaths/braids must END before the next chamber's sightline.
- **Perf cadence trap**: headful rAF gap measurements are VSYNC CADENCE,
  not work (8.33ms = 120Hz pegged; 33.33ms = display dropped to 30Hz —
  low battery / Low Power Mode / occluded window). For true frame cost
  re-run with `--disable-gpu-vsync --disable-frame-rate-limit`.

## v7 — the GROUNDED journey (one real object, clean studio)

Surreal prop-worlds can read as "weird" to a business owner even when
technically perfect. The v7 answer keeps the whole flight engine but
replaces the world with ONE recognizable hero object in a clean studio
(cyc dome + glossy floor + contact glow) — an iPhone, product-page
lighting, Apple-launch grammar. Verified kit additions in `assets/gen/`:

- `device.ts` — procedural iPhone (RoundedBox body + screen/sheen planes,
  camera island, side buttons). Sits on a **turntable Group driven by a
  cumulative YAW array whose last entry = first + 2π**: exactly one
  revolution per loop, mod-2π equivalence makes the seam exact, and each
  waypoint picks which face/angle of the object the station sees.
- `screenStory.ts` — the object's own screen is the narrative surface: a
  CanvasTexture with **pure draw(state, k) functions** per section (ring /
  live transcript / SMS text-back / flows / calendar / idle). No timers,
  no randomness — **k = DOM localP of the dominant section** (from
  segmentAt weights), so screen UI scrubs with scroll, runs backwards,
  and stays byte-deterministic for stills/poster. Redraw only when
  `${state}:${Math.round(k*60)}` changes.
- Set pieces fade by SECTION WEIGHT (`weights[i] += 1-t; weights[j] += t`
  from segmentAt) — piecewise-continuous opacity per station, no popping,
  no anchor-awareness leaking into the world.
- Floating satellite props (app panes, cards) must clear the hero
  object's silhouette from THEIR waypoint's camera — check the shot, not
  the top view (a pane at x=0.79 hid behind a 0.75-half-width phone).
- **Poster gate v2**: pmndrs grain is NOT a stable pattern across page
  loads (a clean dark studio exposes ~5% uniform diff where busy worlds
  masked it). Bake the poster grain-OFF (`renderStill(..., stillMode)`)
  and verify by diffing a grain-free `renderAt(restP)` against the loaded
  poster IN-PAGE via 2d canvas (threshold ≤1.5%) — never screenshot-diff
  a grainy poster.

## Hard-won gotchas (each cost a debug cycle — respect them)

- **pmndrs merge rules**: convolution effects (ChromaticAberration, SMAA)
  cannot share an EffectPass with UV-transforming effects (custom `mainUv`)
  or each other. Split passes: `[frost, bloom, vignette, grain]` + `[ca]`.
- **ShaderMaterial precision**: don't write `precision mediump float;` in
  fragment GLSL — three injects headers; a uniform used in both stages then
  mismatches (`VALIDATE_STATUS false`).
- **SPA deep links**: the browser's anchor jump fires before React renders
  sections — re-run `scrollIntoView` once on mount, before the engine
  measures (engine boots after `fonts.ready`, so it lands on the restored
  position and its first synchronous frame is correct).
- **Additive particle blowout**: peak alpha ≤ ~0.5 and modest size bumps;
  travel-scaled effects multiply — check the mid-travel frame, not the
  dwell frames.
- **Poster diff must compare the WORLD**: hide `main, header, footer`
  (visibility) on both sides of the compare or DOM text counts as diff.
- **Precompile via visibility**: set `frustumCulled = false` on the
  transmission mesh (and instanced volumes) so every program compiles in
  the boot render behind the opacity-0 canvas — kills the first-scroll
  100ms hitch without `compileAsync` choreography.
- **Instanced attributes are per-geometry**: clone the shared shard
  geometry per InstancedMesh before setting `aDelay`/`aTint`.
- **Engine boot is try/caught** in WorldStage; the fixed poster underlay
  (`html.w-live` fades it) carries the page if WebGL dies.
- **Growth scrub** is a vertex-shader `smoothstep(aDelay, aDelay+0.35,
  uGrowth)` scale along local +Y (author shard bases at y=0) — geometry as
  pure f(p), reversible by construction.
- Keep the whole flight ≤ ~1000vh of scroll; wider tunnel radius than you
  think (camera spline ≠ tunnel path; give ≥1.5u clearance or you clip
  shard faces mid-travel).

## Assets (drop-in, from the verified v2 build — loop + glacial)

- `assets/engine/` — `engine.ts` (renderer, dirty loop, wrap-aware damped
  p, `__world` hooks incl. renderAt/restP, reveal gated on world.ready),
  `cameraRig.ts` (CLOSED Catmull-Rom circuit, N+1 arc-length table, travel
  look-ahead), `timeline.template.ts` (EDIT PER PROJECT: waypoints/fx; the
  wrap math, measurement + easing machinery is generic), `useWorldLoop.ts`
  (Lenis-infinite / hard-wrap / static modes + `__worldScroll` publisher),
  `quality.ts` (tiers incl. texSize/hdri), `postfx.ts` (+setStill),
  `WorldStage.tsx`, `useWaypoint.ts`, `env.ts` (tier gate, no three import).
- `assets/materials/` — `IceMaterial.ts` (pale glacial iceFake/iceReal +
  maps), `textures.ts` (PBR + HDRI loader w/ timeout fallback + applySet),
  `env.ts` (procedural pale equirect — instant placeholder + lite env).
- `assets/gen/` — `rng.ts`, `crystals.ts` (shard geometry now with
  per-facet planar UVs), `particles.ts` (2π-periodic scroll-deterministic
  dust), `noise.ts` (seeded CPU fbm), `cavern.ts` (tunnelTube /
  chamberDome / snowFloor enclosure).
- `assets/verify/` — verify (lockstep + seam proof + tiers) / perf /
  poster / shots templates + `fetch-tex.sh` (CC0 texture acquisition).

Per-project (never generic): waypoints + world layout, `scene/` chunks,
section copy, brand palette, poster, section heights.

## Composition

- **cinematic-dom-sites** owns the page chassis doctrine (reveals
  visible-by-default, Vite-6 pin, typography, gotchas) — follow it for
  everything DOM.
- **live-graphics** owns GPU fundamentals (frame-0 meaningful, DPR caps,
  pause on hide, reduced-motion, real-Chrome verification) — this skill is
  its biggest consumer.
- Optional upgrade path (documented, not built): GLTFLoader + DRACOLoader +
  KTX2Loader pipeline for AI-generated hero meshes (Higgsfield
  `generate_3d` image→GLB), re-materialed with IceMaterial.
