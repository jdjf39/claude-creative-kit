---
name: motion-graphics-basics
description: >-
  The base rules for any motion graphics or edited video made with code: how to plan it, time it to
  music, add sound, and check it before delivery. Use at the START of any request to make a video,
  animation, promo, ad, reel, logo sting, animated explainer or "motion graphic", and whenever the user
  is new and asks "how do I make a video with Claude". It picks the right specialist skill for the job
  and sets the quality bar they all share.
---

# Motion graphics basics

Read this first, then hand over to the specialist skill.

## Which skill does the job

| the user wants | use |
| --- | --- |
| to study or copy the feel of an existing video | `video-eyes-and-ears` first, always |
| their own filmed footage cut into Reels / TikToks / Shorts | `reel-editor` |
| a few short faceless ads for a product, vertical and horizontal | `social-ads` |
| a launch or product film where the app's screen is the star | `software-launch-films` |
| a 3D "toy world" product ad rendered in Blender | `blender-ad-films` |
| any other animation, title, explainer or promo | `hyperframes` (the render engine), with `motion-director`, `motionmaxxing` or `cinetic` for direction |
| animation inside a website | `gsap-*`, `live-graphics` |

## The order of work (every video)

1. **Reference.** Ask for one or two videos they like. Watch them with `video-eyes-and-ears`. Agree in two
   sentences what the video is and who it is for.
2. **One idea.** A short video carries one idea. Write it as one line. If it needs "and", it is two videos.
3. **Music first.** Pick the track before animating. Measure its tempo and beats. Never pick music blind:
   make a numbered audition reel of 6 to 8 options (10 s each) and let the user answer with numbers.
4. **Timing grid.** Put the big moments (the reveal, the logo) on strong beats. Decide the logo time before
   building anything.
5. **Build** in code (HTML + GSAP through HyperFrames, or Blender for 3D). Design vertical 9:16 and
   horizontal 16:9 as two layouts; never crop one into the other.
6. **Sound per action.** Every visible action gets a small sound placed on its exact frame. Balance:
   voice about -16 LUFS, effects about -24, music about -27, then master the whole mix to -14 LUFS with
   peaks under -1 dB. A voice buried under music is the most common mistake.
7. **Look before you ship.** Render, run `video-eyes-and-ears` on the result, look at the frames, fix what
   reads wrong, and only then show the user.

## Taste rules that hold up

- Show the real thing. A product's actual screen full-frame beats a screenshot inside an angled laptop.
- A calm base palette plus one surprising accent colour. Not five colours.
- Text: few words, big, on screen long enough to read twice. Keep it out of the areas a phone app covers
  (top 12 %, bottom 25 %, right edge on vertical video).
- Smooth camera moves; ease in and out. No sudden jumps unless they land on a beat on purpose.
- Motion blur and depth make code animation look filmed. Flat and floaty reads as "AI made".
- Do not loop or chop a music track unless the cut is exact on a bar line. For a video under 25 s, play
  the track straight through.
- Every posted video gets its own track.
- Never invent a number, a customer or a result for on-screen text.
- When the user gives feedback on something they like, change only what they named.

## Being honest about the result

Say what you checked and what you did not. "Rendered, looked at the frames, captions in sync" is a
report. "Should look good" is not.
