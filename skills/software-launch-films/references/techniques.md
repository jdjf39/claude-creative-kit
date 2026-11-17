# Techniques (with timings at 60 fps)

Contents: UI kit · cursor characters · keycap press · versus split · race with winner sash · highlighter on proof · statement lines · magnify and snap · window cascade with tags · counters · typing · light/dark beats · floods · transitions that morph · endings.

Values come from the reference sheets (`reference-library.md`) and the measured norms in the `cinetic` and `motionmaxxing` skills. Ease names: `out` = cubic-bezier(.16,1,.3,1) for arrivals; `inOut` = (.87,0,.13,1) for whips and slides; `exit` = (.55,.055,.675,.19) for leaving; `cam` = (.48,.1,0,.9) for camera moves.

## UI kit (build once, as live DOM fed by one data module)
- **Window / panel**: radius 18–28 px, 1 px hairline (8–12% white on dark, `#DCE1DE` on light), no heavy shadow. No browser bar or traffic lights unless the product is a browser.
- **Sidebar**: 64–88 px icon rail or 240 px labelled rail with the product mark at the top; one active item in the accent.
- **List rows**: 56–72 px tall, avatar or icon, name, a metric on the right in tabular numbers, a state chip.
- **Score / state pill**: height 40–56 px, full radius, label + value; states: neutral, accent ("coached"), danger ("at risk").
- **Card**: title, one line of meta, one primary number or sentence; never a "Good morning" generic card.
- **Prompt box**: wide dark rounded card (radius ~20% of its height), placeholder grey, a square accent send button with an arrow.
- **Toast / notification**: 360–480 px wide, app icon, title, one line; slides in from top-right with `out` over 18 f.
- **Chart**: one series, labelled values, an accent marker on the point that matters.
Readable size: anything the viewer must read is ≥ 44 px tall on a 1080 frame after camera scale (4% H). Magnify with the camera (scale the whole group), never by inflating one font.

## Cursor characters (Comfy)
- Arrow: 34–44 px tall at rest, filled in the character's colour with a 2–3 px dark outline on light grounds or a white outline on dark.
- **Name tag**: a pill hung below-right of the tip, 8–12° tilt, bold caps 26–34 px, padding 10/18 px, radius full. Human tag pale (lavender or cream), product tag in the accent with the product glyph before the name.
- Entry: from off-frame at 1.6–2.2x size, 60% of the travel in the first 6 f, then a 20–30 f `out` tail, shrinking to 1.0x. The tag lags the tip by 2–3 f (spring, no overshoot).
- Travel: curved paths (a quadratic through a control point 15–25% off the straight line); heading leans 10–20° into the motion; peak 40–60 px/f.
- Park before acting: 6–12 f still before a click. Click: cursor scales to 0.82 over 4 f and back over 6 f; the target reacts 1–2 f after the cursor's minimum (button squash to 0.94, state change).
- Two characters never move at the same moment; alternate actions every 0.5–1.0 s so each can be followed.

## Keycap press (One Inbox)
- A single keycap 220–300 px square, rounded 18%, top face slightly lighter, legend 64–90 px. Enters from 1.4x with 4 px blur, settles over 16 f.
- Press on the beat: travel down 10 px and scaleY 0.96 over 4 f, up over 8 f. The UI answers on the press-bottom frame.
- One key per beat, never a full keyboard.

## Versus split (Treg)
- Two halves split by a diagonal seam (12–18° off vertical), each half its own tint (danger tint left, accent tint right). The seam is a jagged lightning line drawn on over 6 f with a 2-frame white flash.
- Each side: a 220–280 px app tile (the opponent can be a neutral "manual" icon if naming a competitor is off-limits), a name and one number below.
- "VS" set huge (180–260 px) in a heavy or pixel face, slams in from 2.4x over 8 f with a 1-frame shake (±6 px).
- Hold 1.2–1.8 s, then the seam slides so the product's side takes the whole frame (24 f, `inOut`).

## Race with a winner sash (Treg)
- Rows of competitors (or "Manual / Spreadsheet / Acme"), bars grow with `out` over 30–50 f staggered 4 f, values count with them in tabular numbers.
- The winner row lifts 6 px, gets a 2 px accent outline, and a slanted sash ("WINNER", 8–12° rotation, accent fill, white caps 26–30 px) slaps in from 1.6x over 6 f at the corner.
- Confetti-strokes: 14–24 short 3×14 px strokes in the accent and ink burst from the sash centre, travel 80–200 px with `out` over 24 f, fade over the last 8 f. Only on the win, once per round.

## Highlighter on proof text (Treg)
- Real-looking source text (a post, a transcript line); the key phrase gets a marker swipe left-to-right over 10–14 f, marker colour = accent at 55–70% (or yellow), drawn under the text.
- Swipe on the beat; a soft "swish" sound.

## Statement lines (Notion, Treg, One Inbox)
- 2–6 words, 88–128 px, weight 500–600, tracking −0.03 em, centred or anchored to the lower third. One word or phrase in the accent.
- Reveal by whole words 3–6 f apart, each word rising 24 px with `out` over 14 f and a 6 px blur clearing by 60% of the move. Hold ≥ 36 f + 6 f per word.
- Exit: the line is pushed by the next element, never fades on its own.

## Magnify and snap (Claude, motionmaxxing)
- Push the camera so the acting element fills 55–80% of the frame (2–4x), hold for the action, then snap back: scale ratio 0.6–0.75 in ONE frame, then a 12–18 f `out` tail. The snap reads as a cut with continuity.

## Window cascade with tags (Citation Outreach)
- 4–6 windows pop in staggered 6–9 f, each from 0.9x with `out` over 14 f, overlapping like a desk. Each gets a small yellow tag ("Not reviewed", "Missed objection").
- Then the centre pill: danger fill, white bold 40–52 px, slams in from 1.5x over 8 f ("Deal lost").
- Reverse beat: windows flip their tags to the accent one by one (4 f apart), the pill shrinks into the product's logo or icon.

## Counters
- Values that a viewer must believe tick per frame with tabular numbers and land on a round hero value for claims (2,184 → reads "every call"); un-round for data (23.4%).
- The final lock gets a tick sound; the count itself has none.

## Typing
- In the product's own inputs only. 25–40 chars/s with authored bursts: 1–2 chars per frame, 6–10 f pause after spaces. Caret solid while typing, blinks only in a hold.
- Placeholder grey disappears in one frame before the first character.

## Light / dark beats (One Inbox, Notion, Aside)
- Plan it as a bar pattern, e.g. D D L D D L D D (one light frame every 2 to 3 bars). Light frames carry statements; dark frames carry the product. The switch happens on a beat, mid-motion (a panel slides over, a wipe follows a moving edge), never as a fade through grey.

## Floods (Roma)
- Once per film at most: the accent fills the frame from the acting element outward (an expanding rounded rect over 10–14 f). Best right before the lockup or on the payoff.

## Transitions that morph (keep the film continuous)
- Row → card: the row's rectangle animates its bounds into the card's (FLIP), content cross-dissolves inside over 6 f.
- Card → sidebar item: the card shrinks and flies into its slot along a curve (`inOut`, 24–30 f).
- Tag → logo: the product's name-tag pill grows and morphs into the logo tile.
- Push-through: the camera zooms into a small element until it becomes the next scene's ground.
- Hard cut: only on a music hit, with motion continuing in the same direction on both sides.

## Endings
- Lockup in ≤ 2.5 s: mark + wordmark assemble over 40–60 f, one line under it (what it is, or the URL), a final hold of 0.6–1.4 s, the music resolving.
- Callback endings beat static ones: replay the opening action now with the product's result (Citation Outreach), or let the play device become the mark.

## Smoothness and depth (learned on YOU × ACME v2, from the author's "smooth" references: Opal, Cursor, youmotion, the glass fintech card)
- **Motion blur is the biggest single upgrade, but it needs 16 samples per frame.** Three samples (240 fps blended to 60) leave visible ghost copies on fast moves. Build a time-stretched copy of the composition (`window.__TS = 4`, root duration ×4, no audio; render(t / TS) on seek), render it at 240 fps (= 960 samples a second), then blend 8 of every 16 sub-frames: `tmix=frames=8:weights='1 2 3 4 4 3 2 1',select='eq(mod(n\,16)\,3)',setpts=N/(60*TB)`. Quantize every changing text (counters, typing, timers) to the 60 fps frame time (`tq = round(t*60)/60`, so all sub-frames of output frame k land on k; floor splits them), or blended digits stack into mush. Reference build: `~/videos/acme-you/blur4/` + `finish.sh` (about 10 min for 30 s).
- **3D per panel, never on the camera group.** Give each panel `perspective(1800px) rotateX() rotateY()` in its own transform; text stays sharp at any camera scale (tested). Add a swing: tilt panels a few degrees against the camera's screen velocity (clamp about 8 degrees), so travel feels physical.
- **Depth of field.** `filter: blur()` on the panels the story is not on (about 5 px), sharp on the focus panel.
- **Emissive light, one colour.** The brand accent glows when the AI acts: a soft light pool that follows the AI cursor (`mix-blend-mode: screen`), box-shadow glows on scored pills, a hot gradient bar (white top fading to accent) with a bloom under it, a bloom on the logo hit.
- **Opal moves that read as "premium":** a score pill that branches into rubric pills along a drawn bracket; a 3D floor chart that starts at about 60 degrees of tilt and rotates up to face-on while the hero bar rises and glows; a light sweep across a card; a gradient outline drawing round a pill or button on success.
- **youmotion moves:** lines that draw with a glowing comet head and node dots at both ends; a light orb that blooms from a cursor to flood the frame (clip-path circle) and collapses into the next object.
- **Words blur in** (opacity, rise and `blur(10px → 0)` per word, 70 ms apart), never a plain fade.
- **Chaos to order hook:** dozens of item cards fly at the camera from depth (`translate3d` in a `perspective: 1000px` layer) round a big counter; the last few decelerate and land exactly as the list rows (computed from the camera's world-to-screen), then the list chrome fades in around them.
- **Keep holds alive:** a slow camera drift (a few px and ±0.6% scale in sines) so nothing is ever frozen.
- **Round line caps draw a dot before the line starts.** Hide any dash-animated path until its progress is above zero.

## Realism and restraint (YOU × ACME v3, from the author's note on the v2 he called "fire")
- **Real app chrome on every surface:** a 72 px sidebar (logo tile + stroke icons, one active), an 84 px header (breadcrumb, a status chip, an "Ask <product>" search with a ⌘K kbd, an avatar), uppercase column headers, stage chips, an audio scrubber with markers. Floating cards read as a mockup; chrome reads as the product.
- **The typed prompt is the "AI product" moment:** search click → command palette opens over a dimmed screen (scale 0.965→1, blur 10→0) with suggestion rows → the question typed with jittered keystroke times (one key SFX each; the typing character's tag dips a little per key) → Enter → "Reviewing N items…" with a counter and a thin progress line the AI cursor rides → results blur in, staggered by 90 ms → hover highlight and "Open ↵" → click. Then let the AI write something itself (streamed word by word with a block caret) a beat later.
- **Less bold:** cursor tags at 44 px, weight 700, a 5-degree tilt; 1-1.5 px strokes; half-strength glows; red as outlines, not fills; light frames in cream only (the accent flood was "too bold"); a thin outlined annotation with a leader line instead of a sash and confetti.
- **Cinematic finish:** film grain (seeded noise tiles, one per output frame, overlay at 7%), a vignette that eases off on light frames, a soft-feathered light bloom (mask radial-gradient) instead of a hard circle, depth of field at 8 px with a 25% darkening off-focus.

## Line-tracking transitions (YOU × ACME v5, the author: "tracking along the lines where it flows into the other thing... cinematic, pleasing to the eye")
- **Every transition is a line.** It leaves the element that triggered it (the last scored row, "Open ↵", the dragged moment, the "Assigned ✓" button, the "Next step booked" toast) and lands exactly on the element that comes next (the search field, the score pill, the drill title, the live crumb, Maya's chart dot). The landing element reacts with a glow or a ring.
- **The camera rides the comet.** Sample each SVG path into about 300 points at init. While a line draws (progress k = smootherstep), camera center = source framing → comet → destination framing (blend in over k 0–0.3, out over 0.72–1). Scale = log-lerp from source to destination × (1 − dip·sin πk), with dip 0.08–0.24 so it pulls back mid-flight.
- **The AI character rides the comet head**, so following the line means following the character.
- **Statements live in the void along a line** (thin 76 px text in world space, blurring in as the comet passes) instead of full-frame cards. At the final pull-back the whole route and both statements are visible at once; a light pulse then runs the full path.
- **Draw lines above the panels** (the svg after #world) so they can land on UI elements; route them through empty space and enter panels at empty rows.
- **No hang time:** a click lands within 0.1 s of the cursor arriving; a character with nothing to do fades out in place instead of idling or flying across another screen.

## Concise and phone-landscape (YOU × ACME v6, the author: "looks like a dashboard... more concise, more visually appealing; it's viewed on a phone held sideways")
- **Kill the table.** A list of rows reads as a generic dashboard. Show volume as a **mosaic** instead: a 6×4 wall of call tiles (initials, rep, company, a mini waveform, a score badge). The AI's work becomes a **diagonal wave** crossing the wall that tints each waveform (accent = good, red = bad) and pops its score, with a thin glowing scan line along the wave front.
- **One idea per screen.** Cut every screen to its point: one score with three pills and the two transcript lines that matter; a drill title, the AI's sentence and one button; three live lines and one card. Drop sidebars, column headers and search fields that nobody uses.
- **Type for a phone held sideways:** primary text at or above 50 px on screen and secondary at or above 36 px after camera scale. Tighten framings (view widths 1000–1250 world px) rather than shrinking content.
- **A Spotlight-style prompt:** only the input bar while typing, opening downward as results stream in. Short query (about 19 chars), about 13 chars/s, a 0.4 s scan; under 3 s from click to result.
- **Even line pacing:** use a trapezoidal "glide" easing (accelerate 30%, cruise, decelerate 30%; peak speed 1.43× average) instead of smootherstep (1.88×). Give short hops at least 1.1 s, so every line moves at a similar on-screen speed.

## The wave (YOU × ACME v7, from the KNOB keyboard film: one key punches up with light under it, then a ripple of lifting, glowing keys runs outward and settles; a second warm light wave follows)
- **Ripple through a grid:** delay = distance from the struck element / max distance × wave span (about 1.25 s). Each element lifts (translateY −14 px, scale 1.045) on a sine bump of about 0.5 s, with a light *under* it (`box-shadow: 0 20px 54px accent at 0.34`) and its border tinted. The struck element lifts more (−22 px, 1.07) and gets the click ring. Raise z-index while lifting, and put overlays (palette, dimmer) above it with explicit z-index.
- **Letter wave for type:** split into per-character inline-block spans. Each letter: translateY from 0.55 em with a slight overshoot (back easing), opacity, blur 8 → 0, and an accent text-shadow that peaks mid-rise and fades. Stagger 30–50 ms. A later **light run** (glow bump and a −0.06 em lift per letter, 60 ms apart) gives the logo KNOB's second wave.
- **Bump wave through settled text** (letters lift 0.35 em and glow, then settle) when a line lands in a field, followed by a FLIP **morph** of that field into the next UI (search bar → command palette: left/top/width/height/radius interpolated).
- **Arrivals ride a wave too:** results, pills (centre first, then sides), buttons, cards and toasts rise 18–20 px with blur → 0 and a brief under-glow (`sin(π·u)`).
- **Name timeline keys uniquely.** Two `morph0` entries in one object literal silently kept only the last, which froze the camera for 15 s.

## A real 3D beat inside a DOM film (YOU × ACME v8, the author on v7's CSS tile ripple: "bubbles only jump... genuinely figure out that realistic wave... render it in Blender")
- When a move needs real light and depth (a wave through physical keys or tiles, light spilling from under them), render that one beat in Blender Cycles and drop it into the HyperFrames composition as a `<video>` plate. The cursors, grain and vignette stay on top, so the film still reads as one world. HyperFrames frame-extracts `<video>` exactly; a wrapper div's opacity does the cross-fades.
- **Make the 3D from the DOM itself.** Puppeteer captures each tile's DOM face (unscored and scored, 3x DPR), the header once per plate frame (its counter animates), and `camAt(t)` per plate frame. The slabs wear those faces as emission (Standard view transform, strength 1: the pixels come out exactly the DOM's).
- **Invisible handoffs.**
  - The Blender camera is a perspective camera straight down: world px / 100 = units, distance = (1920/s/100) * lens / 36, at the DOM's cx, cy, s for every frame where the dive weight is 0. A flat plane maps exactly like the DOM.
  - Diff a DOM screenshot against the Blender frame at both ends; aim for mean error under about 4/255.
  - Lights that exist only in the dive (rim) are keyed to the dive weight, so both ends stay pure DOM.
  - Overlays fade before the camera starts to move.
- **A smooth wave, not bouncing tiles:**
  - Height is a travelling swell with a shallow trailing trough and a faint second swell: h = A·[g(x) − 0.32 g(x+1.75σ) + 0.1 g(x+3.5σ)], with x = r − v·t and σ about half a tile.
  - Each tile tilts by −atan(dh/dr) about the axis tangential to the ring, so its top follows the wave's surface.
  - A lime emissive pad under each tile has strength ∝ lift, so the light spills out only as the tile rises.
  - The face flips to its result at the crest.
  - The camera dives low and close (el ~22–34°, ~10 units, 30–34 mm, f/0.3 at this scale), travels with the crest, and rises back as the crest leaves the wall. If the camera is low while nothing moves, that is 3D hang time.
- **Keyframing.** Write per-frame keys with `action.fcurve_ensure_for_datablock(id, path, index)` + `keyframe_points.foreach_set("co", ...)` (fast). Drive per-object shader values via custom props read by an Attribute node (type OBJECT).
- **Blur build.** Slow the plate 4x (`setpts=4*PTS`) and multiply its data-start/duration by 4, and set data-start half a frame early so extraction never lands on a boundary. See `make_blur.py`.

## Lines that write the words (YOU × ACME v8, the author: "do something with the letters where the lines go through... pop out... so it tells a story")
- Put a statement on the line's path: the route is pre-curve + a straight run along the text baseline (+24 px, an underline, never a strike-through) + post-curve. The camera parks on the statement while the comet runs.
- Each letter's moment is when the comet passes under its centre (map the letter x to route progress, invert the easing). At that moment the letter springs up out of the line: scaleY 0 → back-ease overshoot → 1, transform-origin at the baseline, a lime flare that decays (text-shadow + brightness), a little blur at the start, and a damped bob after.
- Slow the comet to ~0.6x along the run (arc-length to time warp) so words arrive at reading pace. Give each letter a soft low-passed key tick.
