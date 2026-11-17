---
name: blender-ad-films
description: >
  Make Blender + After-Effects-style 3D product ad films the proven way. Toy-like
  sunlit 3D worlds (window-light gobos, lavender shadows, soft clay props, frosted
  glass UI slabs, depth of field, motion blur), where the product's real UI flies,
  unrolls, stacks and bursts as 3D objects. Every shot is scripted in headless
  Blender (Cycles/Metal), matched frame by frame against a reference, cut to the
  reference's exact timing, and scored with dense frame-accurate SFX plus a music
  bed chosen by audio-feature matching. Use WHENEVER asked for: a "Blender ad",
  a "3D product ad / launch film", a "Gemini-style" or "Google/Apple-style 3D ad",
  a "fake ad" for a brand, recreating a reference motion-graphics ad shot for shot,
  a faceless 3D promo showing a SaaS UI in a 3D world, or "use the Blender ad
  skill". Not for flat 2D motion graphics or HTML promos (use hyperframes /
  product-launch-video) or for websites.
---

# Blender ad films

Proven on 2026-09-25: a shot-for-shot recreation of @nzj.3d's "fake ad for Google
Gemini" (28.5 s, 9 shots). The client called it "almost on point". Everything here
comes from that build. Treat the rules as load-bearing.

## What makes it NOT look AI-generated (the look bible)

1. **Reference first, always.** Get the reference video and extract frames
   (`ffmpeg ... fps=4`, and 6–8 fps sheets per shot). Write a shot list with ref
   timestamps before modelling anything. Match composition, colour, scale and timing
   per shot, not "the vibe".
2. **Light is the style.** A warm sun (energy 5–9, colour ~(1, .85, .66)) through an
   INVISIBLE occluder (a window frame, a single band, or venetian blinds) parented to an
   empty rotated like the sun. Add a strong lavender/blue world fill (0.5, 0.52, 0.98) at
   1.1–1.4 for coloured shadows. See `window_light()` in `desk_world.py` and the band
   rig in `example_hero_star_rise.py`.
3. **Grade:** AgX + "Punchy", exposure +0.2 to +0.55 for multi-colour brand palettes. Use
   **Khronos PBR Neutral** when a single saturated brand colour (e.g. lime #EDFC47) must
   not wash out.
4. **Colour and density:** saturated brand primaries on toy props, and busy detailed sets
   (the desk had a pegboard, a wire grid with sticky notes, pencils, a file tray, a cup,
   planters, a chair and a cabinet). Sparse white clay sets read as "AI".
5. **UI as physical objects:** render real UI to PNG with headless Chrome and put it on
   thick rounded slabs (`slab()`), with a coloured body edge like a paper stack. The decal
   plane goes ON the front face with `visible_shadow/glossy/transmission=False`, or you
   get ghost text.
6. **Motion:** After-Effects snappy. Fast moves that settle, slight overshoot on pops
   (scale 1.06 → 1.0), cascades staggered by 0.5–1 frame, and fly-ins with motion blur.
   Camera: animate LOCATION plus an aim empty with a Track-To constraint. Never keyframe
   raw rotations (interpolation misaims mid-move).
7. **Ribbons/flows go BEHIND the hero** as flat, translucent, wavy bands (curves with
   extrude + slight twist, alpha 0.6–0.8), never solid tubes passing through the UI. This
   was the client's one clear visual note.
8. **Sound is half the edit** (see `references/sound.md`): ~80 cues in 28 s, one sound
   per visible action (a keystroke per typed character, a pop per card, a clatter per
   domino, a whip on each whip pan, a sting on the logo).

## Workflow

Follow `references/workflow.md`. Summary:
1. Reference breakdown → shot table with ref in/out times, then write the project brief.
2. `mkdir` project `{scenes,tex,renders,ref,sfx,music,out,logs}`. Copy `assets/scenes/base.py`,
   `desk_world.py`, `assets/bl.sh`, `assets/edit.py` and `assets/BRIEF_AGENTS_template.md` in.
3. Build the look frame (one hero still) and compare it with the reference until it
   matches. Then build shots. Each shot is one script `scenes/shNN_name.py` using
   `render_shot()`, iterated with `STILL=` frames compared side by side against the
   reference.
4. Parallelise: one builder sub-agent per shot, given the brief. Max 4 builders, and ALL
   renders go through `bl.sh` (2 concurrent max).
5. Preview every shot: `PREVIEW=1 SAMPLES=12`. Assemble with `edit.py --preview`, send
   the full preview plus a side-by-side against the reference, get notes, fix, then do the
   final render.
6. Final render: full res, SAMPLES 64–96. It takes several hours on the M5 Pro; keep the
   Mac awake (`caffeinate`).

## Hard gotchas (each one cost time)

See `references/gotchas.md`. The ones that crash or waste hours:
- **Run Blender with the Bash sandbox disabled.** Inside it, Cycles/Metal crashes
  (NSException in MetalKernelPipeline::compile) because it can't write its kernel cache.
- **Never run more than 2 Blender renders at once on this 24 GB Mac.** Five at once
  wired ~20 GB and crashed the machine. Use `bl.sh`.
- Renders die mid-sequence under GPU pressure. `render_shot` sets
  `use_overwrite=False`, so just re-run it in a retry loop and it resumes.
- Blender 2D curve fill with extrude/bevel mis-scales polygon outlines (9.4 m instead of
  0.68 m). Build flat shapes as bmesh meshes instead (`sparkle_mesh` in `star_lib.py`).
- "Jelly" objects: an inflated lens mesh (z = h·√(1−f²) per ring). Voxel remesh + smooth
  does not puff a flat slab.

## Assets

| File | What it is |
|---|---|
| `assets/scenes/base.py` | materials, `slab()` (rounded-rect slab), `ui_panel`, props (pill, ring, dimple_ball, d_logo), `key()`, `cam_key`, `camera()`, `render_shot()` (PREVIEW/STILL/SAMPLES env, resumable) |
| `assets/scenes/desk_world.py` | a complete toy desk set + `window_light()` gobo + `grade()` + `world_fill()` + a MacBook-style `google_laptop()` with an emissive screen texture |
| `assets/scenes/star_lib.py` | inflated jelly sparkle mesh + angular rainbow gradient material (template for any hero logo object) |
| `assets/scenes/example_*.py` | the 7 proven shots: desk burst + fly-in, hero rise with lines on tile grooves, prompt typing (image-sequence texture) + tile rain, paper scroll (shape-key unroll) + ribbons, domino S-spiral + whip, glass window with layers stacking/unfolding, laptop pull-back |
| `assets/tex/make_cards.py` | HTML → PNG UI card generator (Google-style set; restyle per brand) |
| `assets/bl.sh` | 2-slot Blender render queue |
| `assets/edit.py` | EDL (shot, first frame, count) → concat, end card, SFX cue placement with measured onsets, music bed, loudnorm −14 LUFS, `--ref-audio` private comparison cut |
| `assets/BRIEF_AGENTS_template.md` | the shared brief for parallel shot builders |
