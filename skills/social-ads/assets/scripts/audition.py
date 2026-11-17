"""Music audition reel: search the HeyGen catalog, rank what comes back by closeness to the tracks the client LIKES
(and distance from the ones they rejected), pick N varied candidates, and render a numbered reel (10 s from each
track's strongest part, big number card on screen) so the client can just say "3 and 6". Never pick music blind.

usage: ~/.venvs/score/bin/python audition.py --out ~/videos/x-ads/out/music-audition.mp4 --dir ~/videos/x-ads/music/aud \
          --like liked1.wav liked2.wav [--reject bad1.wav bad2.wav] [--n 8] [--min-dur 23] \
          --query "bright marimba pluck groove, catchy" --query "upbeat lo-fi beat, key clicks, digital chimes" ...
Writes <dir>/chosen.json (ids in reel order) + <dir>/meta.json. Needs ~/.local/bin/heygen (logged in), ffmpeg,
and headless Chrome for the number cards (CHROME env or the puppeteer chrome-headless-shell)."""
import argparse, glob, json, os, subprocess, warnings
import numpy as np, soundfile as sf, librosa
warnings.filterwarnings("ignore")
ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True); ap.add_argument("--dir", required=True)
ap.add_argument("--like", nargs="+", required=True); ap.add_argument("--reject", nargs="*", default=[])
ap.add_argument("--query", action="append", required=True); ap.add_argument("--n", type=int, default=8)
ap.add_argument("--min-dur", type=float, default=23); ap.add_argument("--exclude-ids", nargs="*", default=[])
ap.add_argument("--bad-words", default="child,kid,whimsical,ukulele,cartoon,quirky,nursery,silly,goofy,comedic,cute")
A = ap.parse_args()
D = os.path.abspath(os.path.expanduser(A.dir)); os.makedirs(D, exist_ok=True)   # absolute: concat list paths resolve from the list file
BAD = [w for w in A.bad_words.split(",") if w]
HEYGEN = os.path.expanduser("~/.local/bin/heygen")

items = {}
for q in A.query:
    r = subprocess.run([HEYGEN, "audio", "sounds", "list", "--query", q, "--limit", "30", "--min-score", "0.55"],
                       capture_output=True, text=True)
    try:
        for it in json.loads(r.stdout).get("data", []):
            items.setdefault(it["id"], it)
    except Exception:
        print("search failed:", q, r.stderr[:200])
ok = {k: v for k, v in items.items() if v["duration"] >= A.min_dur and k[:8] not in A.exclude_ids
      and not any(b in v["description"].lower() for b in BAD)}
for k, v in ok.items():
    f = os.path.join(D, k[:8] + ".wav")
    if not os.path.exists(f):
        subprocess.run(["curl", "-s", "-o", f, v["audio_url"]])
json.dump(ok, open(os.path.join(D, "meta.json"), "w"), indent=1)
print(len(items), "found,", len(ok), "usable")


def feat(p):
    y, sr = librosa.load(p, sr=22050, mono=True, duration=40)
    m = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20); c = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    o = librosa.onset.onset_strength(y=y, sr=sr); tempo, _ = librosa.beat.beat_track(onset_envelope=o, sr=sr)
    con = librosa.feature.spectral_contrast(y=y, sr=sr).mean(1)
    return np.concatenate([m.mean(1) / 10, m.std(1) / 10, [c.mean() / 1000, o.mean(), float(np.atleast_1d(tempo)[0]) / 60], con / 10])


likes = [feat(os.path.expanduser(p)) for p in A.like]
rejs = [feat(os.path.expanduser(p)) for p in A.reject]
F, rows = {}, []
for k in ok:
    f = os.path.join(D, k[:8] + ".wav")
    try:
        F[k[:8]] = feat(f)
    except Exception:
        continue
    dL = min(np.linalg.norm(F[k[:8]] - l) for l in likes)
    dR = min((np.linalg.norm(F[k[:8]] - r) for r in rejs), default=10.0)
    rows.append((dL - 0.5 * dR, k[:8]))
rows.sort(); chosen = []
for _, k in rows:
    if all(np.linalg.norm(F[k] - F[c]) > 1.1 for c in chosen):   # keep the reel varied
        chosen.append(k)
    if len(chosen) == A.n:
        break
desc = {k[:8]: v["description"] for k, v in ok.items()}
for i, k in enumerate(chosen, 1):
    print(i, k, desc[k][:90])
json.dump(chosen, open(os.path.join(D, "chosen.json"), "w"))

# ---- reel: 10 s from each track's loudest sustained part, numbered cards
SR = 48000; segs = []
for k in chosen:
    y, sr = sf.read(os.path.join(D, k + ".wav"), always_2d=True)
    if sr != SR:
        y = np.stack([librosa.resample(y[:, c], orig_sr=sr, target_sr=SR) for c in range(y.shape[1])], 1)
    y = np.repeat(y, 2, 1) if y.shape[1] == 1 else y[:, :2]
    m = y.mean(1); w = SR * 10
    best = max(range(SR * 2, max(SR * 2 + 1, len(m) - w), SR // 2), key=lambda i: float(np.sqrt((m[i:i + w] ** 2).mean())))
    s = y[best:best + w].copy(); s = s / (np.abs(s).max() + 1e-9) * 0.85
    f = int(0.3 * SR); s[:f] *= np.linspace(0, 1, f)[:, None]; s[-f:] *= np.linspace(1, 0, f)[:, None]
    segs += [s, np.zeros((int(0.6 * SR), 2))]
wav = os.path.join(D, "audition.wav"); sf.write(wav, np.vstack(segs).astype(np.float32), SR)
chrome = os.environ.get("CHROME") or next(iter(sorted(glob.glob(os.path.expanduser(
    "~/.cache/puppeteer/chrome-headless-shell/*/chrome-headless-shell-*/chrome-headless-shell")))), None)
lst = []
for i in range(1, len(chosen) + 1):
    html = os.path.join(D, f"n{i}.html"); png = os.path.join(D, f"n{i}.png")
    open(html, "w").write(f'<html><body style="margin:0;width:1080px;height:1080px;background:#EDFC47;display:flex;'
                          f'flex-direction:column;align-items:center;justify-content:center;font-family:Helvetica">'
                          f'<div style="font:800 520px/1 Helvetica;color:#0F0F0F">{i}</div><div style="font:700 56px Helvetica;'
                          f'color:#0F0F0F;margin-top:40px">Track {i} of {len(chosen)}</div></body></html>')
    subprocess.run([chrome, "--headless", "--disable-gpu", "--hide-scrollbars", "--window-size=1080,1080",
                    f"--screenshot={png}", "file://" + html], capture_output=True)
    lst += [f"file '{png}'", "duration 10.6"]
lst.append(lst[-2])
open(os.path.join(D, "list.txt"), "w").write("\n".join(lst) + "\n")
out = os.path.expanduser(A.out)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(D, "list.txt"), "-i", wav,
                "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-c:a", "aac", "-b:a", "192k", "-shortest", out], check=True)
print("REEL", out)
