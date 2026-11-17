# Reference library (analysed 2026-10-09)

Twenty launch films, each sheeted at 1.5 s and measured for cuts. The full whatships catalogue (120 films with titles, views, video URLs) is in `~/videos/launch-refs/catalog.json`; `scripts/refsheet.py <slug>` pulls any of them.

Cut statistics (hard cuts detected at scene > 0.32):

| Film | Length | Cuts | Median shot | Cuts / 10 s |
|---|---|---|---|---|
| Claude for Google Workspace | 60 s | 0 | continuous | 0 |
| Gemini Skills (1:1) | 47 s | 0 | continuous | 0 |
| Citation Outreach | 58 s | 0 | continuous | 0 |
| Treg (open-source Clay killer) | 40 s | 0 | continuous | 0 |
| Graphical | 39 s | 0 | continuous | 0 |
| Jog | 31 s | 0 | continuous | 0 |
| Poke (Interaction moves to SF) | 14 s | 0 | continuous | 0 |
| Aside (Not a single prompt) | 88 s | 4 | 8.3 s | 0.5 |
| AchX homepage | 45 s | 4 | 7.9 s | 0.9 |
| Devin Dreaming | 34 s | 4 | 3.8 s | 1.2 |
| Notion AI (Motionfly V2) | 66 s | 9 | 4.6 s | 1.4 |
| Orthogonal Dots | 57 s | 10 | 4.1 s | 1.7 |
| Roma | 64 s | 11 | 4.2 s | 1.7 |
| One Inbox | 32 s | 8 | 1.0 s | 2.5 |
| Comfy Agent | 45 s | 12 | 1.9 s | 2.7 |
| KNOB keyboard (Kimi 3) | 19 s | 7 | 1.7 s | 3.8 |
| GPT-6 (live action) | 70 s | 35 | 1.5 s | 5.0 |
| Sudo (hardware) | 24 s | 12 | 1.3 s | 5.0 |
| Cole, last PR at Shopify | 33 s | 21 | 1.0 s | 6.4 |
| Figma Made-in-Figma reel | 38 s | 49 | 0.5 s | 12.8 |

Reading: UI-led software films flow (0 to 1.7 cuts / 10 s). High cut rates belong to live action, hardware and showreels.

---

## The software films (steal these)

### Comfy Agent (45 s, dark) — THE closest match for a lime-on-dark brand
- Ground: purple-black canvas with a faint dot grid. Accent: acid yellow-lime (`#E4F542`-ish) on the logo, the AGENT tag and the send button. A pale lavender for the YOU tag.
- **Play device: two cursor characters with name-tag pills.** "YOU" (lavender pill, tilted ~8°, bold condensed caps) and "AGENT" (lime pill with the logo glyph). They move independently across the same node canvas; the agent's cursor wires nodes, the user's cursor drops an image. 3.4 s, 5.6 s, 19.2 s, 26 s.
- Prompt box: big dark rounded card, text typed at reading speed, lime square send button with an arrow (3.4 s, 13.6 s, 20.3 s).
- Statement interludes on a cream full frame in small caps ("IT MASTERS MODELS AND WORKFLOWS", 7.9 s): contrast flips light for ~1.5 s.
- Product proof: nodes with coloured ports connect with curved wires; a red node flashes when the agent edits it (26 s).
- Payoff: huge white bold words "PLAN / BUILD / RUN" over the generated footage (35 s), then "LOCAL AND CLOUD" in lime pills over footage.
- End: lime wordmark on purple-black with a small "NOW ON" pill above (40.7 s).

### Treg (40 s, light mint) — versus and proof-per-line
- Opens "Introducing Open-source **Clay killer**" with the competitor's logo inline in the line.
- **Versus split** (3–5 s): diagonal split screen, pink left / mint right, a lightning-bolt seam, two 3D app-icon tiles, a big pixel "VS", names and prices under each.
- **Bar race with a WINNER sash** (7–8 s, 10–11 s, 14 s): a table of competitors with bars and prices; the winning row lifts, gets a green outline, a slanted "WINNER" sash and a confetti-burst of small strokes.
- **Feature line + live proof**: "Find **buying signals**" (accent words green) over three real-looking social posts with phrases highlighted in yellow marker (17–19 s). "Find & verify **mobile numbers**" over a contact card with a green check.
- Ends with a CLI install line typed in a terminal bar under the wordmark.

### One Inbox (32 s, light and dark alternating)
- Opens on three hyper-real images (agate, earth, forest) with competitor logos, then a white grid where agent nodes connect.
- **Keystroke device**: a single physical keycap ("1", "K", "space", "⌥") on the left, the UI answering on the right, "Answer **in a keystroke.**" (8.7–12.6 s).
- A little ghost mascot pops in as the product's face (7.1–7.9 s, 24.5 s).
- Light frames for statements, dark UI panels for the product, alternating every 1 to 3 s. Ends on a nature photo with the logo and one line.

### Orthogonal Dots (57 s) — the overnight story
- Coloured blob characters ("dots") are the agents; they float on white at the start and end.
- Live-action founder at night types one request, falls asleep; the dots work: search, jobs, verify (blurred list slots spinning like a slot machine at 14–16 s), cards fan out in 3D perspective, tables fill.
- Morning: "Your pipeline is ready." He smiles. Shape: request → sleep → work montage → wake to result.

### Citation Outreach (58 s, light, continuous)
- Typed question in a search bar, cursor clicks send, answer list builds.
- **Window cascade with tags**: browser windows pop in staggered with yellow "Competitor Mentioned!" tags, then a red rounded "Opportunity Missed!" pill lands in the middle (20–24 s). The problem made visible in the product's own vocabulary.
- Serif title card "Introducing Citation Outreach" with a small pill above (26 s).
- A hub-and-spoke diagram where counters tick (39–43 s); ends by replaying the opening query with the brand now in the answer (the callback).

### Claude for Google Workspace (60 s, light, continuous)
- Pure product: Docs, Sheets and Slides with the Claude sidebar. Huge magnification of the Extensions menu and the cursor click (6–9 s).
- Prompt typed in the sidebar, "Working on it", the document restyles itself, a sheet builds a chart, a deck builds. Statement "Claude wherever you work" then logo.
- Lesson: when the product is good-looking, a continuous magnified walkthrough with one sentence is enough. It is calm, not playful; play has to be added for a brand like Acme.

### Notion AI (Motionfly V2, 66 s)
- Alternates light statement frames and dark UI frames. Kinetic lines with one word in colour ("in one **workspace.**").
- Typed prompt with an emoji face searching ("Searching your workspace..."), result card writes out.
- Small coloured agent tags ("Release notes", "Bug triage") float around cards (36 s). Ends with a dot-network circle and the logo.

### Gemini Skills (47 s, 1:1)
- Big soft blue glow behind the prompt box, enormous cursor hand clicking (5.9 s, 22.6 s, 40 s), "Less prompting, more doing", a skill chip in the prompt. Shows how big a cursor can be.

### Devin Dreaming (34 s)
- Grey and white, file list `memory/` animating: indexed, deduplicated, categorised, linked (tree lines draw), "new knowledge emerges" with a black highlight row. Calm, typographic, every state change named by one word in the caption.

### Graphical (39 s), Jog (31 s), Roma (64 s)
- Graphical: a grid of UI component tiles, a dark inspector panel edits a toggle live, then "Available Today" in an orbit of icons. Light.
- Jog: a painterly illustrated world with animal mascots for agents; CI as a road; "Change one line." on an easel. Shows that a storybook world can carry a dev tool.
- Roma: founder to camera, a black panel beside him with abstract squares (tasks) swarming, a grid where red spreads, then a phone UI; ends on a full red flood with the wordmark.

## the author's own references (2026-10-09)
- **KNOB keyboard (his favourite)**: hyper-real Blender hardware film. Lessons kept: macro detail, light that tells time, a product with a screen. Lesson rejected for software: building a fake device. Use its craft, not its subject.
- **Cole, last PR at Shopify**: white, cursor-driven micro-interactions of a chat product, mascot head, "Old / New" comparison, 6.4 cuts / 10 s.
- **Aside (Not a single prompt)**: dark/light alternating kinetic type with real UI, "Connect App +" stacks, a benchmark bar race (55 s), "is 🔒 private" inline icons.
- **Figma reel**: tweets + 3D renders cut at 0.5 s; a showreel, not a launch film.
- **Poke**: an iMessage chat between people and the product, bubbles typed in real time, white, ends on a logo. Proof that a conversation can be the whole film.
- **AchX homepage**: light airy blue glass cards with kinetic text; the author's least relevant pick.

## Earlier Acme references (still valid signals)
- **BlackBox.ai launch ad**: the one he called "fire". Navy, whisper VO, fast cuts on the music's pulses, inverted B&W footage with red tracking boxes, dot particles to logo.
- **Codex promo**: VO-led dark UI reel, his preferred reel style before October.
- **Opal / Cursor / fintech card / youmotion / Navan**: chrome pills, warm glows, glass cards; became "The Object" (AE + Blender) which was the better of the October films.

### youmotion "Let's begin" (the author's 7th ref, 2026-10-09)
9:16, 37 s, 1.1 cuts / 10 s. Pure black. Thin white lines with dot nodes draw the transitions; soft blue and cyan light discs and blobs; small, thin, lowercase-feeling type ("With a system", "Finding form", "Focus organizes motion", "Thought in motion"); one idea per scene with huge negative space. Dots on a baseline grow into stems with glowing heads (13 s), which is the "focus" chart move. There is a white section with black pills joined by thin lines. Ends on a blurred light that resolves into the logo. He: "really faint... minimalistic and beautiful... pretty cinematic, people liked it" (he doesn't like its style as such). Used for YOU × ACME v4 "minimal": black statement frames, a lime hairline curtain, a lime ring collapsing into a dot, thin type, the stem chart.

## the author's 2026-10-10 set (ranked by him): what made them "have effect, depth, a storyline, people resonate"
- **Kinso by Roshan Studio** (his favourite).
  - Hook: "Your next deal / is in **here** / somewhere." The camera dives into a giant, out-of-focus "here"; a white capsule of app icons with red badges slides up through the gap between the letters; it pans down to "some|where"; the capsule tips and falls; then a "W•ah" chip.
  - Dark beat: "You are a really **busy person**" with a highlight bar and a bouncing orb ball, then a full-width banner "Lets solve this first".
  - Then: the logo draws itself; "One inbox / for every conversation" as a giant fly-through with a glass sheen; UI cards on a peach/mint gradient with Kinso word stacks beside them ("It learns / that / matters / to / you") and small markers; an orb; a notification card in front of the orb; a dark grid with a typed input that expands into a card with corner handles; "Join 27,300 others" counter; "on the waitlist." drifting; a swirl iris into the orb and the logo.
- **Shazam by Sema Graphics** (second; b7f1959188f24be58ccf6fd09c0e1e2e.mp4).
  - Dark navy with blue light leaks. Problem copy: "A song you love / A name you don't know" → "Find it in seconds" → "Just Shazam it!".
  - Product: a phone, then a match-cut zoom into the app icon (it becomes a full-bleed brand-colour frame), "What's that song?", "Tap To Shazam" with a cursor and a pulsing button, waveform pill, result card.
  - Close: a rotating keyword ("Find your song instantly / effortlessly / like magic"), 2x2 lifestyle tiles, the logo out of an orb.
- **Koral Arya reel** (e8aca566508a48f7a21788b829b91359.mp4, 16:9).
  - A typed prompt box with four selection-handle squares and a cursor clicking send (the button changes colour).
  - Warm cream frames with an accent colour sweeping through a word ("I turn **ideas**"), thin grid guides, a dark close "Let's Make Things Move" over a glowing horizon.
- **Upwork by Visually Animations** (least favourite): photoreal 3D device renders. That points the same way as his ban on device mockups.
- **What they share:**
  - The problem is said in a few plain words first.
  - Empathy, then "let's solve this".
  - The product is shown one big element at a time, with a short word stack beside it.
  - Brand-colour light frames alternate with dark ones.
  - Giant type has shallow focus and objects pass through it.
  - An orb carries the cuts.
  - A proof counter and a CTA come before the logo.
  - None of them use a separate photoreal 3D style; the Blender wave in v8 "doesn't fit at all" for exactly this reason.

## the author's 2026-10-12 effects set (9 Instagram reels; #6 is his favourite)
- **#6 JustPaid by Halmarr** (r6_Db28edFqHTP, filmed off a big screen; his favourite). Iridescent pink/peach/lavender field, with everything in it as frosted glass:
  - Opens on a storm of speech-bubble notifications ("New Voicemail: Doug, we need your attention…") with amber "!" badges, drifting at different depths with focus blur.
  - The logo types in letter by letter. Layered glass cards follow: a sharp front card with an illustrated avatar over blurred cards behind.
  - A pill label with icons and avatars riding a thin orbit loop around it, tapped by a hand cursor.
  - "Sends personalized payment **reminders.**" over UI; whip-pan motion blur; a rolling odometer ($435k → $571k); a bar chart growing; a check mark drawn on screen.
  - A phone rising from an arc of connected icons, and an end collage of many glass cards at different depths.
- **#8 Placed by Halmarr** (r8): light blue. A cute blob mascot, orbit rings with icons around the logo, stat tiles whose digits roll (39% → 68%), "Build your [icon] path" with an icon inline in the sentence that the camera zooms through, a progress bar ending in "Done" with a particle burst, and quiz cards fanning out in 3D.
- **#2 OWNTABLE by Jimmy** (r2): dark navy with green/teal aurora horizons. Glowing big percentages (6% red, 30%, 23% green) among floating glass cards; "Read that again [!]"; neon connector tubes; a phone-call card glowing green; accent words in sentences.
- **#3 / #7 EXTProduction** (16:9; r3, r7, the latter with a lime palette). Glow-heavy dark scenes:
  - Chat bubbles fly past the camera, blurred.
  - A prompt types a slash command highlighted in colour ("/use-After-Effects").
  - A hand cursor clicks a send button.
  - A glowing lime progress ring "04 MIN", a big glowing timer, letter-scramble titles, and photo backdrops with UI overlays.
- **#1 CreditKarma redesign** (r1): fast cuts between extreme close-ups of the UI on angled phones and monitors, with heavy depth of field and whip blur.
- **#5 Google Drive concept by Sumama** (r5):
  - The UI card tilts in 3D; a cursor clicks; the camera zooms through a folder into the next beat.
  - A progress bar fills the frame, then a check mark appears.
  - The sound design was shown on screen too.
- **#4** is a phone-mockup tool (least relevant). **#9** is a Raylight promo (glowing type over a horizon, template marketplace).
- **The toolkit he means by "the type of effects we want":**
  - frosted-glass cards in real depth with focus blur;
  - objects flying past the camera;
  - glowing big numbers and neon lines;
  - aurora horizons;
  - a hand cursor clicking;
  - rolling odometers;
  - icons on orbit loops;
  - zooming through an element into the next scene;
  - whip pans;
  - a success burst;
  - a closing collage of the product's cards.
