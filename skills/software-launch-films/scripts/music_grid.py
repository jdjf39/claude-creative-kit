#!/usr/bin/env python3
"""BPM, beat/bar grid, drop and strong hits of a track. Needs librosa (use ~/.venvs/score/bin/python on the author's Mac).
  music_grid.py track.wav [--bars 4]"""
import sys, numpy as np, librosa
f = sys.argv[1]; per_bar = int(sys.argv[sys.argv.index("--bars") + 1]) if "--bars" in sys.argv else 4
y, sr = librosa.load(f, sr=44100)
t, b = librosa.beat.beat_track(y=y, sr=sr); bt = librosa.frames_to_time(b, sr=sr); n = np.arange(len(bt)); p = np.polyfit(n, bt, 1)
print(f"duration {len(y)/sr:.2f}s  tempo {float(np.atleast_1d(t)[0]):.1f} BPM  beat {p[0]:.4f}s  phase {p[1]:.3f}s  bar(x{per_bar}) {p[0]*per_bar:.3f}s")
o = librosa.onset.onset_strength(y=y, sr=sr, hop_length=441); ot = librosa.times_like(o, sr=sr, hop_length=441)
on = librosa.onset.onset_detect(onset_envelope=o, sr=sr, hop_length=441, units="time")
print("strong hits:", [round(float(x), 2) for x in on if o[np.argmin(abs(ot - x))] > np.percentile(o, 96)])
r = librosa.feature.rms(y=y, hop_length=4410)[0]; db = 20 * np.log10(r + 1e-9)
print("loudness per 0.5 s:", [int(db[i:i + 5].mean()) for i in range(0, len(db), 5)])
jump = np.diff(np.convolve(db, np.ones(5) / 5, "same")); k = int(np.argmax(jump)); print(f"biggest rise (drop candidate) near {k * 0.1:.2f}s")
