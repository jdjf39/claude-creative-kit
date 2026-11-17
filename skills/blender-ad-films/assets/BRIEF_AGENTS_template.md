# Gemini ad recreation — shared brief for shot builders

We are recreating, shot for shot, a Blender + After Effects "fake ad for Google Gemini" (Instagram reel by @nzj.3d)
as a private capability test. Goal: match the reference's look, composition, timing and motion as closely as possible.
It must NOT look generic/"AI": saturated Google colours, strong warm window light with lavender shadows, soft toy-like
materials, depth of field, motion blur, snappy After-Effects-style motion (fast moves that settle, slight overshoot on pops).

## Paths
- Project: `~/videos/<project>`
- Source reel: `/path/to/reference.mp4` (720x1280, the 16:9 ad is letterboxed:
  crop with `crop=720:405:0:437`). The ad starts at **6.5 s** in the file; "ref time t" below = file time − 6.5.
- Pre-extracted reference frames: `ref/fNNN.jpg` at 4 fps from ref t=0 (f001 = t 0.0, f005 = t 1.0, fNNN = t (NNN−1)/4).
  Extract more yourself, e.g. 8 fps sheet:
  `ffmpeg -ss <6.5+t> -t 3 -i SRC -vf "crop=720:405:0:437,fps=8,scale=320:-1,tile=6x4" -frames:v 1 out.jpg`
- Shared Blender helpers: `scenes/base.py` (read it). Useful: `reset()`, `render_settings(w,h)`, `lin(hex)`,
  `mat_principled(name, color, rough, coat, transmission, sss, metallic)`, `mat_image(name, png)` (alpha decal),
  `emissive_image`, `slab(name, w, h, t, corner, edge)` (rounded-rect slab, faces +Z), `ui_panel`, `pill`, `ring`,
  `dimple_ball`, `key(obj, frame, loc=, rot=(deg), scale=, interp=)`, `camera(loc, target, lens, fstop, focus_obj)`,
  `render_shot(shot_name, frames)`.
  `scenes/desk_world.py` has the look grade (`dw.grade(scene)` = AgX Punchy, exposure +0.45), `dw.world_fill(color, strength)`
  (lavender sky fill), Google colours `G_BLUE G_RED G_YEL G_GRN`, and window-light occluder patterns.
  `scenes/sh03_star.py` is a finished example shot: window band via invisible occluder blocks parented to an empty rotated
  like the sun, tile floor, Track-To camera (use this: animate camera location + an aim empty, never raw rotation keys).
- UI textures: render HTML to PNG with headless Chrome:
  `~/.cache/puppeteer/chrome-headless-shell/mac_arm-151.0.7922.77/chrome-headless-shell-mac-arm64/chrome-headless-shell --headless --disable-gpu --hide-scrollbars --default-background-color=00000000 --force-device-scale-factor=2 --window-size=W,H --screenshot=OUT.png file://IN.html`
  See `tex/make_cards.py` for the existing Google-style card set (`tex/c_*.png`). Put your own textures in `tex/` with a
  prefix unique to your shot.
- Typing animation: render one PNG per character count and use a Blender image SEQUENCE texture
  (`img.source='SEQUENCE'`, node.image_user.frame_duration / frame_start / use_auto_refresh) — frame-accurate.

## Rendering rules (important)
- 24 fps, 1920x1080. `render_shot("<name>", frames)` writes `renders/<name>/####.png`, or with `PREVIEW=1` →
  `renders/prev_<name>/` at 50 % res; `SAMPLES=` env sets samples; `STILL=12,40` renders only those frames to
  `renders/still_<name>_NNNN.png` (use STILL for iteration — fast).
- **Run every `blender` command with the Bash sandbox disabled (dangerouslyDisableSandbox: true).** Inside the sandbox
  Cycles/Metal crashes (NSException in MetalKernelPipeline::compile).
  Command: `cd ~/videos/<project> && PREVIEW=1 SAMPLES=24 STILL=… blender -b --factory-startup -P scenes/<file>.py > logs/<file>.log 2>&1`
- Iterate by comparing your stills to reference frames at the same ref times, side by side
  (`ffmpeg ... hstack/vstack` then Read the jpg). Fix composition, colour, scale, timing. Do at least 3 compare/fix rounds.
- Only write files for YOUR shot (your script `scenes/<shot>.py`, textures prefixed for your shot, your renders). Do not
  edit base.py / desk_world.py / other shots (copy helpers into your script if you need changes).
- Finish by rendering the full preview animation: `PREVIEW=1 SAMPLES=12 blender -b ... -P scenes/<shot>.py` (all frames).
- Motion: `key()` defaults to Bezier (ease in/out). For AE-style pops, overshoot slightly (scale 1.06 then 1.0 a few frames
  later). Keep camera moves purposeful and continuous; no floaty drift.
- Report: script path, frame count, what matches, what still differs from the reference, and a list of
  `(frame, sound)` cue suggestions for the sound designer (e.g. `12 pop`, `30 whoosh`).

## RENDER QUEUE (added after the Mac crashed): ALWAYS launch Blender via `./bl.sh scenes/<file>.py > logs/<file>.log 2>&1`
(instead of `blender -b --factory-startup -P ...`), still with the sandbox disabled. It allows only 2 Blender processes at
once; running 5 in parallel used ~20 GB of the 24 GB and crashed the machine. Waiting in the queue is expected.
