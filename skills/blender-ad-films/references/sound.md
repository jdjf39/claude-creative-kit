# Sound: the half of the edit that makes it feel "on point"

## SFX
- Source: HeyGen catalog via the `heygen` CLI (`~/.local/bin/heygen`, OAuth in ~/.heygen). Search with
  `heygen audio sounds list --type sound_effects --query "<plain description>" --min-score 0.4 --limit 3`.
  Results carry presigned URLs; download and convert to 48 kHz stereo WAV.
- The proven 20-sound kit (names used by edit.py): key, typing, paper_turn, paper_crinkle, domino_rattle,
  chime_up, chime_soft, sparkle_rise, whoosh, whoosh_short, swipe, swish, swish_thud, whoosh_thud, pop,
  blip, click, swell, fly_through, logo_sting.
- Measure every file's leading silence (`silencedetect n=-40dB`) into `sfx/onsets.txt`, and measure the
  peak time of long sounds (ebur128 momentary max). Then place them by the visible hit frame:
  `at(shot, frame, name, vol, lead=peak)` makes a swell or fly-through PEAK on a cut.
- Density target: about 3 cues per second in busy sections. One keystroke per typed character (read the
  typing image sequence's char-count map), a pop per card, clicks every 3 frames on a domino wave,
  a whip swish on every whip pan, a sting on the logo.
- SFX volumes 0.2–0.55 under the music; loudnorm the final mix to −14 LUFS, TP −1.

## Music
- Search many candidates (6+ queries × 8), download 28–32 s of each, and rank by distance to the
  reference's audio features: tempo (allow ×2, ×½, ×1.5), spectral centroid, pulse strength (onset
  autocorrelation peak), low-end ratio. Commit to the closest one. Don't ask the client to choose from
  a list if they've said they can't judge music.
- the author's taste: calm, pleasing, "like you're learning something"; bright but not hype. NOT house,
  phonk, trap, NCS or cheesy ukulele-corporate. The winner for the Gemini recreation was a soft warm
  marimba + plucked-strings instrumental (HeyGen id 23fd047416cd4a4ebb1facfeb488447f).
- License note: HeyGen catalog tracks are AI-generated ("Astral"); their license for paid ads outside
  HeyGen is unverified. Flag this for paid media.

## Private comparison cut
`edit.py --ref-audio` lays the reference's own audio under your picture so you can judge sync. It's for
the client's eyes only and never published.
