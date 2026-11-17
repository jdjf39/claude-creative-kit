"""Mix template (from the Acme Console film): one music track from 0, SFX cues placed on their attack, the approved Acme logo-drop recipe, stems balanced, master -14 LUFS, optional mux.
Edit MUS, END, the cue list and LOGO. Run with ~/.venvs/score/bin/python mix_template.py [render.mp4 out.mp4]."""
import os, subprocess, sys, tempfile
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, sosfiltfilt

H = os.path.dirname(os.path.abspath(__file__)); SR = 48000; END = 21.77; N = int(END * SR); t = np.arange(N) / SR
tmp = tempfile.mkdtemp()
KIT = os.environ.get("SFX_KIT", "./sfx/"); SIG = os.environ.get("SFX_SIG", "./sfx/")
ATT = {l.split()[0]: float(l.split()[2]) for l in open(KIT + "onsets.txt") if l.strip()}
def load(p):
    z, _ = librosa.load(p, sr=SR, mono=False); z = np.atleast_2d(z)
    return (np.repeat(z, 2, 0) if z.shape[0] == 1 else z[:2]).T
def lufs(z):
    p = tmp + "/m.wav"; sf.write(p, z, SR)
    r = subprocess.run(["ffmpeg", "-i", p, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float([l for l in r.splitlines() if l.strip().startswith("I:")][-1].split()[1])
def place(buf, z, at, g=1.0):
    i0 = int(round(at * SR)); a = max(0, -i0); i0 = max(0, i0); b = min(N, i0 + len(z) - a)
    if b > i0: buf[i0:b] += z[a:a + b - i0] * g
C = {}
def kit(n): C.setdefault(n, load(KIT + n + ".wav")); return C[n]
def cue(buf, n, at, g): place(buf, kit(n), at - ATT.get(n, 0.0), g)

MUS = os.environ.get("MUSIC", "./music/track.wav")
mus = load(MUS)[:N]; mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))
mus *= np.clip((END - 0.05 - t) / 0.9, 0, 1)[:, None]

fx = np.zeros((N, 2))
cue(fx, "swell", 0.05, 0.25)                                        # sun on the desk
for i in range(7): cue(fx, "key", 1.95 + i * 0.1, 0.22)            # dial ratchet
cue(fx, "chime_soft", 2.68, 0.4); cue(fx, "blip", 2.9, 0.2)        # the screen wakes, listening
cue(fx, "whoosh_short", 3.77, 0.45)                                # float
cue(fx, "swish", 4.2, 0.25); cue(fx, "sparkle_rise", 4.6, 0.15)   # the glass ring passes
cue(fx, "swipe", 6.05, 0.45)                                       # the light wave across the keys
for i in range(8): cue(fx, "click", 6.15 + i * 0.13, 0.16)         # keys dip as it passes
cue(fx, "notify", 8.0, 0.4); cue(fx, "buzz", 8.62, 0.3)            # Maya drops, missed the trial ask
for i in range(12): cue(fx, "key", 9.95 + i * 0.055, 0.2)          # the dial turns at night
cue(fx, "chime_up", 10.68, 0.45)                                   # drill assigned
rng = np.random.default_rng(3)
for i in range(33): cue(fx, "key", 11.31 + i * 0.03 + rng.uniform(0, 0.02), 0.13 + rng.uniform(0, 0.08))   # every keycap lifts off
cue(fx, "whoosh", 12.76, 0.4); cue(fx, "chime_up", 13.89, 0.45)   # the team; Maya flips lime
cue(fx, "whoosh_thud", 15.42, 0.5); cue(fx, "swell", 15.6, 0.3)    # the explode
fx *= 10 ** ((-23 - lufs(fx)) / 20)

end_ = np.zeros((N, 2)); LOGO = 18.76 + 0.38
sz = load(SIG + "sting_b.mp3")
so = librosa.onset.onset_strength(y=sz.mean(1), sr=SR, hop_length=512); s_hit = float(np.argmax(so)) * 512 / SR
lp = sosfiltfilt(butter(6, 700, "low", fs=SR, output="sos"), sz, axis=0)
xf = np.clip((np.arange(len(sz)) / SR - (s_hit - 0.08)) / 0.06, 0, 1)[:, None]; sz = lp * (1 - xf) + sz * xf
place(end_, sz, LOGO - s_hit, 0.8)
def at_peak(z, at, g):
    k = np.argmax(librosa.onset.onset_strength(y=z.mean(1), sr=SR, hop_length=512)); place(end_, z, at - k * 512 / SR, g)
at_peak(load(SIG + "logo_hit_b.mp3"), LOGO, 1.0); at_peak(load(SIG + "logo_hit_a.mp3"), LOGO, 0.6)
cue(end_, "swish", 19.1, 0.35); cue(end_, "click", 19.55, 0.3); cue(end_, "click", 19.8, 0.25)
end_ *= 10 ** ((-16 - lufs(end_)) / 20)

mus *= 10 ** ((-16.5 - lufs(mus)) / 20)
mix = mus + fx + end_
mix *= 10 ** ((-14 - lufs(mix)) / 20)
if np.abs(mix).max() > 0.98: mix = np.tanh(mix / 0.95) * 0.95
os.makedirs(H + "/music", exist_ok=True); sf.write(H + "/music/mix.wav", mix.astype(np.float32), SR)
print("mix", round(lufs(mix), 1), "LUFS")
if len(sys.argv) > 2:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", sys.argv[1], "-i", H + "/music/mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "17",
                    "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-t", str(END), sys.argv[2]], check=True)
    print("wrote", sys.argv[2])
