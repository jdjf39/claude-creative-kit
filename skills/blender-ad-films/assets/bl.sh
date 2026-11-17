#!/bin/zsh
# Render queue: at most 2 Blender processes at once (5 in parallel exhausted 24 GB and crashed the Mac).
# usage: ./bl.sh scenes/<shot>.py > logs/<shot>.log 2>&1   (env vars like PREVIEW/SAMPLES/STILL pass through)
LOCKDIR=/tmp/gemini-blender-slots
mkdir -p $LOCKDIR
while true; do
  for s in 1 2; do
    if mkdir $LOCKDIR/slot$s 2>/dev/null; then
      trap "rmdir $LOCKDIR/slot$s 2>/dev/null" EXIT INT TERM
      /opt/homebrew/bin/blender -b --factory-startup -P "$@"
      exit $?
    fi
  done
  # reclaim slots whose owner died
  sleep 3
done
