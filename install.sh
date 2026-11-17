#!/usr/bin/env bash
# Installs the Claude Creative Kit into ~/.claude (Claude Code's home folder).
#   ./install.sh            install everything, never overwrite a skill you already have
#   ./install.sh --force    replace skills that already exist
#   ./install.sh --no-model skip the 570 MB speech model (transcripts will not work until you add it)
set -u
FORCE=0; MODEL=1
for a in "$@"; do case "$a" in --force) FORCE=1;; --no-model) MODEL=0;; esac; done
HERE="$(cd "$(dirname "$0")" && pwd)"
SK="$HOME/.claude/skills"; CMD="$HOME/.claude/commands"
mkdir -p "$SK" "$CMD"
say() { printf "\n\033[1m%s\033[0m\n" "$*"; }
put() { # put <source dir> <skill name>
  if [ -e "$SK/$2" ] && [ "$FORCE" = 0 ]; then echo "  keep   $2 (already installed)"; return; fi
  rm -rf "$SK/$2"; cp -R "$1" "$SK/$2"; rm -rf "$SK/$2/.git"; echo "  added  $2"
}

say "1/5 Tools (ffmpeg, yt-dlp, whisper, uv, node)"
if command -v brew >/dev/null; then
  for pair in ffmpeg:ffmpeg yt-dlp:yt-dlp whisper-cli:whisper-cpp uv:uv node:node git:git; do
    bin="${pair%%:*}"; pkg="${pair##*:}"
    if command -v "$bin" >/dev/null && { [ "$bin" != git ] || git --version >/dev/null 2>&1; }; then echo "  ok     $bin"; else echo "  installing $pkg ..."; brew install "$pkg" >/dev/null 2>&1 || echo "  FAILED $pkg (run: brew install $pkg)"; fi
  done
else
  echo "  Homebrew not found. On a Mac, install it from https://brew.sh then run this again."
  echo "  On Windows or Linux, install these yourself: ffmpeg, yt-dlp, whisper.cpp, uv, node, git."
fi

say "2/5 Speech model (gives Claude ears)"
M="$HOME/.cache/whisper.cpp/ggml-large-v3-turbo-q5_0.bin"
if [ -f "$M" ]; then echo "  ok     model present"
elif [ "$MODEL" = 1 ]; then
  mkdir -p "$(dirname "$M")"; echo "  downloading 570 MB, once ..."
  curl -L --fail --progress-bar -o "$M.part" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin" && mv "$M.part" "$M" || echo "  FAILED (run ./install.sh again later)"
else echo "  skipped"; fi

say "3/5 The kit's own skills"
for d in "$HERE"/skills/*/; do put "$d" "$(basename "$d")"; done
cp -n "$HERE"/commands/*.md "$CMD"/ 2>/dev/null; echo "  added  /newstyle and /oldstyle commands"
chmod +x "$SK"/reel-editor/scripts/*.py "$SK"/video-eyes-and-ears/scripts/*.py 2>/dev/null
if command -v swiftc >/dev/null && [ ! -x "$SK/reel-editor/scripts/ocr_boxes" ]; then
  swiftc -O "$SK/reel-editor/scripts/ocr_boxes.swift" -o "$SK/reel-editor/scripts/ocr_boxes" 2>/dev/null && echo "  built  on-screen text reader (Mac only)"
fi

say "4/5 Skills by other authors (fetched fresh from their own GitHub pages)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
get() { # get <owner/repo> <path inside repo, or . for the root> [more paths]   (path may end in /* for every skill in a folder)
  repo="$1"; shift; dir="$TMP/$(basename "$repo")"
  if ! git clone -q --depth 1 "https://github.com/$repo.git" "$dir" 2>/dev/null; then echo "  FAILED $repo (check your internet, then run again)"; return; fi
  for p in "$@"; do
    case "$p" in
      .) put "$dir" "$(basename "$repo")";;
      */\*) for s in "$dir/${p%/\*}"/*/; do [ -f "$s/SKILL.md" ] && put "$s" "$(basename "$s")"; done;;
      *) [ -f "$dir/$p/SKILL.md" ] && put "$dir/$p" "$(basename "$p")" || echo "  FAILED $repo/$p (the author moved it)";;
    esac
  done
}
get heygen-com/hyperframes                 'skills/*'
get greensock/gsap-skills                  'skills/*'
get pbakaus/impeccable                     .claude/skills/impeccable
get nextlevelbuilder/ui-ux-pro-max-skill   .claude/skills/ui-ux-pro-max
get Leonxlnx/taste-skill                   skills/taste-skill
get Leonxlnx/cinetic                       skills/cinetic
get systembuiltbyaj/motion-director        .
get Tejashmakwana/motionmaxxing            .
get microsoft/playwright-cli               skills/playwright-cli

say "5/5 Audio toolbox for the music and mixing scripts"
if command -v uv >/dev/null; then
  if [ ! -x "$HOME/.venvs/score/bin/python" ]; then uv venv -q "$HOME/.venvs/score" --python 3.12 2>/dev/null; fi
  uv pip install -q --python "$HOME/.venvs/score/bin/python" numpy scipy soundfile librosa pyloudnorm pillow 2>/dev/null && echo "  ok     ~/.venvs/score" || echo "  FAILED (the audio scripts need: numpy scipy soundfile librosa pyloudnorm)"
else echo "  skipped (uv missing)"; fi

say "Done. Close Claude Code and open it again, then try:"
echo '  "Watch this video and tell me why it works: <paste a link>"'
echo '  "Edit the videos in this folder into Instagram reels"'
echo '  "Build me a landing page for a coffee shop"'
