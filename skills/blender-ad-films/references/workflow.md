# Workflow (as run on the Gemini recreation, then reused for Acme)

## 1. Reference breakdown
- Crop letterboxing if the ad sits inside a vertical reel (e.g. `crop=720:405:0:437`), and note the
  ad's start offset in the file.
- `ffmpeg -ss <start> -t <dur> -i SRC -vf "crop=…,fps=4" ref/f%03d.jpg` → fNNN = t (NNN−1)/4.
- 4 fps contact sheets for the whole ad, then 6–8 fps sheets per shot. Pull a full-res frame for each hero shot.
- Audio: tempo (onset autocorrelation), per-second RMS, transient list. Dense transients = SFX/editing
  density to match; big RMS steps = where the music builds and drops.
- Output a shot table: shot, ref in/out, what happens, camera move, key props, sounds.

## 2. Make it your own (brand version)
Keep the reference's STRUCTURE and grammar and swap the content one-for-one:
toy workspace → UI erupts from the device → hero brand object rises → prompt types → answer arrives as a
physical artifact (scroll/paper) with ribbons behind → cascade/domino of items → glass app window where
layers stack and unfold into the result → pull back to the workspace → logo end card.

## 3. Look frame first
One still of the hero shot, compared with the reference side by side, until light, colour, material
and scale match. Most problems show up here (washed colours, grey glass, flat light band, wrong scale).

## 4. Shots
- Timing: frame f ↔ ref t = shot_in + (f−1)/24. Builders record the real cut-in and cut-out frames
  (handles at both ends are fine; edit.py takes a first frame and a count).
- Iterate with `STILL=a,b,c` renders at 50 %, compare with ref frames at the same t, and fix. At least 3 rounds.
- Then the full `PREVIEW=1 SAMPLES=12` animation.

## 5. Parallel builders
- Fill `BRIEF_AGENTS_template.md` (project paths, reference file + offset, rules) and dispatch one
  general-purpose sub-agent per shot with: the shot window, a detailed description of what happens in
  the reference, the texture prefix and the script name. Max 4 at once.
- Builders stop on account usage limits. Their scripts and stills stay on disk; finish the previews
  yourself rather than re-spawning them.

## 6. Edit + sound
- `edit.py`: set the EDL to the measured cut points, add `at(shot, frame, sfx, vol)` cues per visible
  action, pick music (references/sound.md), and render the `--preview` cut plus a side-by-side against
  the reference.
- Deliver: the full preview, the side-by-side, and a note of honest weak spots. Then take notes and
  do the final render.

## 7. Final render
`SAMPLES=64..96 ./bl.sh scenes/<shot>.py` per shot (retry loop), then `python3 edit.py`. Keep the Mac
awake (`caffeinate -dimsu -t 28800 &`). Budget: ~630 frames at 1080p takes several hours.
