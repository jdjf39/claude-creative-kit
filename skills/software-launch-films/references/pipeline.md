# Pipeline: HyperFrames + GSAP, seek-safe

HyperFrames renders HTML frame by frame through headless Chrome with the host GPU. UI built as DOM stays razor sharp at any camera scale, which is why software films should be built here rather than in Blender or as screenshots.

## Project
```bash
cd ~/videos && HYPERFRAMES_SKIP_SKILLS=1 npx -y hyperframes@0.8.140 init <name> --example blank --resolution landscape --non-interactive --skill general-video
```
Pin the CLI version in every command (`npx -y hyperframes@0.8.140 ...`); an unpinned `npx hyperframes` once resolved to an unpublished version and 404'd. Copy Inter into `assets/fonts/` and declare it with `@font-face`.

## Composition skeleton (one file is fine for a 30 s film)
- Root: `<div id="root" data-composition-id="main" data-start="0" data-duration="<s>" data-width="1920" data-height="1080">`.
- Layers inside root, back to front: `#ground` (gradient or dark plate, PNG if banding), `#cam` (the camera group: everything that pans and zooms together), `#chars` (cursor characters and keycaps on their own layer, scaled separately), `#type` (statement lines), `#flash` (rare full-frame events).
- One paused GSAP timeline registered as `window.__timelines["main"]`, built with `fromTo` only (never `from`), no `repeat:-1`, no CSS transitions. Alternatively drive everything from one `render(t)` function on the `hf-seek` event (see `~/videos/acme-genesis/engine.js` + `index.html`), which is often simpler for camera maths: `window.addEventListener("hf-seek", e => render(e.detail.time))`.
- Camera: one transform on `#cam`: `transform-origin: 0 0; transform: translate(x,y) scale(s)`. To frame a rect `{x,y,w,h}` at scale `s` centred: `tx = 960 - (x + w/2)*s`, `ty = 540 - (y + h/2)*s`. Interpolate scale in log space.
- Audio: `<audio id="mix" src="assets/audio/mix.wav" data-start="0" data-duration="<s>" data-volume="1">` (every audio needs an id).

## Commands
```bash
npx -y hyperframes@0.8.140 lint                       # must be 0 errors
npx -y hyperframes@0.8.140 snapshot --at 1.2,4.5,9 --no-end --timeout 20000 --describe false   # stills -> snapshots/
npx -y hyperframes@0.8.140 render --fps 60 --quality looks -o out/film.mp4
```
A 40 s 60 fps WebGL-heavy film rendered in ~80 s on the M5 Pro; DOM-only films are faster. Re-encode the delivery copy at CRF 19 (`-preset slow -pix_fmt yuv420p -movflags +faststart`); the render itself is ~10 MB/s.

### Render gotchas (hyperframes@0.8.140, M5 Pro)
- A long or 240 fps render needs `HF_CAPTURE_PARALLEL_STREAM=true` (a disk capture of 33k frames wants ~35 GB of temp frames), and must run via the shell's own background mode: under `nohup` it cancels itself (`render_cancelled_parent_exited`).
- Never put a blur on a `<canvas>` that is redrawn every frame. A CSS `filter: blur()` on it stalls the headless capture after ~800 frames ("capture stalled: no frame progress for 60000ms"), and `ctx.filter = "blur()"` inside it kills the page ("Target closed"). Short test spans pass, so test a 2,000+ frame span before a full render. Dim instead (opacity), or blur DOM layers only.
- A per-frame 2D canvas (thousands of fillRects) is fine: 2,112 frames captured in 25 s.
- No `mix-blend-mode` on elements inside the camera/world layer, even invisible ones: it isolates and re-composites the whole world every frame, and the headless GPU died ("Target closed") ~7,900 frames into a chunk (acme-you20). Take idle overlays out with `display:none`, hide unrevealed panels with `visibility:hidden`, and only set a `clip-path` while it is actually animating.
- With a perspective projection on that canvas, cull to what can land on screen. Geometry near the lens (w → 0) projected to ~66,000 px wide shapes, and text scaled 20×, made the headless GPU page crash ("Target closed") about 1,100 frames in, while system Chrome drew the same frames in 3 ms. Compute the nearest visible point from the screen edge and the angle (`wMin` in acme-you17 drawWeek), and skip text whose scale is above 8 or whose anchor is off screen.

### Camera smoothness (the author: "all smooth camera movements, no hard shifts or cuts or lags")
- Measure before you judge: `a small camstat script (sample the camera at 120 Hz)` samples `__dbg.camAt` at 120 Hz and prints peak image speed, rms acceleration, the worst jolts with their times, stop-and-go starts and dead holds (`RAW=1` measures the unsmoothed path via `__dbg.camRaw`). v14 scored peak 19,331 px/s, rms accel 54,141, 10 stop-and-gos; v15 3,214 / 1,759 / 0.
- A blend that parks the camera on something during a ride (a statement hold) must be zero at both ends of the ride (`* sstep(0, .12, k) * (1 - sstep(.88, 1, k))`), or the camera snaps in one frame when the ride starts or ends. That was the "hard shift".
- Then sample the whole keyed path once and Gaussian-smooth it (sigma ≈ 0.28 s on cx, cy and log scale; `camInit`/`camSm` in acme-you15/film.js). It is non-causal, so nothing lags behind the comet, and every start and stop becomes a flow. Give holds a slow push (3 to 7%) so the camera never sits dead.

## Debugging in a real browser
Add a launch config entry (`~/.claude/launch.json`, `python3 -m http.server <port> --directory <project>`) and use the built-in browser: expose internals on `window.__dbg`, call `window.__frame(t)` and read pixels or values. This found a frustum-culling bug (Three.js points vanishing when the camera passed the geometry origin: set `frustumCulled = false` on shader-positioned points) in minutes.

## QA
- 4 fps motion sheet of the render: `python3 scripts/refsheet.py --motion out/film.mp4` (10 columns, timestamped).
- `motionmaxxing`'s `look.py` (`python3 ~/.claude/skills/motionmaxxing/scripts/look.py out/film.mp4 --out out/look --expect <s>`) and `cinetic`'s `forensics.py` are available for pops, dead holds and end-card length.
- Whisper check of any VO: `whisper-cli -m ~/.cache/hyperframes/whisper/models/ggml-small.en.bin -f <16k mono wav> -np`.

## When to use other engines
- After Effects: when the user wants an editable .aep or AE-native effects; slower to iterate.
- Blender (`blender-ad-films` skill): only for a physical hero object the user asked for. Never to stand in for software.
