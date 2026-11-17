---
name: social-ads
description: >
  Make a batch of short social ads (15-25 s faceless motion-graphics promos) for a product or brand, each in its OWN
  style, every one designed natively in BOTH vertical 9:16 (Reels/TikTok/Shorts) and horizontal 16:9
  (LinkedIn/YouTube). Scored with a fitted music track per ad (never looped, a beat on the logo, a different
  track for every posted ad) and dense SFX. Proven on Acme (2026-09): notification storm, before/after split and live-call
  ads, all approved. Use WHENEVER asked to: "make ads", "make more ads", "ad variations", "different ads to post",
  "publicity videos", "social ads", "reels/TikTok ads for <brand>", "make a few ad styles", "switch the audio on the
  ads", "find music for the ads", or "use the social ads skill". Also use it to add a new ad to an existing series, or to
  re-score ads with new tracks via a numbered audition reel. Not for a long product tour/launch film (use
  blender-ad-films or product-launch-video) and not for websites.
---

# Social ads

Short, varied, postable ads, each a different look, each in both formats, each with its own music. Built as
HyperFrames HTML compositions by parallel builder agents; scored and muxed by `assets/scripts/mix_ad.py`.

## Workflow

1. **Pick concepts with the client.** Read `references/concepts.md`. Ask ONE AskUserQuestion with two questions:
   - Styles (multiSelect): 4 concepts tailored to the product, one line each saying the tone and what happens.
   - Format: 9:16, 16:9 or both. The recommendation is both, since each is designed separately.
   Then build their picks. Their favourite gets the most care.
2. **Set up the project** at `~/videos/<brand>-ads/{ui/assets,out,music,sfx,ads}`:
   - `cp assets/project/{hyperframes.json,package.json,meta.json} ui/`
   - `cp assets/project/inter.woff2 ui/assets/`
   - `cp assets/sfx/* sfx/`
   - Copy the brand's approved track, if any, to `music/`. Check the brand's music library first (see music.md).
3. **Decide timing before anyone builds.** Each ad gets a total length, **L** (the logo pop, which must land on a music hit)
   and a **drop** (where the escalation goes). With a known track, use `scripts/fit_music.py`. The defaults that worked are
   22.5 s with L 19.75 and drop 5.64, or 19.8 s with L 16.93 and drop 2.82.
4. **Write the brief.** Fill `references/brief_template.md` into `<project>/BRIEF_ADS.md`, covering the brand, the end card,
   the no-invented-claims and no-real-brands rules, and the client's copy rules (e.g. no dashes).
5. **Launch one builder agent per ad, in parallel** (`run_in_background`), each building both formats. Give each the
   brief path, the file names, the length, L, the drop, and the concept's beats with rough times (examples are at the bottom
   of the brief template). Point them at the working examples in `assets/examples/` (`storm.*`, `split.*`, `live.*`). Ask each
   for a timeline, an **SFX cue list** and any copy it invented.
6. **Review every render yourself.**
   - Contact sheets: `ffmpeg -vf "fps=8/$dur,scale=…,tile=8x1"`.
   - One vertical frame at full resolution, to check the text is readable on a phone.
   - Send a builder back (SendMessage) for anything off.
7. **Score.** Turn each cue list into `ads/<ad>.json`; the format is in the mix_ad.py docstring, and `assets/examples/*.json`
   are real ones. Then run `~/.venvs/score/bin/python assets/scripts/mix_ad.py <project> <ad>`. Aim for -14 LUFS and a -1.5 dBTP limiter.
8. **Music per format** (`references/music.md`):
   - The horizontal versions can use the brand track.
   - **Every vertical ad gets a different track.**
   - If the client hasn't approved tracks for it, run `scripts/audition.py` and send the numbered reel. Never pick blind.
   - Fit their picks with `fit_music.py` (offset + key → json) and re-run mix_ad with `--fmts v`.
   - Save every liked or maybe track to `music/library/` with a README.
9. **Deliver** all files with SendUserFile, plus a table: one row per ad with its length, look and what happens. Flag any
   invented names or lines, and anything unverified.

## Non-negotiables (each was a client complaint)
- **Designed per format, never cropped.** Vertical = a big headline in the top third plus phone-sized UI; horizontal = type on one side, visual on the other.
- **Music is never audibly looped or cut off the beat.** For ads, play it straight through.
- **Never pick music blind.** Use audition reels and the library. Each posted ad gets its own track.
- **One sound per visible action**, with the escalation on the music drop and the logo on the music hit.
- **No invented facts, customers, stats or testimonials; no real brand names or UI.**
- Playful but polished. Nothing kiddy or cheesy.

## Assets
| Path | What |
|---|---|
| `assets/scripts/mix_ad.py` | JSON-driven mixer and muxer: a continuous music take at an offset, stops (ducks), pitched accents in key, a logo boom, SFX cues, loudnorm, then mux to `<brand>-ad-<ad>-{9x16,16x9}.mp4` |
| `assets/scripts/fit_music.py` | finds the offset that puts a beat on L and the rise on the drop; per-second energy; key guess |
| `assets/scripts/audition.py` | catalog search → rank by the liked/rejected tracks → numbered 10 s-each reel (Chrome number cards) |
| `assets/examples/` | the three approved Acme ads (storm, split, live: shared `.js`/`.css` + `_v`/`_h` html) and their `ads/*.json` score configs |
| `assets/project/` | HyperFrames project files and the Inter font |
| `assets/sfx/` | a 23-sound kit incl. `buzz` (phone) and `stamp`; `onsets.txt` = name, length, attack offset |
| `references/concepts.md` | concept menu with beat skeletons (the built ones plus 5 more) |
| `references/brief_template.md` | builder brief template and the three prompts that worked |
| `references/music.md` | fitting, stops, accents, audition, library, the client's taste |
| `references/gotchas.md` | environment and design traps |

Related: `blender-ad-films` (3D film look), `hyperframes` (the composition rules).
