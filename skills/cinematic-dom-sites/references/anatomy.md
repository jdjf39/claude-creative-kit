# Anatomy — sections & signature components

The section catalog for a cinematic one-pager and the reusable components that
recur across builds. Pick sections by the business; not every site needs all.

## Section flow (top → bottom)

1. **Nav** — thin, fixed, backdrop-blurred, transparent over the hero then a
   faint ink fill on scroll. Logo (inline SVG mark) + a few anchors + one solid
   CTA + phone. Collapses to a sheet/hamburger on mobile.
2. **Hero** — the emotional peak. Default: a **scroll-scrubbed video** on
   desktop (the truck rolls forward as you scroll), a static poster on
   mobile/reduced-motion. Left-darkened grade for text legibility; kicker +
   masked-line headline + sub + CTAs + phone. See `motion.md` for the scrub
   mechanic; template `assets/ScrubHero.tsx`.
3. **Marquee** — an infinite horizontal strip of value props / categories,
   edge-faded. Cheap motion that signals liveliness between big beats.
4. **Showcase / experience** — often a **pinned scroll section**: a sticky frame
   whose content advances with scroll progress. The "premium" beat.
5. **Inventory / services / menu** — the offer. Cards with real imagery; on
   mobile a **swipe carousel**, not a shrunk grid. Filters where it fits
   (inventory sites).
6. **Detail "band"** — a full-bleed image section with a short editorial block
   over it. Slows the rhythm; shows craft ("inspected down to the details").
7. **Pricing / financing** — honest numbers or an estimator (e.g. a monthly-
   payment calculator). One accent for the active state.
8. **Process / "how it works"** — 3–4 steps. On desktop a pinned stack or
   staggered cards; on mobile a vertical list. Good candidate for animated
   Rive/Lottie icons (compose with live-graphics).
9. **Booking / contact** — a multi-step modal or an inline form. Real DOM
   inputs, real validation. Never fake the submit.
10. **Reputation** — social proof, **honest**. If there are no real reviews, say
    so or omit — never invent stars.
11. **Visit / map** — hours, address, an embedded map (MapLibre) or a stylized
    SVG service-area map. Note: WebGL maps render blank in the frozen preview —
    verify in a real browser.
12. **Footer** — nav recap, socials (inline SVG icons — lucide has none),
    legal, the one accent.
13. **Mobile call bar** — a fixed bottom bar (Call / Book) on phones only. The
    single highest-converting mobile element for local businesses.

## Signature components (templated or described)

- **ScrubHero** (`assets/ScrubHero.tsx`) — tall track + sticky stage; scroll
  scrubs `video.currentTime`; poster fallback for mobile/reduced-motion.
- **Reveal** (`assets/Reveal.tsx`) — visible-by-default entrance, IO + safety
  timer, four grammars (fade/wipe/rise/line-mask).
- **useLenis** (`assets/useLenis.ts`) — momentum smooth-scroll, destroyed when
  the tab is hidden so background renders keep native scroll.
- **Before/after slider** — two stacked images, a draggable divider clipping the
  top one (`clip-path: inset(0 X% 0 0)`); pointer + keyboard. Great for
  roofing/auto/stone "we fixed this."
- **Pinned scroll section** — `h-[Nvh]` track + `sticky top-0 h-screen` stage;
  progress from `getBoundingClientRect` drives inner state (a stack, a wipe, a
  step counter). Progress via rect, not rAF (fires in hidden tabs).
- **Count-up** — animates a number when revealed; visible-by-default (shows the
  final value if not animated). Never gate the value behind rAF.
- **Marquee** — duplicated row, CSS `translateX(-50%)` keyframe, edge gradients.
- **Custom cursor** — a small accent dot/ring that lerps toward the pointer;
  desktop + fine-pointer only, disabled on touch.
- **Business config** (`src/data/business.ts`) — the single source of truth:
  name, tagline, phone/href, address, coords, hours, socials, plus a
  `PLACEHOLDER` flag. Every component reads from it so launch is a one-file edit.
