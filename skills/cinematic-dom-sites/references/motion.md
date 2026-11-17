# Motion system

Motion here is choreography — it guides the eye through a long scroll, never
"look, an animation." Everything obeys the visible-by-default doctrine
(`gotchas.md`) so it survives the frozen preview and headless renders.

## The reveal system (the backbone)

Entrance reveals that are **visible by default**, driven by IntersectionObserver
+ a setTimeout safety net (both fire in hidden tabs, unlike rAF). The element's
resting state is *shown*; the entrance is enhancement. Use `assets/Reveal.tsx`
and the CSS in `assets/theme.css`.

**Vary the grammar** so the page doesn't enter every block the same way — the
uniform fade-up is the "templated" tell. Four grammars ship in `theme.css`:

- `.reveal` (fade) — opacity + translateY, the default workhorse.
- `.reveal-wipe` — `clip-path: inset(0 100% 0 0)` → `inset(0)`, a left→right wipe.
- `.reveal-rise` — opacity + slight `translateY + scale`, for cards.
- `.line-mask` — headline lines slide up from behind an `overflow:hidden` mask
  (`translateY(110%)` → `0`), staggered per line. The signature headline move.

Stagger with `--reveal-delay`; tune distance/blur with `--reveal-y`/`--reveal-blur`.
Reduced motion → everything shown, no transitions.

## The scroll-scrubbed hero

The hero video is scrubbed by scroll instead of autoplaying — the vehicle rolls
forward, the product turns, as the user scrolls. Mechanic (see `assets/ScrubHero.tsx`):

- A tall track (`h-[230vh]`) with a `sticky top-0 h-screen` stage inside.
- On scroll, compute progress `p = clamp(-track.top / (track.height - innerH), 0, 1)`
  from `getBoundingClientRect`, and set `video.currentTime = p * duration`.
- Prime the video (`play()` then immediately `pause()`) on `loadeddata` so
  Safari will seek. Fade the hero content out past ~66% progress.
- **Desktop + fine-pointer only.** Mobile and reduced-motion get a perfectly
  framed static poster — no video download, instant load. Detect with
  `matchMedia('(min-width: 1024px)')` and re-evaluate on resize.
- For frame-sequence heroes (image frames instead of video) the same rect-based
  progress drives which frame to draw — heavier, but crisper and seekable.

## Pinned scroll sections

A sticky stage whose inner state advances with scroll. `h-[Nvh]` track +
`sticky top-0 h-screen` stage; read progress from the track's rect and map it to
inner transforms (a card stack via CSS `--p` vars, a step counter, a horizontal
pan). Rect-based progress is correct the instant the tab is live; rAF is not.

## Lenis momentum smooth-scroll

`assets/useLenis.ts` adds trackpad/wheel momentum. Critically, Lenis runs from a
rAF loop that's paused in hidden tabs — there it would swallow wheel events and
freeze the page. So run Lenis only while `document` is visible and **destroy it
when hidden** (restoring native scroll). It also intercepts `a[href^="#"]` for
smooth anchor scrolling through whichever scroller is active.

## Framer-motion (Motion)

Use `motion/react` for finer interactions — hover states, layout transitions,
modal enter/exit, drag on the before/after slider. Keep it off the critical
"is this section visible at all" path (that's the CSS reveal system's job, so a
paused rАF never hides content). **Pin Vite 6** — Motion breaks on Vite 8.

## Count-ups & marquees

- **Count-up:** animate toward the target when revealed, but render the final
  value as the default so a paused render shows the real number, never `0`.
- **Marquee:** duplicate the row and translate `-50%` on a linear CSS keyframe;
  edge-fade with gradient masks. Pure CSS — runs even where JS motion doesn't.
