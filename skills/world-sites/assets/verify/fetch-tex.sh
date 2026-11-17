#!/bin/bash
# Build-time texture acquisition — PolyHaven CC0, self-hosted after download.
# (ambientCG is unreachable from this network; PolyHaven carries everything.)
# ice  ← marble_01        (white veined marble = glacial ice cracks, tinted in-shader)
# wall ← marble_cliff_01  (large-scale pale cliff for the cavern enclosure)
# snow ← snow_02          (floor beds)
# Runtime stays zero-external; this script never ships.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/tex/2k public/tex/1k

PH="https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k"

grab() { # $1 out-prefix, $2 slug
  local out="$1" slug="$2"
  curl -fL --retry 3 -o "public/tex/2k/${out}_color.jpg"  "$PH/$slug/${slug}_diff_2k.jpg"
  curl -fL --retry 3 -o "public/tex/2k/${out}_normal.jpg" "$PH/$slug/${slug}_nor_gl_2k.jpg"
  curl -fL --retry 3 -o "public/tex/2k/${out}_rough.jpg"  "$PH/$slug/${slug}_rough_2k.jpg"
  echo "✓ $out ← $slug"
}

grab ice marble_01
grab wall marble_cliff_01
grab snow snow_02

# recompress 2k (some sources ship near-lossless) + build 1k lite variants
for f in public/tex/2k/*.jpg; do
  sips -s format jpeg -s formatOptions 72 "$f" --out "$f.tmp" >/dev/null && mv "$f.tmp" "$f"
  sips -Z 1024 -s formatOptions 70 "$f" --out "public/tex/1k/$(basename "$f")" >/dev/null
done

# 1K winter/overcast HDRI — env lighting, full tier only
for slug in snowy_park_01 snowy_forest_path_01 kloofendal_48d_partly_cloudy_puresky; do
  if curl -fL --retry 2 -o public/tex/winter_1k.hdr "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/${slug}_1k.hdr"; then
    echo "✓ HDRI ← $slug"
    break
  fi
done

echo "— payload —"
du -sh public/tex/2k public/tex/1k public/tex/winter_1k.hdr
