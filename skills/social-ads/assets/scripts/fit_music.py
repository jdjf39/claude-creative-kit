"""Fit a track to an ad so it plays straight through (no edits): find the offset where a strong BEAT lands exactly on
the logo, the energy RISES at the ad's escalation ("drop"), and the body is full. Also prints the per-second energy of
the best fits (in ad time) and the detected key for the accents.

usage: ~/.venvs/score/bin/python fit_music.py <track.wav> --total 22.5 --logo 19.75 --drop 5.64 [--calm]
  --calm: prefer offsets where the ad's opening (before --drop) is quiet (calm intro, then the beat drops in)
Put the chosen offset and key into ads/<ad>.json -> music.{v|h}.offset / key."""
import argparse, warnings
import numpy as np, librosa
warnings.filterwarnings("ignore")
ap = argparse.ArgumentParser()
ap.add_argument("track"); ap.add_argument("--total", type=float, required=True); ap.add_argument("--logo", type=float, required=True)
ap.add_argument("--drop", type=float, default=None); ap.add_argument("--calm", action="store_true"); ap.add_argument("--top", type=int, default=4)
A = ap.parse_args()
y, sr = librosa.load(A.track, sr=22050, mono=True); dur = len(y) / sr
o = librosa.onset.onset_strength(y=y, sr=sr); tempo, beats = librosa.beat.beat_track(onset_envelope=o, sr=sr, units="time")
rms = librosa.feature.rms(y=y)[0]; t = librosa.times_like(rms, sr=sr); ot = librosa.times_like(o, sr=sr)
R = lambda a, b: float(rms[(t >= a) & (t < b)].mean()) if ((t >= a) & (t < b)).any() else 0.0
res = []
for b in beats:
    off = b - A.logo
    if off < -0.3 or off + A.total > dur + 1.0:
        continue
    hit = float(o[np.argmin(abs(ot - b))]) / (o.mean() + 1e-9)
    body = R(off + (A.drop or 0), off + A.logo)
    s = 0.5 * hit + body * 6
    rise = None
    if A.drop is not None:
        rise = R(off + A.drop, off + A.drop + 1.5) / (R(off + A.drop - 1.5, off + A.drop) + 1e-4)
        s += min(rise, 3)
        if A.calm:
            s -= R(off, off + A.drop) * 8
    res.append((round(s, 2), round(off, 3), None if rise is None else round(rise, 2), round(hit, 2), round(body, 3)))
res.sort(reverse=True)
names = "C C# D D# E F F# G G# A A# B".split()
maj = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
mnr = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
c = librosa.feature.chroma_cqt(y=y, sr=sr).mean(1)
keys = sorted(((round(float(np.corrcoef(np.roll(p, i), c)[0, 1]), 2), i, names[i], m) for p, m in ((maj, False), (mnr, True))
               for i in range(12)), reverse=True)[:2]
print(f"{A.track}: {dur:.1f}s, ~{float(np.atleast_1d(tempo)[0]):.0f} BPM")
print("key guesses (corr, root, name, minor):", keys, " -> weak (<0.5) means keep accents sparse / shared notes")
print("(score, offset, drop_rise, logo_hit, body_rms)")
for r in res[:A.top]:
    print(" ", r, " rms/s:", " ".join(f"{R(r[1] + s, r[1] + s + 1):.2f}" for s in range(int(A.total))))
