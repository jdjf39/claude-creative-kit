# Techniques — the full menu

Every live-graphic technique, when to use it, how to implement, and library
notes. Skim the decision table in SKILL.md first; come here for the how.

## Table of contents
1. Shader surface (fragment GLSL)
2. Point-cloud reveal
3. Ambient particle field
4. 3D scene (three.js)
5. Shader image FX
6. Rive
7. Lottie
8. SVG + GSAP / CSS

---

## 1. Shader surface (fragment GLSL)

A full-bleed graphic drawn purely by a fragment shader — no geometry, just a
color computed per pixel from time, UV, and mouse. Flowing gradients, aurora,
liquid light, iridescent metal, plasma/noise fields.

- **When:** the hero needs atmosphere and stock video would feel generic; the
  brand story is "energy / flow / precision-in-motion." It is the real version
  of a CSS `@keyframes aurora` or a static radial-gradient glow.
- **How:** one fullscreen triangle, a fragment shader mixing 2–3 brand colors
  via layered value/simplex noise (fbm) driven by `uTime` and `uMouse`. Start
  from `assets/ShaderGradientHero.tsx`.
- **Guardrails:** frame 0 is already a calm gradient (visible-by-default);
  reduced-motion → static; DPR cap; pause on hide. Cheap on geometry, so the
  cost is fill-rate — keep it fullscreen-simple, avoid heavy per-pixel loops.

## 2. Point-cloud reveal

Thousands of GPU points start scattered as dust and **assemble into a shape** as
the section scrolls, then hold (and optionally disperse on exit). The signature
"comes together" moment.

- **When:** you have a signature object, logo, or word — a vehicle, a product, a
  monogram, a wordmark — and want it to materialize.
- **How:** the target shape is rasterized from a `<canvas>` 2D draw, then opaque
  pixels are alpha-sampled into point targets — **no art assets needed**. The
  vertex shader lerps `mix(scatter, shape, progress)`; progress is eased from a
  rect-based scroll read. Start from `assets/PointCloudReveal.tsx`.
- **Swap the shape:** replace the draw function (`drawTruck` → `drawSUV`, a
  hexagon logo, or `fillText` for a wordmark). Sampling + morph are
  shape-agnostic. For crisp legibility a wordmark/logo is lowest-risk; a vehicle
  silhouette is higher-wow but needs a clean path — verify it reads.
- **Guardrails:** static default `progress = 1` (assembled), `preserveDrawingBuffer`,
  size the shape to ~82% width at true proportion on any aspect
  (`uScale ≈ 0.82 * aspect` with `shape.x /= aspect`), keep the caption in real
  DOM and clear of the shape.

## 3. Ambient particle field

Faint sapphire/brand-tint motes drifting on a curl-noise flow behind the whole
page, parting around the cursor. Adds depth to dark negative space.

- **When:** dark sections read flat and you want life without a set-piece. Note:
  this competes with a point-cloud reveal for attention — usually pick one. On a
  disciplined site, a single reveal beats page-wide atmosphere.
- **How:** `assets/ShaderField.tsx`, fixed behind content
  (`fixed inset-0 z-0 pointer-events-none`), shows through transparent sections.
- **Guardrails:** keep it *very* faint (peak alpha ~0.4) so it never fights text;
  it only shows through negative space, not behind opaque media.

## 4. 3D scene (three.js)

Real geometry with materials and lighting — a rotating car, floating product,
morphing sculpture, displaced terrain.

- **When:** the product itself is the star and you have (or can generate) a GLB
  model; budget justifies the weight and the ~150 KB+ of `three`.
- **How:** `three` + optionally `@react-three/fiber` + `@react-three/drei`.
  Load the GLB with `useGLTF`, drive rotation/scroll with GSAP ScrollTrigger or a
  scroll hook + Lenis. For a fully custom look, a `THREE.Points` cloud with a
  custom shader (as in the Acme Particle Hero) morphing between shapes via a
  rasterized-glyph target.
- **Guardrails:** lazy-load the scene (dynamic import) so it never blocks first
  paint; cap DPR; dispose geometries/materials on unmount; provide a poster/still
  for reduced-motion and first paint. Everything in the doctrine still applies —
  verify in real Chrome, not the preview.

## 5. Shader image FX

Keep a real photo but animate it with a shader: hover ripple/liquid distortion,
scroll-driven RGB-shift, WebGL image-to-image transitions, "reveal" wipes.

- **When:** you must keep real content (a client's actual photos) but want them
  to feel alive. Best of both worlds: real subject + generative motion.
- **How:** a plane textured with the image, a fragment shader displacing UVs by a
  noise/gradient map, driven by hover/scroll uniforms. Libraries: `ogl` (tiny),
  `curtains.js`, or raw three.js. The classic "distortion slider" pattern.
- **Guardrails:** the underlying `<img>` should still exist in DOM (or be
  preloaded) for SEO/alt text; the shader is an enhancement layer.

## 6. Rive

Interactive **vector** animation with state machines — graphics that respond to
hover, scroll, click, or app state. Illustrations, mascots, animated icons,
process diagrams.

- **When:** you want an *animated graphic instead of a static image* that is
  crisp, tiny (KB), reliable, and interactive. Excellent for "how it works"
  steps, hero illustrations, playful brand marks.
- **How:** `@rive-app/react-canvas`. Designer exports a `.riv`; you wire inputs
  to a state machine. `<Rive src="..." stateMachines="..." />`.
- **Guardrails:** provide `aria-label`/adjacent text; it's canvas, so not
  indexable content. Pause offscreen with the built-in options.

## 7. Lottie

Designer-made vector animation (After Effects → JSON via Bodymovin). Looping
illustrations and animated icons; playback, not deep interaction.

- **When:** you have or can commission an AE animation and need it to loop or
  scrub. Lighter mental model than Rive when you don't need state machines.
- **How:** `lottie-react` (`<Lottie animationData={json} />`) or the newer
  `@lottiefiles/dotlottie-react` for `.lottie` (smaller). Scrub to scroll by
  setting frame from scroll progress.
- **Guardrails:** JSON can get heavy — prefer `.lottie`, lazy-load, and cap size.
  Same reduced-motion + offscreen-pause hygiene.

## 8. SVG + GSAP / CSS

Hand-animated vector directly in the DOM: line-draw (`stroke-dashoffset`), path
morphing, animated diagrams and data-viz.

- **When:** the graphic should stay **real DOM** — SEO-safe, accessible,
  copy/paste-able, pixel-crisp. Logos drawing themselves, animated stat
  diagrams, process arrows.
- **How:** inline `<svg>` + GSAP (`DrawSVGPlugin`, `MorphSVGPlugin`) or pure CSS
  keyframes for simple cases. Motion (framer-motion) can animate SVG too.
- **Guardrails:** this is the most accessible option — favor it when the content
  is informational (diagrams, charts) rather than pure atmosphere. Respect
  reduced-motion.
