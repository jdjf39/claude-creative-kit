---
name: reel-editor
description: >-
  Edit raw talking-head or camera footage into finished Instagram Reels / TikToks / Shorts
  (1080x1920, -14 LUFS), the house way. Cuts pauses, fillers and retakes off a word-timed
  transcript, reframes 16:9 or sideways footage to 9:16 on the face, auto-grades Sony S-Log3,
  punches in every beat, burns in word-synced captions (pop / box / mono / clean), puts a hook
  card up at frame 1, runs the six-stage radio vocal chain, ducks a music bed, and drops in
  B-roll full-screen or split-screen. Generated B-roll comes from Higgsfield, motion graphics
  from HyperFrames, voiceover/cloned voice from VoiceStudio. Use WHENEVER the user hands over
  videos to "edit into reels", "cut this into short form", "make Instagram content from this",
  "add captions", "make it a reel", "clip this", "turn this into TikToks", "fix the audio like
  radio", or drops a folder of footage (Sony C0xxx.MP4 clips, iPhone .mov, CapCut exports).
  Not for faceless motion-graphics ads (social-ads) or launch films (software-launch-films).
---

# reel-editor

One engine, one JSON per reel, every edit reproducible.

## House rules (the author's own taste, learned from real feedback) - these override the defaults below

These are one creator's preferences. If the person you are editing for wants something else, their word wins:
ask once, then save their rules here in place of these.

- **Don't touch the creator's mic.** `"audio": {"chain": "none"}`: one static gain to -14 LUFS, nothing else. The radio
  chain + `denoise` made a lav mic sound "hollow, echo". No enhancing unless they ask.
- **No LUT, no grade on iPhone footage.** `"color": "apple"` (the default for HDR now): AVFoundation's own
  HDR to SDR per segment via `avconvert --start` (sample-accurate, checked), so it looks like the phone did.
- **One recording per reel.** Each take has its own feel. Only join clips when one continues the same
  thought in the same session (e.g. 7157 into 7158). Never mix the office and the night selfies.
- **Show the whole frame.** `"zoom": 1.0`, `"punch_in": 1.2`, `"punch_every": 3`: mostly the full shot,
  a gentle push-in now and then. No heavy crop.
- **Captions at the bottom, the line at the top.** `"captions": {"style": "native", "case": "natural",
  "y": 0.72}` and `"hook": {"style": "native_hook", "y": 0.17}`. Plain white, thin outline, natural case,
  no colour pop, no caps slabs. The pop/mono/box styles read "AI generated" to this creator.
- **Short and to the point.** About 30 s. Shape every reel: the pain point, make
  it evident, it happened to me, how the product or idea fixes it. Never jump to an unrelated line; keep explanations whole
  and cut only false starts, stumbles and repeated takes.
- **No title in the video.** The creator adds titles in Instagram. Put suggestions in titles.md; set no `hook`.
- **Night selfies:** captions lower (`y: 0.82`), under the body, not on the face.
- **Prove sync, don't eyeball it.** Re-transcribe the finished reel and compare caption times with the voice
  (head under 0.15 s, median 0.00 s). Word timing comes from whisper DTW (`--dtw ... -nfa`) plus voice-onset
  snapping; plain whisper.cpp segment times run up to 0.66 s early and leave dead air at the head of cuts.
- Path gotcha: a folder name with colons (`10:15:26`) makes ffmpeg read it as a protocol. Symlink it.

```bash
R=~/.claude/skills/reel-editor/scripts/reel.py     # uv script, deps install themselves
$R probe  SRC                     # size, fps, rotation, S-Log/HDR, audio
$R transcribe SRC -o WORK          # word-timed transcript, ~12x realtime (whisper large-v3-turbo)
$R plan WORK [--drop 27-28,40]     # auto cut: pauses > .35s, fillers, + word indices you drop
$R render reel.json                # the whole edit, ~1.3x realtime
$R proof OUT.mp4                   # contact sheet + LUFS + spec check -> LOOK at it
```

Work in `~/videos/reels/<batch>/`. Deliver finished files to a `<batch> reels/` folder the user can find,
numbered one way only (`01 hook-name.mp4`, `02 ...`), plus a `captions.md` with the post copy.

## The editor's job (the part the script can't do)

The script cuts and renders. **You** decide what the reel is. Per source video:

1. **Read `WORK/transcript.txt`** (every word has an index and a source timestamp).
2. **Find the reel(s) inside it.** One idea per reel, 15 to 45 s. A 6-minute ramble is usually
   3 to 5 reels. Write each as a list of source time ranges in `edl` - ranges may be **reordered**,
   so the strongest line can be pulled to the front as the hook even if it was said at minute 4.
3. **Cut the intro.** No "hey guys", no name, no "so today". The reel starts at the sentence that
   would normally arrive at second six.
4. **Kill retakes and stumbles** with `plan --drop` (word indices) or by editing the EDL by hand.
   Keep the *last* take of a repeated line, it is almost always the good one.
5. **Run the hook gate** (below) on the first spoken line. Under 50 means re-pick the opening.
6. **End on the payoff**, then one ask. If the clip has a line that echoes the hook, end on it
   so the loop lands.

Never invent a claim, number, client or result in a hook card or caption. Text on screen
must be something they actually said or a fact they gave you.

## Hook gate (every reel, before rendering)

Score the opening line (needs the optional instagram-agent plugin; skip the script and use the checklist if it is not installed):
```bash
python3 ~/.claude/plugins/cache/instagram-agent-skill/instagram-agent/*/skills/ig-reel/hookscore.py --hook "LINE"
```
Then answer the six-question checklist honestly, in one line each:
1. Would a total stranger stop and watch this?
2. Does the hook clearly promise what the viewer gets by the end?
3. Is it broad enough that most people would relate?
4. Does it create curiosity or tension in the first second?
5. Can the viewer immediately tell this video is for them?
6. Is it simple enough to understand in one glance or one listen?

Any "no" → fix it: pull a better line forward, or add an on-screen hook card that sharpens the
spoken one (the card can be more specific than the speech, never different in meaning).

## reel.json

```jsonc
{
  "source": "/path/C0106.MP4",
  "edl": [[12.4, 18.9], [3.1, 9.7], [40.2, 51.0]],   // or "WORK/edl.json" from plan
  "words": "WORK/words.json",          // source-time words; remapped through the edit for you
  "rotate": "auto",                    // 0 | 90 | -90 | 180 | "auto" (camera on its side)
  "color": "auto",                     // auto = S-Log3 LUT if the Sony XML says so; or a .cube
  "grade": {"contrast": 1.04, "saturation": 1.06},   // optional eq on top
  "reframe": "face",                   // face | center | none
  "punch_in": 1.12,                    // alternate shots zoom in; long takes split at sentence ends
  "beat_every": 3.5,                   // max seconds before the frame changes
  "captions": {"style": "pop", "y": "auto"},  // pop | box | mono | clean | off ; y auto = under the chin
  "hook": {"text": "5 HOURS -> 20 MIN", "start": 0, "end": 2.8, "style": "mono", "y": 0.2},
  "texts": [{"text": "STEP 2", "start": 9.1, "end": 11, "style": "box", "y": 0.18}],
  "inserts": [                         // output-timeline seconds
    {"file": "broll.mp4", "at": 4.2, "dur": 2.5, "mode": "top", "src_in": 0},   // split screen
    {"file": "shot.png",  "at": 12,  "dur": 2,   "mode": "full"}                // cutaway, slow push
  ],
  "audio": {"chain": "radio", "lufs": -14, "denoise": false},   // radio | light | none
  "music": {"file": "bed.wav", "gain_db": -20, "duck": true},
  "sfx":   [{"file": "whoosh.wav", "at": 4.2, "gain_db": -12}],
  "out": "out/01-hook.mp4"
}
```

## Styles (from reference reels)

| look | config | when |
| --- | --- | --- |
| Word pop (yellow active word, heavy outline) | `captions.style: "pop"` | default talking head, high energy |
| Dark pill, sentence case ("GitHub,") | `"box"` | tech/explainer, calmer |
| Mono caps slab ("BUT MOST PEOPLE", "SIX DIFFERENT SKILLS") | `"mono"` | builder/AI content, split screens |
| Full sentence, quiet ("typically put on microphones.") | `"clean"` | when a graphic carries the frame |
| Split screen: graphic/B-roll top, speaker bottom, caption on the seam | insert `mode: "top"` | explaining a thing you can show |
| Full-screen screen recording / diagram cutaway | insert `mode: "full"` | proof moments, "look at this" |
| Animated graphic card (numbered chain list, diagram, node map) | build in HyperFrames, insert it | lists, processes, comparisons |

Mix styles across a batch, not inside a reel: one caption style per reel.

**Safe zone** (the IG interface covers the rest): keep text between y 0.12 and 0.75 and out of
the right 230 px. `y: "auto"` already does this.

## Audio: the radio chain

`chain: "radio"` runs the six stages broadcast puts on a microphone, in order: high-pass 80 Hz →
downward expander (room tone between words) → de-esser → EQ (-2.5 dB @250 mud, +2.5 dB @3.2k
presence, air shelf) → compressor 3.5:1 → two-pass loudnorm to -14 LUFS → true-peak limiter at
-1 dBTP. Add `"denoise": true` for fans, AC or wind. Use `"light"` if the source was already
processed (CapCut exports, podcasts).

Music: `gain_db` -18 to -22 with `duck: true` sits the bed under the voice. Pick tracks from
the user's own approved music folder via an audition reel, never blind. A
different track per posted reel.

## Generating what the footage doesn't have

- **B-roll video:** Higgsfield MCP `generate_video`, `aspect_ratio: "9:16"` (or 1:1 for `top`
  inserts, cropped to 1080x960). `kling3_0_turbo` is the budget model, `seedance_2_5` the default.
  Always preflight `get_cost: true` and check `balance` first. Download the result and use it as an insert.
- **Stills:** `generate_image`, then a `full` insert (it gets a slow 6% push-in automatically).
- **Motion graphics** (patchd-style chain list, diagrams, node maps, stats): build a 1080x960 or
  1080x1920 HyperFrames composition (`/hyperframes`), render it, insert it. Free and local.
- **Voice:** VoiceStudio (`/voicestudio`, app at /Applications/VoiceStudio.app, API :3900) for
  narration, voice design and dubbing. Clone **only the user's own voice**, with their consent,, from a clean 10 to 30 s clip.

## Footage notes

- **Sony (`C0xxx.MP4` + `C0xxxM01.XML`):** shot S-Log3 / S-Gamut3.Cine and often sideways.
  `color: "auto"` reads the XML and applies `assets/luts/slog3-sgamut3cine-to-709.cube`;
  `rotate: "auto"` picks the rotation where faces are found. Audio is in-camera; use the radio
  chain with `denoise` outdoors.
- **iPhone HDR (HLG):** this ffmpeg has no zscale. `probe` flags it; convert to SDR first
  (`avconvert --preset PresetHighestQuality --source in.mov --output sdr.mov`, check the result).
- **CapCut exports:** often already cut tight, so `plan` finds little; do the editorial pass by hand.
- Keep work dirs lean (`keep_work` off) and delete test renders; raw footage fills a disk fast.

## Done means

For every reel: `proof` shows 1080x1920, 30 fps, -14 ±0.5 LUFS, true peak ≤ -1; you LOOKED at the
contact sheet (no caption on a face, no black frames, hook card legible at frame 1); the hook
scored ≥ 50 and passed the checklist. Then write the caption with `/ig-caption` and humanize it
with `/ig-human`. **Never post.** The user posts.

## Call skits
- Skits / acted scenes from calls: NEVER cut pauses or lines. Keep the whole take uncut, even near 3 min; the pauses carry the emotion.
- Two-person call layout: side by side (the creator left), 2:3 panels in a row across the middle, blurred call as the background, captions under the row. One-above-the-other.
- Upscale faces with Real-ESRGAN realesr-general-x4v3 (torch MPS, denoise 0.5, 85/15 blend with lanczos); the animevideov3 model makes faces look waxy ("we look weird").
