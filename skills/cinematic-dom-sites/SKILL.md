---
name: cinematic-dom-sites
description: >-
  Build premium, cinematic client one-pager websites the house way — a
  long-scroll editorial page on Vite 6 + React 18 + TypeScript + Tailwind v4 +
  Motion (framer-motion) + Lenis, carried by real photography / generated
  cinematic imagery and scroll-scrubbed video, with a disciplined reveal-on-
  scroll motion system, editorial typography, and one restrained accent on
  near-black (or warm) ink. This is the DEFAULT style for lead-gen / agency /
  local-business / marketing / landing / portfolio sites. Use this WHENEVER
  building or redesigning such a site, or when asked for a "cinematic one-pager,"
  a "$10k-looking" landing page, a scroll-scrubbed video hero, reveal-on-scroll
  animations, a before/after slider, a pinned scroll section, a premium
  restrained aesthetic, "the old style," "my usual style," or "the current
  style"; and whenever wiring the Vite+React+Tailwind+Motion+Lenis stack for a
  marketing page. It carries the hard-won doctrine (visible-by-default reveals,
  frozen-preview-safe, Vite-6 pin, real-DOM SEO, mobile-native) so the page
  ships polished instead of blank or janky. Pairs with the live-graphics skill
  when the page also wants a live-generated WebGL/GLSL/particle graphic — this
  skill is the page/chassis, that one is the live graphic itself.
---

# Cinematic DOM Sites

The house style for premium client sites: a fast, real-DOM, long-scroll
**editorial** page that feels like a film, built from real photography /
generated cinematic imagery, scroll-scrubbed video, and a disciplined motion
system — no WebGL required. Reference lane: **Polestar configurator × Porsche
newsroom × Linear**. Restraint is the whole game.

This is the *chassis*. If the page also wants one live-generated set-piece (a
shader hero, a point-cloud reveal), compose with the **live-graphics** skill —
but most client sites are pure chassis and should stay that way.

Grounded in a long run of real client builds (dealerships, trades, bakeries, agencies). Drop-in
code lives in `assets/`.

## The feel (what "cinematic" means here)

- **Full-bleed imagery + video carry the page.** Real client photos, or
  generated cinematic imagery (Higgsfield / Veo / Seedance), or a scroll-scrubbed
  hero video. The imagery is the emotion; the layout gets out of its way.
- **One disciplined accent** on cool near-black ink (or a warm espresso/stone
  theme per client). Never two. The accent appears in the CTA, focus rings,
  small data marks — not everywhere.
- **Editorial typography.** A display face (Clash Display / Anton / Instrument
  Serif / Marcellus) + a grotesk body (Hanken / General Sans / Geist) + a mono
  for data labels (Geist Mono / JetBrains Mono). Fluid clamp scale, tight
  tracking, `text-wrap: balance` on headings.
- **Texture so the dark never feels cheap:** fine film grain, soft vignettes,
  hairline borders, faint masked grids.
- **Motion is choreography, not decoration** — a reveal system with *varied*
  entrance grammars, a scroll-scrubbed hero, pinned sections, and Lenis momentum.
- **Honest content.** Real business data in one source-of-truth config; no fake
  reviews or invented stats. Flag placeholders explicitly.

## Stack & the non-negotiables

Vite 6 + React 18 + TypeScript + Tailwind v4 + Motion (framer-motion) + Lenis.

- **Pin Vite 6.** `motion/react` throws "Invalid hook call / >1 copy of React" on
  Vite 8 + plugin-react 6 (build passes, runtime blanks `#root`). If you hit it,
  use a vanilla rAF scroll hook or pin Vite 6.
- **`lucide-react` has no brand icons** (Facebook/Instagram/X removed) —
  importing one throws and blanks the app. Use inline `<svg>` for socials.
- **Tailwind v4:** tokens in `@theme`, custom utilities via `@utility`,
  component classes in `@layer components` (so weight/family utilities still
  override). Watch Tailwind 4.3 on Node 24; use `overflow-x: clip` (not hidden)
  on the page shell to kill horizontal scroll without breaking sticky.
- Keep all copy in **real DOM** — headings, paragraphs, links — for SEO and
  screen readers. Imagery gets real `alt`. This is a marketing site; it must rank.

## The reveal doctrine (why sections ship blank if you skip it)

The build/preview environment punishes naïve scroll animation, and the fix is
also just good engineering. Full reasoning in `references/gotchas.md`; the core:

- **The preview pane runs hidden:** `requestAnimationFrame` is paused, and it
  reports `innerHeight === 0` with `scrollTo` a no-op and scroll events not
  firing. Anything gated on rAF or scroll position renders **blank** there.
- **So reveals are VISIBLE BY DEFAULT.** The element's resting state is shown;
  the entrance is enhancement. Drive it with **IntersectionObserver + a
  setTimeout safety net** (both fire in hidden/headless tabs, unlike rAF) —
  **never** JS-gated opacity behind rAF. Use `assets/Reveal.tsx`.
- **Transform/opacity only, via CSS classes + a `data-shown` flag.** The CSS
  ships the animation; JS only flips the flag.
- **Vary the entrance grammar** (fade-up / wipe / rise / line-mask) so the page
  doesn't enter every block identically — that uniform fade-up is the "templated"
  tell. `assets/theme.css` ships all four.
- **Reduced motion:** show everything immediately, no transitions.

## Anatomy of the page

A typical one-pager, top to bottom (see `references/anatomy.md` for each):

Nav (thin, blurred) → **scroll-scrubbed hero** (video on desktop, poster still on
mobile/reduced-motion) → marquee → showcase / experience (often pinned) →
inventory / services / menu → a full-bleed detail "band" → pricing / financing →
process / "how it works" → booking modal or contact → reputation (honest) →
visit / map → footer → mobile call bar. Not every site needs every section —
choose by the business.

Signature components (templated or described in `references/`): the scrubbed hero
(`assets/ScrubHero.tsx`), the reveal (`assets/Reveal.tsx`), Lenis smooth-scroll
(`assets/useLenis.ts`), before/after compare slider, pinned scroll section,
count-ups, marquee, custom cursor, multi-step booking modal.

## Build workflow

1. **Theme first.** Start from `assets/theme.css`: set the ink surfaces, the one
   accent, the type trio, and confirm the reveal system + grain are in. Pick the
   font pairing and reference lane before writing components.
2. **Single source of truth.** Put all business data (name, phone, hours,
   address, socials, coords) in `src/data/business.ts`; components read from it.
   Keep a `PLACEHOLDER` flag and confirm real details before launch.
3. **Compose the sections** from the anatomy, wiring `Reveal` (varied grammars),
   the scrubbed hero, and Lenis. Real DOM for all copy; real `alt` on imagery.
4. **Mobile-native, not shrunk.** Reflow to swipe carousels / vertical lists,
   add a mobile call bar, size type fluidly. Verify at ~390px.
5. **Verify in a real browser, not the preview pane.** Scroll/rAF are frozen in
   preview; use puppeteer or Claude-in-Chrome to drive scroll and screenshot the
   revealed states. Confirm no console errors and that reveals actually fire.
6. **Report honestly** — say what's placeholder, what's verified, and share the
   real local URL.

## Resources

- `references/anatomy.md` — the section catalog and signature components, with
  when/why each is used.
- `references/motion.md` — the full motion system: reveal grammars, the
  scroll-scrub hero mechanic, pinned sections, Lenis, count-ups, marquees.
- `references/craft.md` — typography, color/theme discipline, texture, spacing,
  and the restraint rules that separate "$10k" from "templated."
- `references/gotchas.md` — the environment/stack traps (frozen preview, Vite-6
  pin, lucide brand icons, Tailwind v4) + the real-browser verification harness.
- `assets/theme.css` — Tailwind v4 theme: tokens, reveal system (4 grammars),
  grain, grid, buttons, fields, range inputs, reduced-motion. The gold; start here.
- `assets/Reveal.tsx` — visible-by-default reveal (IO + safety timer).
- `assets/ScrubHero.tsx` — scroll-scrubbed video hero with poster fallback.
- `assets/useLenis.ts` — visibility-guarded Lenis momentum smooth-scroll.
