# Claude Creative Kit

A starter pack that teaches [Claude Code](https://claude.com/claude-code) how to edit video, make motion
graphics and build good-looking websites. It is a set of **skills**: instruction folders Claude reads when a
job calls for them, so you get a practised workflow instead of a first guess.

You do not need to know how to code. You talk to Claude in plain English; the skills are for Claude.

## What is inside

**Eyes and ears**

| skill | what it lets Claude do |
| --- | --- |
| `video-eyes-and-ears` | Download a video from a link (YouTube, Instagram, TikTok, X) or open a file, then actually study it: frames laid out with timestamps, a transcript of what is said, every cut, the pacing, the loudness. |

**Video editing and motion graphics**

| skill | what it makes |
| --- | --- |
| `motion-graphics-basics` | The base rules for every video: the order of work, music first, sound, and checking before delivery. Start here. |
| `reel-editor` | Your own filmed footage cut into Reels / TikToks / Shorts: removes pauses and retakes, reframes to vertical, captions in sync, clean audio. |
| `social-ads` | A batch of short faceless ads for a product, each in its own style, vertical and horizontal. |
| `software-launch-films` | A launch film for an app or website where the product's real screen is the star. |
| `blender-ad-films` | 3D product ads rendered in Blender (free), in a soft sunlit "toy world" look. |

**Websites**

| skill | what it makes |
| --- | --- |
| `cinematic-dom-sites` | A premium one-page site: big photography, video that plays as you scroll, smooth reveals. |
| `live-graphics` | Graphics drawn live in the browser (shaders, particles, 3D) instead of a flat image. |
| `world-sites` | A full 3D world behind the page that the camera flies through as you scroll. |

**Also installed, made by other people** (the installer fetches each from its author; see [CREDITS.md](CREDITS.md)):
HyperFrames (the engine that renders video from code), GSAP (animation), Impeccable, UI/UX Pro Max and
Taste Skill (design quality), Cinetic, Motion Director and Motionmaxxing (motion direction), Playwright (lets
Claude test pages in a browser).

## Install (Mac, about 10 minutes)

1. Install Claude Code: https://claude.com/claude-code
2. Install Homebrew (a free app store for tools) from https://brew.sh if you do not have it.
3. Open the Terminal app and paste these three lines, one at a time:

```bash
git clone https://github.com/jdjf39/claude-creative-kit.git ~/claude-creative-kit
```

```bash
cd ~/claude-creative-kit
```

```bash
./install.sh
```

It installs the tools (ffmpeg, yt-dlp, whisper), downloads a 570 MB speech model once, and copies the skills
into `~/.claude/skills`. It never overwrites a skill you already have unless you add `--force`.

4. Close Claude Code and open it again.

Or skip the Terminal: open Claude Code and say
*"Clone github.com/jdjf39/claude-creative-kit and run its install.sh for me."*

Windows and Linux: the skills work, but install the tools yourself (ffmpeg, yt-dlp, whisper.cpp, uv, node).
A few parts are Mac only (iPhone HDR conversion, the on-screen text reader).

## Your first hour

Try these, in this order. Each one is a full sentence you can paste into Claude Code.

1. **See that it can watch.**
   `Watch this video and tell me why it works: <paste a link>`
2. **Break a reference down.**
   `Break this reel down shot by shot, with the text on screen and the pacing: <link>`
3. **Edit your own footage.**
   `The videos in ~/Desktop/my-footage are me talking to camera. Edit them into 30 second reels with captions.`
4. **Make a motion graphic.**
   `Make a 15 second vertical promo for a coffee shop called Ember. Ask me what you need first.`
5. **Build a site.**
   `Build a one-page website for a landscaping company. Show me the plan before you build.`

You can also call a skill by name with a slash, for example `/reel-editor` or `/impeccable critique`.
`/oldstyle` builds a site the cinematic way; `/newstyle` adds a live-generated graphic.

## How to get good results

- **Show, don't describe.** Give Claude a video or a site you like. "Like this" beats ten adjectives.
- **Ask for a plan first** on anything big, and correct the plan. It is cheaper than correcting the result.
- **Give feedback like a director.** "The captions are too low and the music is too loud" works. Claude changes
  what you name and leaves the rest.
- **Make it check its own work.** "Render it, look at the frames, and tell me what is wrong before you show me."
- **Never paste passwords or API keys into the chat.** If something needs a login, do the login yourself.
- **Check music and footage rights** before you post or run paid ads. The kit ships no music or sound effects;
  see the `sfx/README.md` files for where to put your own.

## Optional extras

None of these are needed to start.

- `/plugin install frontend-design@claude-plugins-official` inside Claude Code: Anthropic's own design skill.
- [instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill): captions, hooks and profile help for Instagram (the reel editor uses its hook scorer when present).
- [Blender](https://www.blender.org) (free): needed only for `blender-ad-films`. `brew install --cask blender`
- An AI video or image generator of your choice, for B-roll you did not film. These are paid and need your own account.

## Updating and removing

```bash
cd ~/claude-creative-kit && git pull && ./install.sh --force
```

To remove a skill, delete its folder in `~/.claude/skills`.

## What a skill is

A folder with a `SKILL.md` file: a short description that tells Claude when to use it, then the instructions,
plus any scripts and templates. Open one and read it; it is plain English. To teach Claude your own taste,
edit the "house rules" in a skill, or just tell Claude "remember that I prefer ..." and ask it to save that.
