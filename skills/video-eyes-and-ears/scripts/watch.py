#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow"]
# ///
"""Give Claude eyes and ears on a video.

  watch.py <URL or file> [more ...] [--out DIR] [--step SECONDS] [--no-ears] [--lang en]

For each video it writes into <out>/<name>/:
  video.mp4        the download (URLs go through yt-dlp: YouTube, Instagram, TikTok, X, Vimeo ...)
  sheet_01.jpg...  timestamped contact sheets (the "eyes": Claude reads these images)
  transcript.txt   what is said, with timestamps (the "ears": whisper.cpp, if installed)
  report.md        length, size, fps, every hard cut, pacing, loudness

Then READ report.md, transcript.txt and LOOK at every sheet before saying anything about the video.
"""
import argparse, json, os, re, shutil, statistics, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

MODEL_DIR = Path.home() / ".cache/whisper.cpp"
FONTS = ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "C:/Windows/Fonts/arialbd.ttf"]


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def need(tool, hint):
    if not shutil.which(tool):
        sys.exit(f"missing `{tool}`. Install it: {hint}")


def fetch(src, out_root):
    if os.path.exists(src):
        name = re.sub(r"[^A-Za-z0-9]+", "-", Path(src).stem).strip("-")[:50] or "video"
        d = out_root / name; d.mkdir(parents=True, exist_ok=True)
        return Path(src).resolve(), d
    need("yt-dlp", "brew install yt-dlp")
    r = run(["yt-dlp", "--no-playlist", "--print", "%(id)s", "--skip-download", src])
    vid = (r.stdout.strip().splitlines() or ["video"])[0]
    name = re.sub(r"[^A-Za-z0-9]+", "-", vid).strip("-")[:50] or "video"
    d = out_root / name; d.mkdir(parents=True, exist_ok=True)
    dst = d / "video.mp4"
    if not dst.exists():
        r = run(["yt-dlp", "--no-playlist", "-f", "bv*[height<=1080]+ba/b[height<=1080]/b", "--merge-output-format", "mp4",
                 "-o", str(dst), src])
        if not dst.exists():
            sys.exit("download failed:\n" + r.stderr[-800:])
    return dst, d


def probe(f):
    j = json.loads(run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(f)]).stdout)
    v = next((s for s in j["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in j["streams"] if s["codec_type"] == "audio"), None)
    dur = float(j["format"].get("duration", 0))
    fps = 0.0
    if v:
        n, _, d = v.get("avg_frame_rate", "0/1").partition("/")
        fps = float(n) / float(d or 1) if float(d or 1) else 0.0
    return dict(dur=dur, w=v and v["width"], h=v and v["height"], fps=fps, audio=bool(a))


def cuts(f):
    r = run(["ffmpeg", "-hide_banner", "-i", str(f), "-vf", "select='gt(scene,0.32)',showinfo", "-an", "-f", "null", "-"])
    return [float(x) for x in re.findall(r"pts_time:([0-9.]+)", r.stderr)]


def font(size):
    for p in FONTS:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def sheets(f, d, info, step):
    tmp = d / ".frames"; shutil.rmtree(tmp, ignore_errors=True); tmp.mkdir()
    portrait = (info["h"] or 0) > (info["w"] or 1)
    width, cols, per = (270, 8, 40) if portrait else (400, 5, 30)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-vf", f"fps=1/{step},scale={width}:-2", str(tmp / "%05d.jpg")])
    fs = sorted(tmp.iterdir()); out = []; fnt = font(20)
    for n in range(0, len(fs), per):
        ims = [Image.open(p).convert("RGB") for p in fs[n:n + per]]
        w, h = ims[0].size; rows = (len(ims) + cols - 1) // cols
        S = Image.new("RGB", (cols * (w + 4), rows * (h + 4)), (30, 30, 30)); D = ImageDraw.Draw(S)
        for i, im in enumerate(ims):
            x, y = (i % cols) * (w + 4), (i // cols) * (h + 4); S.paste(im, (x, y))
            t = (n + i) * step
            D.rectangle([x, y, x + 86, y + 26], fill="black"); D.text((x + 4, y + 2), f"{int(t // 60)}:{t % 60:04.1f}", fill="yellow", font=fnt)
        p = d / f"sheet_{n // per + 1:02d}.jpg"; S.save(p, quality=80); out.append(p)
    shutil.rmtree(tmp, ignore_errors=True)
    return out


def loudness(f):
    r = run(["ffmpeg", "-hide_banner", "-i", str(f), "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"])
    i = re.findall(r"I:\s+(-?[0-9.]+) LUFS", r.stderr); p = re.findall(r"Peak:\s+(-?[0-9.]+) dBFS", r.stderr)
    return (i[-1] if i else "?"), (p[-1] if p else "?")


def ears(f, d, lang):
    cli = shutil.which("whisper-cli") or shutil.which("whisper-cpp")
    models = sorted(MODEL_DIR.glob("ggml-*.bin"), key=lambda p: p.stat().st_size, reverse=True) if MODEL_DIR.exists() else []
    if not cli or not models:
        return None, "no transcript: install whisper.cpp (`brew install whisper-cpp`) and a model in ~/.cache/whisper.cpp (the kit's install.sh does both)"
    wav = d / ".audio.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-vn", "-ac", "1", "-ar", "16000", str(wav)])
    base = d / "transcript"
    r = run([cli, "-m", str(models[0]), "-f", str(wav), "-l", lang, "-otxt", "-osrt", "-of", str(base)])
    wav.unlink(missing_ok=True)
    srt = Path(str(base) + ".srt")
    if not srt.exists():
        return None, "transcription failed: " + r.stderr[-300:]
    lines = []
    for blk in srt.read_text(encoding="utf8", errors="ignore").strip().split("\n\n"):
        p = blk.split("\n")
        if len(p) >= 3:
            lines.append(f"[{p[1][3:8]}] " + " ".join(p[2:]).strip())
    out = d / "transcript.txt"; out.write_text("\n".join(lines) + "\n", encoding="utf8"); srt.unlink()
    return out, f"{len(lines)} lines"


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("src", nargs="+"); a.add_argument("--out", default="watched")
    a.add_argument("--step", type=float, default=0, help="seconds between frames (default: auto, about 60-90 frames)")
    a.add_argument("--no-ears", action="store_true"); a.add_argument("--lang", default="auto")
    o = a.parse_args()
    need("ffmpeg", "brew install ffmpeg")
    root = Path(o.out).expanduser(); root.mkdir(parents=True, exist_ok=True)
    for src in o.src:
        f, d = fetch(src, root); info = probe(f)
        step = o.step or max(0.5, round(info["dur"] / 75, 1))
        cs = cuts(f); sh = sheets(f, d, info, step)
        shots = [b - a for a, b in zip([0] + cs, cs + [info["dur"]]) if b > a]
        lufs, peak = loudness(f) if info["audio"] else ("-", "-")
        tr, note = (None, "skipped") if o.no_ears or not info["audio"] else ears(f, d, o.lang)
        rep = [f"# {d.name}", "", f"- source: {src}", f"- file: {f}",
               f"- length: {info['dur']:.1f} s, {info['w']}x{info['h']}, {info['fps']:.2f} fps, audio: {'yes' if info['audio'] else 'no'}",
               f"- hard cuts: {len(cs)} ({len(cs) / max(info['dur'], 1) * 10:.1f} per 10 s), median shot {statistics.median(shots):.2f} s" if shots else "- hard cuts: 0",
               f"- cut times (s): {', '.join(f'{c:.2f}' for c in cs) or 'none'}",
               f"- loudness: {lufs} LUFS integrated, peak {peak} dBFS",
               f"- contact sheets (one frame every {step} s): {', '.join(p.name for p in sh)}",
               f"- transcript: {tr.name if tr else note}"]
        (d / "report.md").write_text("\n".join(rep) + "\n", encoding="utf8")
        print("\n".join(rep)); print(f"\n-> {d}\n")


if __name__ == "__main__":
    main()
