---
name: video-eyes-and-ears
description: >-
  Gives Claude eyes and ears on any video. Downloads a video from a link (YouTube, Instagram, TikTok, X,
  Vimeo, a direct file URL) or takes a local file, then turns it into things Claude can actually read:
  timestamped contact sheets of the frames, a timestamped transcript of what is said, every hard cut,
  the pacing and the loudness. Use WHENEVER the user shares a video or a video link and says "watch
  this", "look at this video", "what happens in this", "break this down", "study this reel/ad",
  "make something like this", "copy this style", "summarize this video", "what do they say", "why does
  this edit work", or before editing or recreating any reference video. Also use it to check your own
  finished render before calling it done.
---

# video-eyes-and-ears

Claude cannot play a video. This skill converts one into pictures and text, so you can study it properly
instead of guessing from the title.

```bash
W=~/.claude/skills/video-eyes-and-ears/scripts/watch.py     # uv script, installs its own deps
$W "https://www.youtube.com/watch?v=..."                     # a link
$W ~/Downloads/clip.mp4 --out ~/videos/refs                  # a file, into a chosen folder
$W a.mp4 b.mp4 --step 0.5                                    # several; one frame every half second
```

Needs `ffmpeg` and `yt-dlp` (links only). The transcript needs `whisper-cli` (whisper.cpp) and a model in
`~/.cache/whisper.cpp/`. Without it everything else still works and the report says the ears are missing.

## What you get, per video (`<out>/<name>/`)

| file | what it is | how to use it |
| --- | --- | --- |
| `report.md` | length, size, fps, every cut time, cuts per 10 s, median shot, loudness | read first |
| `sheet_01.jpg` ... | grids of frames, each stamped with its time | **open every one with the Read tool and look** |
| `transcript.txt` | `[mm:ss] what was said` | read fully; match lines to frames by time |
| `video.mp4` | the download (links only) | keep for closer looks |

## How to watch properly

1. Run the script. Read `report.md`, then the transcript, then look at **every** sheet. Never describe a
   video from the transcript alone, and never from one sheet of a long video.
2. For a moment that matters (a transition, a text animation, a hook), zoom in with a dense strip:
   ```bash
   ffmpeg -ss 12.0 -t 2 -i video.mp4 -vf "fps=12,scale=320:-2,tile=8x3" -frames:v 1 zoom_12s.jpg
   ```
   Twelve frames a second shows how something moves, which a sheet at one frame a second cannot.
3. One full-size frame, to read small text or judge colour:
   `ffmpeg -ss 7.5 -i video.mp4 -frames:v 1 frame_7_5.png`
4. Sound beyond speech: the report gives loudness. For the music's tempo and where the beat lands, load the
   audio with librosa (`librosa.beat.beat_track`) and compare beat times with the cut times in the report.
   Cuts that sit on beats are why an edit feels "tight".

## Breaking a reference down (when the user wants "something like this")

Write the breakdown as a table the user can check against the video, one row per shot:

| time | what is on screen | motion / transition | text on screen | sound |
| --- | --- | --- | --- | --- |

Then say, in plain words: the hook (first 2 seconds), the structure, the pace (cuts per 10 s), the type and
colour, the three things that make it work, and what you would keep or change. Describe technique and
structure; do not copy someone's footage, music, logo or exact wording into the user's own video.

## Checking your own work

Run the same script on your render before you say it is done. Look at the sheets for: black or frozen
frames, text cut off or over a face, a caption out of sync with the transcript time, a hard cut that
should be on the beat. If you did not look, do not claim it looks right.

## Rules

- Only download videos the user points you to, for study or for editing their own content.
- Some links need the user to be logged in (private posts). Say so and ask for the file instead; never ask
  for passwords or cookies.
- Long videos: the default spreads about 75 frames across the whole thing. For a talk or podcast, lean on
  the transcript and pull dense strips only where the picture matters.
