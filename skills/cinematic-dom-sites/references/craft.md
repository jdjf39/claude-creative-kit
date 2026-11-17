# Craft — type, color, texture, restraint

What separates a "$10k" cinematic page from a templated one is discipline in
these four areas. None of it is expensive; all of it is deliberate.

## Typography

A trio, no more:

- **Display** — the character. Clash Display (modern grotesk-display), Anton
  (condensed heavy), Instrument Serif / Marcellus (editorial serif), per the
  brand. Used big, tight tracking (`-0.025em`), `line-height: ~0.98`,
  `text-wrap: balance`.
- **Body** — a clean grotesk: Hanken Grotesk, General Sans, Geist. `1.6`
  line-height, `text-wrap: pretty`, slightly negative tracking.
- **Mono** — data/labels only: Geist Mono, JetBrains Mono. Tabular numerals for
  prices, phone, stats; a small uppercase `kicker` for section eyebrows (used
  sparingly, never one per section).

Fluid scale with `clamp()`; keep a ceiling (~6rem) so the hero headline never
blows out. Define `--text-mega/-h1/-h2/-h3` tokens (see `assets/theme.css`).

## Color

- **Ink surfaces:** cool near-black (`#06080c` → `#161d2a`) or a warm theme
  (espresso/stone) per client. Build 3–4 surface steps, not one flat black.
- **One accent, disciplined.** A single hue (electric sapphire, safety amber,
  burnt orange…) in the CTA, focus rings, small marks. Never two accents.
- **Text tiers with contrast in mind:** a bright `fg`, a dimmer `fg-dim` (~8:1),
  a faint `fg-faint` (~4.8:1, large/secondary only). Keep the resting CTA text at
  WCAG AA — often the solid button needs a slightly darker accent than the token.
- **Hairlines** are translucent light (`rgba(150,170,210,0.12–0.22)`), not solid.

## Texture (so dark never feels cheap)

- **Film grain:** a fixed, low-opacity SVG `feTurbulence` overlay (`opacity ~0.03`,
  `mix-blend-mode: overlay`) so gradients never band.
- **Vignettes / grades:** directional gradients to darken where text sits and
  deepen edges. The hero always has a legibility grade.
- **Faint grid:** a masked grid (`radial-gradient` mask) behind select sections
  for an "instrument panel" feel. Subtle.
- **Rounded, rectangular chrome:** small radii (4px) on buttons/inputs read more
  "engineered/automotive" than big pills; match to brand.

## Restraint (the actual differentiator)

- **One idea per section.** If a section is doing three things, split it.
- **Negative space is the luxury signal.** Let sections breathe; don't fill every
  corner.
- **One motion idea per section**, not five. The reveal enters it; maybe one
  hover accent. That's enough.
- **Honesty reads as premium.** Real photos, real numbers, real reviews or none.
  Invented social proof is the fastest way to look cheap and risk the client.
- **Mobile is native, not shrunk.** Swipe carousels, vertical stacks, a call bar
  — designed for the thumb, not a scaled-down desktop grid.

## Imagery

- Prefer the **client's real photos**; where absent, generate cinematic imagery
  (Higgsfield / Veo / Seedance) that matches the lane, and label it as
  placeholder until approved.
- Full-bleed, `object-cover`, with a grade. Give every `<img>` a real, specific
  `alt` (SEO + a11y).
- Scroll-scrub heroes: a short encoded video (desktop) + a framed poster
  (mobile). For frame sequences, encode with a keyframe-every-frame flag so
  seeking is smooth.
