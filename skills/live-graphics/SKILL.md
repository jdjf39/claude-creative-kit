---
name: live-graphics
description: >-
  The technique for putting graphics on a web page by GENERATING them live in
  the browser — on the GPU via WebGL/GLSL/canvas (shaders, particles, point
  clouds, 3D scenes) or as live vector animation (Rive/Lottie/animated SVG) —
  instead of shipping a pre-rendered image, GIF, or video. This is the modern
  replacement for the old baked-asset approach. Use this WHENEVER the task is to
  add or build a shader, particle system, point cloud, WebGL/canvas/three.js
  effect, GPU/hardware-accelerated graphic, generative or animated background,
  scroll- or cursor-reactive visual, or a Rive/Lottie/animated-SVG graphic — in
  ANY web project (site, landing page, dashboard, app, component); whenever
  replacing a static image or stock video with a graphic that is computed and
  animated live; and whenever someone references "the new style," "the new
  system," "live graphics," "GPU graphics," "generate it live instead of an
  image," "real-time graphics," or wants a visual that reacts to input. It is
  the rendering technique itself — not a visual design style and not tied to any
  one site. Ships with a decision framework, reusable raw-WebGL patterns, three
  verified drop-in components, and the hard-won guardrails (perf, frozen-preview-
  safe, SEO/a11y, mobile) so the graphic renders correctly instead of blank or
  janky. For building the surrounding page, compose with the cinematic-dom-sites
  skill; this skill is purely the live graphic.
---

# Live Graphics

The technique of rendering graphics **live in the browser** instead of shipping
them baked into a file. Two systems, and this skill is about moving from the old
one to the new one:

- **Old system — pre-rendered.** An image, GIF, or video. It is *baked*: it plays
  back, can't react, has a fixed resolution, and ships as a heavy file.
- **New system — live-generated.** A graphic computed on the fly every frame — on
  the GPU (WebGL/GLSL) or as live vector animation (Rive/Lottie). It *reacts* to
  scroll, cursor, data, and state; it is resolution-independent; it ships as a
  few KB of code. The cost is GPU/CPU time and developer effort.

This is a **rendering technique**, usable in any web project — a marketing page,
a dashboard, an app shell, a single component. It is not a visual design style.

## When live wins vs. when baked wins

Reach for a **live graphic** when the value is in *reaction, resolution, or
weight*:
- it must respond to input (scroll, cursor, audio, live data, app state),
- it must stay razor-sharp at any size / DPR,
- you want to avoid shipping a big image/video, or you have no asset at all,
- the effect is "impossible" to pre-bake (endless generative variation).

Keep it **baked** when the content is photographic or narrative — a real product
photo, a shot of a person, a filmed scene. Don't redraw reality on the GPU; a
real image is lighter and better. (You *can* animate a real photo with a shader —
see "shader image FX" — which is the hybrid.)

Use it **deliberately.** A live graphic costs GPU, battery, and complexity —
budget it where it earns its keep, not on every element. That's a performance and
UX call, not a stylistic one.

## The techniques (pick by what the graphic must do)

| Technique | What it is | Reach for it when | Weight |
|---|---|---|---|
| **Shader surface** (fragment GLSL) | A graphic drawn per-pixel from math — gradients, fluid, aurora, noise, iridescence | You want a generative animated surface/background with no asset | Light–med GPU · `assets/ShaderGradientHero.tsx` |
| **Point-cloud / particles** | Thousands of GPU points that drift, react, or assemble into a shape | Reactive fields, or a "comes together" reveal of a logo/word/object | Med · `assets/PointCloudReveal.tsx`, `assets/ShaderField.tsx` |
| **3D scene** (three.js) | Real geometry + lighting: a rotating model, product, sculpture | The subject is a 3D object you can model | Heavy · needs a GLB |
| **Shader image FX** | A real photo animated by a shader — ripple, distortion, transitions | Keep real content but make it react (the hybrid) | Med |
| **Rive** | Live *vector* animation with state machines | Interactive illustration / icon / diagram that reacts to input | Very light (KB) |
| **Lottie** | Designer-made vector animation (AE → JSON) | Looping illustration or animated icon, playback not interaction | Light |
| **SVG + GSAP / CSS** | Hand-animated vector in the DOM: line-draw, path morph | Data-viz, diagrams, logos that must stay real DOM + SEO-safe | Lightest |

Two families: **GPU/WebGL** (shaders, particles, 3D — most powerful, GPU cost,
canvas is invisible to SEO) and **vector** (Rive/Lottie/SVG — crisp, tiny,
accessible, an illustration look). Full how-to and library notes in
`references/techniques.md`.

## The engineering doctrine (why live graphics ship blank if you skip it)

A live graphic is real GPU/DOM engineering, and the environment punishes naïve
code. Full reasoning + a real-Chrome verification harness in
`references/doctrine.md`; the essentials:

1. **The preview/build pane can't render it.** Hidden/preview tabs pause
   `requestAnimationFrame` and report a `0×0` viewport, so an rAF-driven or
   viewport-sized canvas is frozen/blank there. **Verify in a real browser**
   (headless Chrome via `puppeteer-core`, or Claude-in-Chrome), never the pane.
2. **Make the meaningful state render at frame 0.** Seed a particle field across
   the screen; default a reveal to its assembled shape; add
   `preserveDrawingBuffer` so a paused tab keeps the last frame instead of going
   black. (Mirrors the visible-by-default rule for DOM animation.)
3. **Drive scroll from `getBoundingClientRect`, not rAF** — rect reads fire in
   hidden tabs; render with rAF as enhancement.
4. **Performance:** cap DPR at 2; scale particle count to viewport and halve on
   coarse pointers; pause the loop on `visibilitychange`; keep additive-blend
   alpha low (dense overlaps blow to white); dispose buffers/programs on unmount.
5. **SEO / a11y:** a `<canvas>` is invisible to search engines and screen
   readers — never put words or links only in it; decorative canvases are
   `aria-hidden` + `pointer-events-none`; honor `prefers-reduced-motion` with one
   static frame.
6. **Mobile:** lower counts, size shapes to fit width at true proportion, verify
   at ~390px.

## Stack notes

The reusable patterns and assets are **raw WebGL with zero dependencies**, so
they drop into React, Vue, Svelte, or vanilla with only the mount wiring
changed. Reach for a library only when it pays for itself: `three` for real 3D,
`@rive-app/react-canvas` for Rive, `lottie-react`/`@lottiefiles/dotlottie-react`
for Lottie, `ogl`/`curtains.js` for lighter shader-image work.

- If the host project uses Vite + React + `motion`, **pin Vite 6** — `motion/react`
  blanks `#root` on Vite 8 + plugin-react 6.
- Building the surrounding page too? Compose with the **cinematic-dom-sites**
  skill (that's the page; this is the graphic).

## Build workflow

1. **Choose the technique** from the table by what the graphic must *do* (react?
   assemble? be a surface? stay SEO-safe?).
2. **Start from an asset** in `assets/` and adapt — for a point cloud, the shape
   is a `<canvas>` draw function you swap; the sampling + morph are shape-agnostic.
3. **Apply the doctrine** (frame-0 meaningful, DPR cap, count scaling, pause on
   hide, reduced-motion, rect-based scroll, `aria-hidden`).
4. **Verify in real Chrome, not the preview pane** — use the puppeteer harness in
   `references/doctrine.md`; capture the meaningful state + a mobile width;
   confirm zero console errors and one expected WebGL context.
5. **Report honestly** — a still undersells motion; share the real local URL so
   the reaction/assembly/cursor behavior can be seen live.

## Resources

- `references/techniques.md` — every technique: when, how, and library notes.
- `references/doctrine.md` — the guardrails in depth + a copy-paste real-Chrome
  verification harness.
- `references/webgl-patterns.md` — reusable raw-WebGL building blocks (context,
  buffers, curl-noise drift, additive glow, cursor wake, shape morph, aspect-fit,
  resize, cleanup) with the gotchas that bite.
- `assets/ShaderGradientHero.tsx` — flowing fragment-shader gradient surface.
- `assets/PointCloudReveal.tsx` — shape-agnostic scroll-assembled point cloud.
- `assets/ShaderField.tsx` — ambient cursor-reactive particle field.
