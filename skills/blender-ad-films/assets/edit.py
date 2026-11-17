"""Cut the Gemini recreation to the reference's timing, place every SFX on its frame, mix with the music.

usage: python3 edit.py [--preview] [--ref-audio]
  --preview    use renders/prev_* (960x540)
  --ref-audio  private comparison cut: lay the ORIGINAL reel's audio instead of our mix (never publish)
"""
import os, sys, json, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
PREVIEW = "--preview" in sys.argv
REF_AUDIO = "--ref-audio" in sys.argv
FPS = 24
W, H = (960, 540) if PREVIEW else (1920, 1080)
pre = "prev_" if PREVIEW else ""
OUT = os.path.join(ROOT, "out"); os.makedirs(OUT, exist_ok=True)
SRC_REEL = "/path/to/reference.mp4"

# (shot render dir, first frame, frame count) — back to back, matching the reference cut points
EDL = [
    ("sh01_desk_burst", 1, 144),   # 0.000  desk -> burst -> fly into cards
    ("sh03_star", 1, 60),          # 6.000  sparkle -> jelly star
    ("sh03b_button", 1, 19),       # 8.500  star in the glass button
    ("sh04_prompt", 3, 72),        # 9.292  typing + tile wall (ref cut lands on its f3)
    ("sh05_scroll", 1, 65),        # 12.292 Gemini panel, paper scroll, ribbons
    ("sh06_dominoes", 1, 62),      # 15.000 domino spiral + whip out
    ("sh07_window", 1, 89),        # 17.583 whip in, glass window, layers -> result (ref cut-out at its f90)
    ("sh08_pullback", 1, 94),      # 21.292 laptop close-up -> pull back -> hold on the desk
]
END_CARD = os.path.join(OUT, "sh09_endcard.mp4")   # 25.125 -> 28.375 (3.25 s)

starts, firsts, t = {}, {}, 0.0
for name, first, n in EDL:
    starts[name] = t
    firsts[name] = first
    t += n / FPS
starts["end"] = t
TOTAL = t + 3.25


def run(cmd):
    subprocess.run(cmd, check=True)


# ---------- picture ----------
parts = []
for i, (shot, first, n) in enumerate(EDL):
    d = os.path.join(ROOT, "renders", pre + shot)
    dst = os.path.join(OUT, f"part{i:02d}.mp4")
    if not os.path.isdir(d) or len(os.listdir(d)) < n:
        print(f"MISSING {shot}: {len(os.listdir(d)) if os.path.isdir(d) else 0}/{n} frames -> grey slate")
        run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c=0x888888:s={W}x{H}:r={FPS}:d={n / FPS}",
             "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", dst])
    else:
        run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-start_number", str(first),
             "-i", os.path.join(d, "%04d.png"), "-frames:v", str(n),
             "-vf", f"scale={W}:{H}:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-crf", "12", dst])
    parts.append(dst)
endp = os.path.join(OUT, "part_end.mp4")
run(["ffmpeg", "-y", "-loglevel", "error", "-i", END_CARD, "-vf", f"scale={W}:{H},fps={FPS},format=yuv420p",
     "-c:v", "libx264", "-crf", "12", endp])
parts.append(endp)
lst = os.path.join(OUT, "parts.txt")
open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
pic = os.path.join(OUT, "picture.mp4")
run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", pic])

# ---------- sound ----------
S = os.path.join(ROOT, "sfx")
ONSET = {l.split()[0]: float(l.split()[2]) for l in open(os.path.join(S, "onsets.txt"))}
cues = []  # (absolute seconds of the visual hit, sfx name, volume)


def at(shot, frame, name, vol=0.5, lead=0.0):
    """Cue `name` so its audible onset (or `lead` s before its peak) lands on `frame` of `shot`."""
    t_hit = starts[shot] + (frame - firsts[shot]) / FPS
    cues.append((t_hit - ONSET.get(name, 0.0) - lead, name, vol))


# shot 1: cards erupt (f34-54), the camera rockets in, fly-through peaks on the cut
at("sh01_desk_burst", 33, "whoosh_short", 0.35)
for k, f in enumerate(range(35, 56, 3)):
    at("sh01_desk_burst", f, "pop", 0.28 + 0.03 * (k % 3))
at("sh01_desk_burst", 46, "paper_crinkle", 0.25)
at("sh01_desk_burst", 144, "fly_through", 0.6, lead=2.1)
# shot 3: sparkle appears, lines draw, star lifts
at("sh03_star", 3, "sparkle_rise", 0.4, lead=0.0)
at("sh03_star", 36, "swish", 0.35)
# 3b: glass button
at("sh03b_button", 1, "chime_up", 0.3)
# shot 4: whip-in, a keystroke per typed character, send click, cards rain down, pull back
TYPE = json.load(open(os.path.join(ROOT, "tex", "p4_type.json")))["chars"]
prev = 0
for f in range(3, 75):
    c = TYPE[str(f)]
    if c > prev:
        at("sh04_prompt", f, "key", 0.32 + 0.06 * (f % 3))
    prev = c
at("sh04_prompt", 3, "swipe", 0.3)
at("sh04_prompt", 41, "click", 0.55)
at("sh04_prompt", 42, "chime_up", 0.22)
for k, f in enumerate((44, 46, 47, 49, 50, 52, 53, 55)):
    at("sh04_prompt", f, "swish_thud" if k % 2 else "pop", 0.3)
at("sh04_prompt", 55, "whoosh", 0.3)
# shot 5: paper scroll unrolls, answer types in, ribbons sweep
at("sh05_scroll", 1, "paper_turn", 0.5)
at("sh05_scroll", 6, "paper_crinkle", 0.35)
at("sh05_scroll", 3, "whoosh_short", 0.3)
at("sh05_scroll", 18, "typing", 0.22)
at("sh05_scroll", 40, "typing", 0.2)
at("sh05_scroll", 30, "swish", 0.25)
# shot 6: dominoes clatter as the wave runs toward camera, then the whip
at("sh06_dominoes", 1, "domino_rattle", 0.35)
for f in range(4, 55, 3):
    at("sh06_dominoes", f, "click", 0.2 + 0.05 * (f % 2))
at("sh06_dominoes", 30, "domino_rattle", 0.3)
at("sh06_dominoes", 55, "swish", 0.5)
at("sh06_dominoes", 57, "whoosh_short", 0.45)
# shot 7: layers stack up (pops), unfold (sparkle rise), border glow (chime), pull back out
for f in (10, 14, 18, 22, 26, 30):
    at("sh07_window", f, "pop", 0.3)
at("sh07_window", 34, "sparkle_rise", 0.35)
at("sh07_window", 36, "swish", 0.3)
at("sh07_window", 58, "chime_soft", 0.3)
at("sh07_window", 84, "whoosh", 0.35)
# shot 8: pull back
at("sh08_pullback", 6, "whoosh", 0.3)
# end card: swell into the logo, sting on the star, click on the G
cues.append((starts["end"] - 2.4, "swell", 0.25))
at_end = starts["end"]
cues.append((at_end + 0.02 - ONSET["logo_sting"], "logo_sting", 0.5))
cues.append((at_end + 1.75 - ONSET["pop"], "pop", 0.35))

mix = os.path.join(OUT, "mix.wav")
if REF_AUDIO:
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "6.5", "-t", f"{TOTAL}", "-i", SRC_REEL, "-vn", "-ar", "48000", mix])
else:
    music = os.path.join(ROOT, "music", "track.wav")
    inputs = ["-i", music]
    fc = [f"[0]atrim=0:{TOTAL},afade=t=in:d=0.3,afade=t=out:st={TOTAL - 1.6}:d=1.6,volume=0.62[m]"]
    labels = ["[m]"]
    for i, (tc, name, vol) in enumerate(sorted(cues)):
        inputs += ["-i", os.path.join(S, name + ".wav")]
        d = max(0, int(tc * 1000))
        fc.append(f"[{i + 1}]aformat=channel_layouts=stereo:sample_rates=48000,volume={vol},adelay={d}|{d}[s{i}]")
        labels.append(f"[s{i}]")
    fc.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.0:LRA=10[a]")
    run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(fc), "-map", "[a]", "-ar", "48000", mix])

tag = ("-preview" if PREVIEW else "") + ("-REFAUDIO-private" if REF_AUDIO else "")
final = os.path.join(OUT, f"gemini-recreation{tag}.mp4")
run(["ffmpeg", "-y", "-loglevel", "error", "-i", pic, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
     "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", final])
print("FINAL", final, f"{TOTAL:.2f}s", f"{len(cues)} sfx cues")
