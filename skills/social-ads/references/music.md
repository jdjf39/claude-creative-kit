# Music for social ads (the part that went wrong most often)

## Rules the client taught us, in order of pain
1. **Never loop or cut a track unless the edit is sample-exact on a bar line.**
   - A loop that assumed a 2.787 s bar (real: 2.8206 s) jumped 0.17 s off the beat at each restart. The client heard it as "lag".
   - Restarting the track on every scene cut was worse.
   - For short ads (≤ 25 s), play the track **straight through** from one offset.
2. **Never pick music blind.** The picker can't hear it. Feature matching picked tracks the client called "so bad" about five times
   (dark, trap and trailer; soft corporate; kiddy).
   - Use a **numbered audition reel** (`scripts/audition.py`): 6-8 tracks, 10 s each, and they reply with numbers.
   - Seed it with tracks they already LIKE (`--like`) and push away the rejects (`--reject`).
   - Then do a second round seeded with their pick. Round 1 got "only #3"; round 2 got 3 keepers.
3. **Every posted ad gets its own track.** "We will post and all can't have the same audio."
   - The hero film and the horizontal versions can share the approved brand track.
   - The vertical social cuts each need a different one.
4. **Keep a brand music library** (`<project>/music/library/` + README): each liked track, where it's used, its offset and key.
   Save every "maybe" too. Draw from the library first next time.

## Fitting a track to an ad (`scripts/fit_music.py`)
- Inputs: total length, **L** (the logo time), the **drop** time (the ad's escalation), and `--calm` if the opening should be quiet.
- Output: offsets where a strong beat lands exactly on L and the energy rises at the drop, a per-second energy row in ad
  time, and a key guess. Put the chosen offset and key into `ads/<ad>.json`.
- Choose L BEFORE the builders start. For a track with a known bar grid, L = (a bar line of the final hit) minus the offset.
  Tell builders to put the escalation on the drop and the big moments on beats. The builder of "live" snapped every key hit
  to the 0.705 s beat, which made it feel scored.
- **Musical stops**: for a "hard stop" moment in the picture (everything swiped away), duck the bed to about 5% for 0.7 s
  (`"ducks": [[9.17, 9.85, 0.05]]`). The track keeps running underneath, so the beat is still in phase when it returns.
- The mixer also sucks the bed down just before L and drops a low boom on L.

## Accents
- Pitched marimba/bell hits in the track's key (pentatonic degrees) on the big visual moments: pops, stamps, the success
  state, and ascending notes on step-by-step reveals.
- If the key guess is weak (corr < 0.5), keep accents sparse and use degrees both candidate keys share.
- The SFX layer gets one sound per visible action; `sfx/onsets.txt` gives each file's attack offset so hits land on the frame.

## Where things are
- The catalog: `~/.local/bin/heygen audio sounds list --query "…" --limit 30` (OAuth login, never keys in chat).
  The tracks are generated music, and many are cheesy, so the audition step is not optional.
- An environment with numpy/scipy/soundfile/librosa: `~/.venvs/score` (create with `uv venv` + `uv pip install` if missing).
