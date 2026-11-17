# Gotchas (each cost time)

## Environment
- **ffmpeg here has no `drawtext`.** For text in ffmpeg-made reels, render PNG cards with headless Chrome
  (`~/.cache/puppeteer/chrome-headless-shell/*/chrome-headless-shell-mac-arm64/chrome-headless-shell --screenshot`) and concat them.
- **System python3 has no numpy.** Run the audio scripts with `~/.venvs/score/bin/python`.
- **zsh does not word-split `$var`.** `for e in "0.3 0.8"` plus `set -- $e` breaks; use `b=${e%%:*}` style splitting.
- **`hyperframes lint` / `check` want a directory with an `index.html`.** To check one file, copy it into a temp folder as index.html.
  A composition whose `<video>` sources are missing aborts with a "coverage" error; drop the missing clips for test renders.
- **Chained `sleep` is blocked** in this harness. To wait on renders, use `until [ -f … ]; do sleep 15; done` with a timeout,
  or run it in the background and wait for the notification.

## Parallel builders
- **Parallel builders overwrote each other's shared helper file** (`cardkit.js`). Tell each builder to prefix its own files.
- **Builders add copy and names of their own.** Ask for a list of invented lines and names in the report, and flag them to the client.
  Invented company names can collide with real small companies.
- Typing spans in the prompt vs the chars/s rule: if the span is short, the builder types faster than the brief's speed. Give spans that fit the text.

## Design
- **Vertical must be designed, not reframed.** A landscape film re-shot upright "looks cropped" (client's words), and caption boxes are too
  small for reels. Put a big headline top-third (100+ px, key words marked) and one idea per screen, with UI rebuilt as
  phone-sized cards.
- **Landscape captions for reels:** at least 54 px bold, with `width:max-content; max-width:1640px`. With `left:50%` and no explicit width,
  an absolute box shrinks to half the frame and wraps early.
- Playful must stay polished. The client rejects anything childish.
- Check one vertical frame at FULL resolution (read the jpg at 540 px wide) to confirm phone readability; contact sheets hide it.
