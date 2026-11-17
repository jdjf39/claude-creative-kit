#!/usr/bin/env python3
"""Reference films in, contact sheets and cut stats out.

  refsheet.py <whatships-slug | whatships URL | video URL | local file> [...] [--out DIR] [--step S]
  refsheet.py --motion out/film.mp4 [--fps 4]      # 4 fps timestamped sheet of your own render

For each reference: downloads (whatships pages are parsed for their own videoUrl), writes
<out>/raw/<name>.mp4, <out>/sheets/<name>.jpg (timestamped grid, ~40 frames) and prints
length, hard cuts (scene > 0.32), median shot and cuts per 10 s."""
import argparse, html, json, os, re, statistics, subprocess, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont

UA = {"User-Agent": "Mozilla/5.0"}
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()

def resolve(src, raw):
    if os.path.exists(src): return src, os.path.splitext(os.path.basename(src))[0]
    slug = None
    m = re.search(r"whatships\.com/videos/([a-z0-9\-]+)", src)
    if m: slug = m.group(1)
    elif re.fullmatch(r"[a-z0-9\-]+", src): slug = src
    if slug:
        t = html.unescape(fetch(f"https://whatships.com/videos/{slug}/").decode("utf8", "ignore"))
        i = t.find('"slug":[0,"%s"]' % slug); j = t.find('"videoUrl"', i if i >= 0 else 0)
        url = re.match(r'"videoUrl":\[0,"([^"]+)"\]', t[j:j + 400]).group(1); name = slug
    else:
        url, name = src, re.sub(r"[^a-z0-9]+", "-", os.path.basename(src).lower())[:40]
    dst = os.path.join(raw, name + ".mp4")
    if not os.path.exists(dst): open(dst, "wb").write(fetch(url))
    return dst, name

def duration(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)

def cuts(f):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", f, "-vf", "select='gt(scene,0.32)',showinfo", "-f", "null", "-"], capture_output=True, text=True).stderr
    return [float(x) for x in re.findall(r"pts_time:([0-9.]+)", r)]

def sheet(f, out, step, cols=8, width=360):
    tmp = out + ".frames"; os.makedirs(tmp, exist_ok=True)
    for p in os.listdir(tmp): os.remove(os.path.join(tmp, p))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-vf", f"fps=1/{step},scale={width}:-2", f"{tmp}/%04d.jpg"], check=True)
    fs = sorted(os.listdir(tmp)); ims = [Image.open(os.path.join(tmp, p)).convert("RGB") for p in fs]
    w, h = ims[0].size; rows = (len(ims) + cols - 1) // cols
    S = Image.new("RGB", (cols * (w + 4), rows * (h + 4)), (40, 40, 40)); D = ImageDraw.Draw(S); font = ImageFont.truetype(FONT, 20)
    for i, im in enumerate(ims):
        x, y = (i % cols) * (w + 4), (i // cols) * (h + 4); S.paste(im, (x, y))
        D.rectangle([x, y, x + 74, y + 26], fill="black"); D.text((x + 4, y + 2), f"{i * step:.1f}s", fill="yellow", font=font)
    S.save(out, quality=82)
    for p in fs: os.remove(os.path.join(tmp, p))
    os.rmdir(tmp)

def main():
    a = argparse.ArgumentParser(); a.add_argument("src", nargs="+"); a.add_argument("--out", default=".")
    a.add_argument("--step", type=float, default=0); a.add_argument("--motion", action="store_true"); a.add_argument("--fps", type=float, default=4)
    o = a.parse_args()
    if o.motion:
        for f in o.src:
            out = os.path.splitext(f)[0] + "_motion.jpg"; sheet(f, out, 1 / o.fps, cols=10, width=384); print("wrote", out)
        return
    raw, sh = os.path.join(o.out, "raw"), os.path.join(o.out, "sheets"); os.makedirs(raw, exist_ok=True); os.makedirs(sh, exist_ok=True)
    for s in o.src:
        f, name = resolve(s, raw); d = duration(f); c = cuts(f)
        b = [0] + c + [d]; L = [b[i + 1] - b[i] for i in range(len(b) - 1) if b[i + 1] - b[i] > 0.05]
        sheet(f, os.path.join(sh, name + ".jpg"), o.step or round(max(0.75, d / 40), 2))
        print(f"{name:<34} {d:5.1f}s  cuts {len(c):3d}  median shot {statistics.median(L):5.2f}s  cuts/10s {len(c) / d * 10:4.1f}  -> {sh}/{name}.jpg")

if __name__ == "__main__":
    main()
