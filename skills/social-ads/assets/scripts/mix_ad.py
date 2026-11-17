"""Sound + mux for one social ad, both formats.
The music is ONE continuous take of a track (no loops, no edits), offset so a strong beat lands on the ad's logo.
On top: optional musical stops (ducks), pitched accents in the track's key, a low boom on the logo, and one SFX per
visible action from the builder's cue list. Then loudnorm -14 LUFS, a limiter, and a mux onto out/<ad>_v.mp4 / _h.mp4.

usage:  ~/.venvs/score/bin/python mix_ad.py <project_dir> <ad> [--fmts v,h] [--tag _alt]
config: <project_dir>/ads/<ad>.json
{
  "brand": "acme", "total": 22.5, "logo": 19.75,
  "cues": [[t, "sfx_name", vol], [t, "typing", vol, dur], ...],      # sfx names = files in sfx/ (see onsets.txt)
  "acc":  [[t, [pentatonic degrees], "marimba"|"bell", octave], ...], # pitched accents; [] for none
  "music": {                                                          # one entry per format, or "*" for both
    "v": {"file": "music/storm_track.wav", "offset": 5.049, "key": [8, false], "ducks": [[9.17, 9.85, 0.05]]},
    "h": {"file": "music/approved.wav", "offset": 5.685, "key": [9, true]}
  }
}
key = [root semitone (C=0 ... B=11), minor?]. offset = track time at ad 0 (from fit_music.py).
Outputs: out/<brand>-ad-<ad>-9x16<tag>.mp4 and -16x9<tag>.mp4"""
import os, sys, json, subprocess, argparse
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

ap = argparse.ArgumentParser()
ap.add_argument("project"); ap.add_argument("ad")
ap.add_argument("--fmts", default="v,h"); ap.add_argument("--tag", default="")
A = ap.parse_args()
P = os.path.abspath(os.path.expanduser(A.project))
cfg = json.load(open(os.path.join(P, "ads", A.ad + ".json")))
SR = 48000
TOTAL, LOGO = cfg["total"], cfg["logo"]
SFX = os.path.join(P, "sfx") if os.path.isdir(os.path.join(P, "sfx")) else os.path.join(os.path.dirname(__file__), "..", "sfx")
ONSET = {l.split()[0]: float(l.split()[2]) for l in open(os.path.join(SFX, "onsets.txt")) if l.strip()}
tt = lambda d: np.arange(int(d * SR)) / SR
os.makedirs(os.path.join(P, "out"), exist_ok=True)


def load(path):
    src, sr = sf.read(path, always_2d=True)
    if sr != SR:
        import librosa
        src = np.stack([librosa.resample(src[:, c], orig_sr=sr, target_sr=SR) for c in range(src.shape[1])], 1)
    return np.repeat(src, 2, 1) if src.shape[1] == 1 else src[:, :2]


def music_bed(m):
    rng = np.random.default_rng(21)
    src = load(os.path.join(P, m["file"]))
    N = int(TOTAL * SR); off = m["offset"]
    i0 = int(max(off, 0) * SR); lead = int(max(-off, 0) * SR)
    bed = np.vstack([np.zeros((lead, 2)), src[i0: i0 + N - lead]])
    bed = np.vstack([bed, np.zeros((max(0, N - len(bed)), 2))])[:N]
    t = np.arange(N) / SR
    bed *= np.minimum(1, t / 0.25)[:, None] * np.minimum(1, (TOTAL - t) / 0.9)[:, None]
    # the music sucks back for a beat right before the logo hit
    bed *= (1 - 0.7 * np.clip(1 - np.maximum((LOGO - 0.28 - t) / 0.05, (t - LOGO) / 0.02), 0, 1))[:, None]
    for a, b, *fl in m.get("ducks", []):                       # musical stops
        fl = fl[0] if fl else 0.08
        bed *= (fl + (1 - fl) * np.clip(np.maximum((a - t) / 0.03, (t - b) / 0.06), 0, 1))[:, None]
    root, minor = m.get("key", [9, True])
    penta = [0, 3, 5, 7, 10] if minor else [0, 2, 4, 7, 9]

    def deg(i, octave):
        o, k = divmod(i, 5)
        return 440 * 2 ** ((12 * (octave + o + 1) + root + penta[k] - 69) / 12)

    def marimba(f, v):
        x = tt(1.2)
        return (np.sin(2 * np.pi * f * x) * np.exp(-x * 3.8) + 0.3 * np.sin(2 * np.pi * f * 3.93 * x) * np.exp(-x * 14)
                + rng.standard_normal(len(x)) * np.exp(-x * 400) * 0.04) * v * np.minimum(1, x * 800)

    def bell(f, v):
        x = tt(2.2)
        return sum(a * np.sin(2 * np.pi * f * r * x) * np.exp(-x * d) for r, a, d in
                   ((1, 1, 1.4), (2.76, 0.35, 2.6), (5.4, 0.15, 4), (2.0, 0.22, 1.9))) * v * 0.5 * np.minimum(1, x * 900)

    acc = np.zeros((N + 3 * SR, 2))
    for tm, degs, inst, octv in cfg.get("acc", []):
        for k, d in enumerate(degs):
            s = (marimba if inst == "marimba" else bell)(deg(d, octv), 0.2 if inst == "marimba" else 0.17)
            i = int((tm + 0.01 * k) * SR); s = s[: len(acc) - i]; p = -0.2 + 0.15 * k
            acc[i:i + len(s), 0] += s * np.cos((p + 1) * np.pi / 4) * 1.414
            acc[i:i + len(s), 1] += s * np.sin((p + 1) * np.pi / 4) * 1.414
    x = tt(2.0)
    boom = np.sin(2 * np.pi * np.cumsum(40 + 70 * np.exp(-x * 12)) / SR) * np.exp(-x * 1.9) * 0.5
    i = int(LOGO * SR); acc[i:i + len(boom)] += boom[:, None]
    ir_t = tt(2.2)
    ir = np.stack([sosfilt(butter(1, 5000, "lp", fs=SR, output="sos"), rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.1))
                   for _ in range(2)], 1)
    ir /= np.sqrt((ir ** 2).sum(0))
    acc = acc * 0.75 + np.stack([fftconvolve(acc[:, c], ir[:, c])[: len(acc)] for c in range(2)], 1) * 0.45
    return np.tanh((bed / (np.abs(bed).max() + 1e-9) * 0.8 + acc[:N] * 0.8) * 1.1) / np.tanh(1.1)


def mix(music_path, out_wav):
    inputs = ["-i", music_path]; fc = [f"[0]atrim=0:{TOTAL},volume=0.66[m]"]; labels = ["[m]"]
    for n, c in enumerate(sorted(cfg["cues"], key=lambda c: c[0])):
        tm, name, vol = c[:3]; dur = c[3] if len(c) > 3 else None
        d = max(0, int((tm - (0 if dur else ONSET.get(name, 0))) * 1000))
        inputs += ["-i", os.path.join(SFX, name + ".wav")]
        trim = (f"aloop=loop=3:size=110000,atrim=0.35:{0.35 + dur},asetpts=N/SR/TB,afade=t=in:d=0.03,"
                f"afade=t=out:st={max(0.0, dur - 0.08)}:d=0.08,") if dur else ""
        fc.append(f"[{n + 1}]aformat=channel_layouts=stereo:sample_rates=48000,{trim}volume={vol},adelay={d}|{d}[s{n}]")
        labels.append(f"[s{n}]")
    fc.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=first,"
              "loudnorm=I=-14:TP=-1.5:LRA=10,alimiter=limit=0.85:level=false[a]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(fc), "-map", "[a]",
                    "-ar", "48000", out_wav], check=True)


brand = cfg.get("brand", "brand")
for fmt in A.fmts.split(","):
    m = cfg["music"].get(fmt) or cfg["music"].get("*")
    vid = os.path.join(P, "out", f"{A.ad}_{fmt}.mp4")
    if not m or not os.path.exists(vid):
        print("skip", fmt, "(no music entry or no", vid, ")"); continue
    mpath = os.path.join(P, "out", f"music_{A.ad}_{fmt}{A.tag}.wav")
    sf.write(mpath, music_bed(m).astype(np.float32), SR)
    wav = os.path.join(P, "out", f"mix_{A.ad}_{fmt}{A.tag}.wav"); mix(mpath, wav)
    fin = os.path.join(P, "out", f"{brand}-ad-{A.ad}-{'9x16' if fmt == 'v' else '16x9'}{A.tag}.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", vid, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", fin], check=True)
    print("FINAL", fin, len(cfg["cues"]), "cues")
