---
name: software-launch-films
description: Direct and build launch films, promos and ads for SOFTWARE products (SaaS, AI tools, apps) where the product's own UI is the hero, with real contrast and real play, the way the best 2026 launch films do it (Comfy Agent, Treg, One Inbox, Orthogonal Dots, Claude for Workspace, Notion/Motionfly, Citation Outreach). Use this whenever someone wants a launch video, product video, feature film, promo, reel or ad for a software product or app, says "make a video for our SaaS/app/platform", "show the product", "launch film like whatships", "make it feel premium / playful / not plain", or hands over launch-film references, even if they never say "software launch film". Covers picking a film shape that only this product could own, building the UI as live components (not screenshots), cursor and keyboard characters, versus and race beats, light/dark contrast plans, beat-locked timing, sound per action, and the review gates. Prefer it over generic motion or 3D-product skills whenever the thing being sold is software. For Acme (the author's AI sales coaching SaaS) it also carries the brand pack and every taste verdict so far.
---

# Software launch films

A software launch film sells a feeling of "oh, that's smart" about something you cannot hold. The films that win (measured on 20 references, `references/reference-library.md`) all do the same four things:

1. **The product UI is the hero, performing one real case.** Not a device, not an abstract metaphor, not a logo sting stretched to 30 s. A recognisable piece of the app, magnified until it is readable on a phone, doing the clever thing with real-looking data.
2. **It has play.** Something with personality acts inside the UI: cursor characters with name tags (Comfy's YOU vs AGENT), little agent creatures (Orthogonal's dots, One Inbox's ghost), a fight (Treg's VS split and WINNER sash), a physical keycap pressed into the frame (One Inbox). Play is what makes a viewer smile instead of nod.
3. **It has contrast.** Either a dark ground with one loud brand accent (Comfy: purple-black + acid yellow), or light and dark frames alternating on the beat (One Inbox, Notion), or a hard colour flood once (Roma's red). A film that is all mid-tones reads as "plain", which is the most common failure.
4. **It flows.** Seven of the twenty references have **zero hard cuts**: one continuous camera through one UI world, each beat morphing into the next. The ones that cut (Comfy 2.7 cuts/10 s, One Inbox 2.5) cut on motion and on the beat.

Why this skill exists: generic motion skills drift toward abstract graphics, and 3D product skills drift toward selling an object. Both miss the point for software. the author said it directly after a Blender "concept device" film: *"it's just a product video... this needs to be focused on our product, which is our software."*

## The laws

1. **Sell the software, never a stand-in.** No invented hardware, no logo-as-object film, no device mockup shot at an angle. Show the screen content itself, full-frame, as if it were a beautifully directed screen recording. A phone appears only when the product is a phone app, and then face-on and brief.
2. **One case with stakes, followed end to end.** One rep, one call, one lead, one invoice, from trigger to result. A feature tour of four screens is a slide deck. The case is the film's spine; features are the moments of that case.
3. **One play device.** Pick one character system and keep it: cursor name-tags, an agent creature, a versus opponent, a pressed key. It appears in most beats and pays off at the end. Two devices fight; zero is plain.
4. **One accent with one meaning, and a contrast plan.** Decide on paper which beats are dark and which are light (or which single beat floods), and what the accent means ("coached", "the AI acting", "won"). The accent should be loud when it appears.
5. **Continuous by default.** Move the camera through the UI and let objects become the next beat (a row expands into a card, a card flies into a sidebar, a tag becomes the logo). Hard cuts are allowed only on the music's hits and only mid-motion.
6. **Words earn their place.** One short line at a time, 2 to 6 words, often with one word in the accent (`Find **buying signals**`, `Answer **in a keystroke**`). No eyebrows, no stacked taglines, no "Unlock / seamless / AI-powered". "Introducing X" is allowed only as the turn into the reveal, once.
7. **Sound per action, music on a grid.** Every visible action that changes state gets its sound (click, key, pop, whoosh, chime); the music's hits set the cuts and the reveal. Never pick music blind for someone whose library and verdicts you have.
8. **Look before you say it's done.** Contact sheets at 4 fps of the whole render, frames described one sentence each, the measured gates below, then fixes. Never certify a render you did not look at.

## Workflow

### 0. References (10 min)
If the user gave references, pull and sheet them: `python3 scripts/refsheet.py <whatships-slug-or-url-or-file> ...` writes the video, a timestamped contact sheet and cut statistics. Read every sheet and write down, per reference, the one move worth stealing (see `references/reference-library.md` for the twenty already analysed). If the user gave none, pick 3 from the library that fit the product's personality and say which.

### 1. Brief and inventory (`BRIEF.md`)
- **PAGE**: Problem, Audience, Goal, Emotion, in four lines.
- **Product inventory**: the product's own objects (rows, cards, calls, scores, files), its core verb, its success moment, its logo shape, its accent colour and meaning.
- **Format**: 16:9 master at 1920x1080, **60 fps** (UI and text strobe at 30), 20 to 45 s. Plan the 9:16 as its own layout, never a crop.
- **Taste contract**: copy the laws above and the user's own bans into the brief.

### 2. Concept: choose a film shape (`TREATMENT.md`)
Write three concepts from three different shapes in `references/film-shapes.md` (Collaborators, Overnight, Versus, Keystroke, One Continuous World, Missed-Opportunity Cascade, Storybook World, Before/After Split, Notification Storm). For each: the logline (≤ 15 words), the case, the play device, the contrast plan, the hero moment. Kill any concept a competitor could run unchanged (cover-the-logo test). Pick one and say why in one line. If the user has a stated favourite style, at least one concept must be in it.

### 3. Beat sheet on the music grid
- Pick the track first (the user's library and verdicts). Measure BPM, bar length, drop, breaks, ending: `python3 scripts/music_grid.py <track>`.
- Map beats onto bars: hook (problem felt by 1 s, product chrome on screen by 25% of the runtime), turn, 2 to 4 proof beats of the one case, payoff (the loudest moment, 50 to 75% in), resolve and lockup (≤ 2.5 s, quieter than the payoff).
- Columns: bar | time | picture | play device | copy | sound | contrast (L/D) | camera.
- Budget: 45 to 60 discrete visible events per 30 s; nothing static longer than 1.5 s except one designed breath before the payoff.

### 4. Design system and UI kit
- Tokens: ground(s), ink, 2 to 4 neutrals, the accent, a danger colour only if the story needs a "bad" state. Inter (or the brand face) at 2 weights, tabular numbers.
- Build the product's surfaces as **live DOM components fed by one data module** (names, scores, times that agree with each other). Screenshots are allowed only as soft background texture. See `references/techniques.md` §UI kit for the surfaces every SaaS film needs (sidebar, list rows, score pills, cards, prompt box, toast, chart).
- Render 3 style frames (the hook, the hero moment, the lockup) and look at them before animating.

### 5. Build (HyperFrames + GSAP, seek-safe)
Use `references/pipeline.md`: one 1920x1080 stage, a camera group (one transform for pan/zoom), the UI kit inside it, the play device on its own top layer, kinetic lines in their own layer. Every value is a function of time; no CSS transitions, no `Math.random`. Build the hero moment first, render stills, then the rest. Techniques with timings: `references/techniques.md`.

### 6. Sound
Music from the grid, SFX per action from the kit, the user's approved hit or logo recipe if there is one. Balance stems before the master (music −16.5 LUFS with VO, −16 without; SFX −23; hits −15; master −14 LUFS, true peak ≤ −1 dBTP). `scripts/mix_template.py` is a working starting point.

### 7. Render and review
Render at 60 fps. Make the 4 fps motion sheet (`python3 scripts/refsheet.py --motion out/film.mp4`). Describe every frame in one sentence. Check the gates:

| Gate | Pass |
|---|---|
| Product | product chrome readable by 25% of runtime; the case followed to its result |
| Readable | story text ≥ 4% of frame height after camera scale (≥ 44 px at 1080p); UI fills 40 to 90% of the frame in proof beats |
| Contrast | at thumbnail size, every 2 s window shows either a dark/light split or the accent; no stretch of mid-grey-on-mid-grey |
| Play | the play device appears in ≥ 60% of beats and pays off at the end |
| Flow | cuts ≤ 3 per 10 s, all on motion; no frame static > 1.5 s outside the one breath |
| End | lockup ≤ 2.5 s, one line under the name (what it is or the URL) |
| Sound | every state change that is sounded once is sounded every time; music hit on the payoff; nothing louder than the payoff |

Fix in this order: untrue or unreadable, the idea, the joins between beats, hierarchy, timing, finish, sound. Two passes minimum.

### 8. Deliver
The 16:9 master, the 9:16 re-layout, a poster frame, and a short `README.md` (the idea, the play device, the grid, how to re-render). Copy the master to the Desktop for the user and send it.

## Hard bans (from the references, cinetic, motionmaxxing and this user's verdicts)
- **Hardware or object stand-ins** for a software product; angled laptop or phone mockups.
- **Mid-tone everything**: pale grey UI on pale ground with no accent moment. Plain = failed.
- **Generic AI imagery**: sparkles for "AI", orbs, neural nets, glowing brains, particle clouds standing in for the product, code rain.
- **Page chrome**: corner labels, scene counters, timecodes, progress bars, eyebrows above headlines, "headline left, card right" layouts.
- **Fake proof**: invented customer logos, invented stats presented as real (demo data inside the UI is fine and must be declared to the user as demo data).
- **Slogan copy**: triplets of one-word sentences, "Not just X. It's Y.", "the future of", "Unlock".
- **Default house style**: a dot that becomes the logo, a circle-wipe between every beat, a giant cropped word, a caret-typed headline (typing belongs in the product's own input).
- The author's own dislikes, a sane default: cinematic trailer music, cheesy or kiddy tracks, "AI-generated looking" 3D, device mockups, plain light films.

## Files
| File | Read it when |
|---|---|
| `references/reference-library.md` | step 0: the 20 analysed films, what each one teaches, with timestamps and local paths |
| `references/film-shapes.md` | step 2: the nine film shapes with skeleton beat sheets |
| `references/techniques.md` | steps 4 and 5: the UI kit and every move with frame timings (cursor characters, keycaps, versus, winner sash, highlighter, statement lines, magnify-and-snap, window cascade, counters, typing, light/dark beats, endings) |
| `references/pipeline.md` | step 5: HyperFrames project layout, camera rig, seek-safe patterns, render and QA commands |
| `scripts/refsheet.py` | download a whatships film or any video, contact sheet, cut stats, motion sheet of your own render |
| `scripts/music_grid.py` | BPM, bar grid, drop and strong hits of a track |
| `scripts/mix_template.py` | music + SFX + logo-drop mix to −14 LUFS, muxed onto a render |

Related skills you can pull from without changing this workflow: `cinetic` (timing grid, motion tokens, forensics scripts), `motionmaxxing` (judgment, look.py and lint.mjs gates), `hyperframes` (the render engine), `media-use` (SFX and music sourcing).
