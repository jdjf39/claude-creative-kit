# Builder brief template

Copy this to `<project>/BRIEF_ADS.md` and fill in the {BRACES}. Each builder agent reads it first. Then give each
builder its own prompt: the ad name, both file names, the length, **L** (the logo time), the music landmarks (drop
time), and the concept's beats with rough times. See the three example prompts at the bottom.

---
# {BRAND} social ads: brief for ad builders

{BRAND} ({domain}) is {one-paragraph description of what the product does, in plain words}.

We're making short social ads. They are faceless motion graphics with music and SFX and no voiceover. Each ad has its
OWN look. Every ad is built TWICE: vertical 1080x1920 (Reels/TikTok) and horizontal 1920x1080 (LinkedIn/YouTube). Each
format is **designed for itself, not cropped or scaled**: re-lay-out the elements, and make the type big enough to read on a phone in both.

## Setup
- HyperFrames project: `{project}/ui`, with Inter at `assets/inter.woff2`. Write `<ad>_v.html` and `<ad>_h.html`, sharing one
  script `<ad>.js` (plus `<ad>.css`) that reads `window.AD = {w, h}` and lays out each format for itself.
- **Give each file its own prefix** (`storm.js`, `split.js`, ...). Never write a shared helper file that another builder may
  also write; parallel builders overwrote each other's `cardkit.js` once.
- Render with:
  `cd {project}/ui && npx -y hyperframes@latest render -c <file>.html -o ../out/<file>.mp4 --quality high --quiet .`
  Check frames with ffmpeg (`select=...,tile`), Read the jpg, and iterate until it looks like a real, polished ad.
- HyperFrames rules:
  - One paused GSAP timeline on `window.__timelines["<id>"]`.
  - Deterministic only: no Math.random and no Date.now. Seeded functions are fine.
  - The root needs data-composition-id, data-start="0", data-duration, data-width, data-height and data-fps="30".
  - Timed elements get class="clip" plus data-start/data-duration.
  - GSAP from `https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js`.
- `hyperframes lint/check` wants an `index.html`. To check a single file, copy it into a temp folder as index.html.
- Examples of finished ads in this style: `~/.claude/skills/social-ads/assets/examples/` (storm, split, live).

## Brand
- Colours: {list, with a role for each colour: fills, text, trouble, success}.
- Font: {font}. Be bold with weight (800 for headlines) and tight tracking on big type.
- Logo: {SVG path or file}. Wordmark: {how it is set}.
- **Every ad ends on the same end card**, laid out for its format:
  - The logo mark in a {brand colour} tile pops in with overshoot at time **L** (given per ad). L is when the music's hit lands, so be exact.
  - The wordmark wipes in 0.35 s later.
  - The tagline "{tagline}" comes 0.3 s after that.
  - A pill "{domain}" comes 0.25 s after that.
  - It holds until the end.
- **Copy rules:** {client rules, e.g. no dashes: no em dash, no en dash, no hyphen used as a dash; use a period, comma or middle dot}.
- **Do not invent facts or claims.** No customer logos, no user counts, no ROI or percentage claims, no testimonials.
  Allowed demo facts: {the demo scenario and its numbers}.
- **No real brands.** No Apple, iOS, Slack or Salesforce names, logos or exact UI. Use generic stand-ins (a generic phone, a made-up "Pipeline" CRM).
  Made-up company names must sound invented; flag them in the report.
- Motion: After Effects snappy. Fast moves that settle, overshoot on pops, staggered cascades, never floaty.
  Every ping, pop, tap and keystroke needs a clear visual moment so it can carry a sound.

## Report back
For each file:
- The path and its duration.
- A timeline table in seconds.
- An **SFX cue list** table: time and kind of sound (notification ping, buzz, pop, tap, typing span, whoosh, alert, success chime, stamp/thud, glitch).
- Any copy you invented, so I can flag it to the client.

The music and the SFX mix are added afterwards; deliver silent MP4s.
---

## Example builder prompts (the ones that produced the shipped ads)

**storm** (22.5 s, L = 19.75, groove drop at 5.64): "Concept: a {role}'s phone gets flooded with bad news, then one {BRAND}
notification fixes it. The phone is generic: dark lock screen, soft gradient wallpaper, clock 8:12, no brand marks. The world
around it is bold: in 16:9, the phone on one side and big type on the other; in 9:16, the type above and the phone large.
Beats:
- 0 to 1.2: calm.
- 1.2 to 5.6: {bad-news app} notifications pile in and accelerate. Badge count rises, the phone buzzes, big side text in time: 'Another … lost.' / 'And another.' / 'Why?'.
- 5.64 to 9.0: on the groove drop it becomes a torrent. The stack overflows and goes red: 'You can't {do the impossible thing}.'
- About 9.2: a hard stop; one swipe clears everything.
- About 10.0: one {brand colour} {BRAND} notification with the specific insight. Side text '{BRAND} can.'
- About 11.5: tap. It expands into the product view showing the fix.
- About 15.5: tap the action button, which becomes a success state.
- About 17.5 to 19.5: the side line, then the phone flies into the end card at L."

**split** (22.5 s, L = 19.75, drop 5.64): "'Same {trigger}. Two {people}.' A clean editorial look: cream, thin ink rules, big confident type, magazine
feel. Left/right in 16:9, top/bottom in 9:16. Labels 'WITHOUT {BRAND}' (grey) and 'WITH {BRAND}' (brand chip).
Beats:
- 0 to 1.8: the title lands.
- About 2.0: the same trigger line types into both panels.
- Without side: it fumbles, then a red stamp 'DEAL LOST' at about 8.6.
- With side: the product's suggestion card pops at about 4.6, the person uses it, then a green stamp '{good outcome}' at about 10.0.
- About 11 to 15: the loser panel desaturates away; 'The difference was one line.'
- About 15.5 to 19.3: 3 feature chips cascade, then the end card at L."

**live** (19.8 s, L = 16.93, drop 2.82): "'Watch {BRAND} {do its job} live.' Deep ink, subtle grid and grain, the brand colour glowing
as the only accent: a live instrument panel.
Elements: a LIVE header with a ticking clock, a reactive waveform, a scrolling transcript with speaker labels, and product
suggestion cards with a small timer counting to '{latency label}'.
Beats:
- 3 exchanges. In each, the other side says something, the product card lands, and the user visibly follows it.
- Then a success chip at about 11.3.
- About 13.2 to 16.5: pull back and dim, then 3 hard-cut kinetic phrases about 1 s apart on the beat.
- End card at L."
