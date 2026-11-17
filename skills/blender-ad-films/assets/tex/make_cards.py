"""Google-style UI window cards (the ones that erupt from the laptop), rendered to PNG."""
import os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
CH = os.path.expanduser("~/.cache/puppeteer/chrome-headless-shell/mac_arm-151.0.7922.77/"
                        "chrome-headless-shell-mac-arm64/chrome-headless-shell")
B, R, Y, G = "#4285F4", "#EA4335", "#FBBC05", "#34A853"
CSS = """*{margin:0;padding:0;box-sizing:border-box}html,body{width:600px;height:%dpx;background:transparent;
font-family:-apple-system,Helvetica,Arial,sans-serif;overflow:hidden}
.w{position:absolute;inset:0;border-radius:36px;background:%s;overflow:hidden;padding:34px}
.top{display:flex;gap:10px;margin-bottom:26px}.dot{width:16px;height:16px;border-radius:50%%;background:rgba(0,0,0,.14)}
.ln{height:16px;border-radius:8px;background:rgba(0,0,0,.12);margin:14px 0}
"""
def page(h, bg, body):
    return f"<!doctype html><html><head><style>{CSS % (h, bg)}</style></head><body><div class='w'>{body}</div></body></html>"

TOP = "<div class='top'><div class='dot'></div><div class='dot'></div><div class='dot'></div></div>"
bars = lambda c, hs: "<div style='display:flex;align-items:flex-end;gap:22px;height:260px;margin-top:20px'>" + "".join(
    f"<div style='flex:1;height:{h}%;background:{c};border-radius:10px 10px 0 0'></div>" for h in hs) + "</div>"
grid = lambda c: ("<div style='position:absolute;inset:26px;border-radius:20px;background-color:" + c + ";"
                  "background-image:linear-gradient(rgba(255,255,255,.55) 3px,transparent 3px),linear-gradient(90deg,rgba(255,255,255,.55) 3px,transparent 3px);"
                  "background-size:34px 34px'></div>")
CARDS = {
    "c_bars_blue": (600, "#FFFFFF", TOP + "<div class='ln' style='width:40%'></div>" + bars(B, (40, 70, 55, 95, 65))),
    "c_bars_green": (600, "#EAF6EC", TOP + bars(G, (30, 55, 80, 45, 90, 60))),
    "c_line": (440, "#FFFFFF", TOP + "<svg width='532' height='260' viewBox='0 0 532 260'><path d='M0 220 L80 170 L150 190 L230 110 L300 140 L380 60 L460 90 L532 30' stroke='" + B + "' stroke-width='12' fill='none' stroke-linecap='round'/><path d='M0 220 L80 170 L150 190 L230 110 L300 140 L380 60 L460 90 L532 30 L532 260 L0 260Z' fill='" + B + "' opacity='.15'/></svg>"),
    "c_doc_red": (720, "#FFFFFF", "<div style='height:80px;margin:-34px -34px 30px;background:" + R + "'></div>" + "".join(f"<div class='ln' style='width:{w}%'></div>" for w in (80, 95, 70, 90, 60, 85, 75))),
    "c_photo": (520, "#FFFFFF", "<div style='height:340px;border-radius:22px;background:linear-gradient(#9CC3F5,#E4EFFB 60%,#7FB889 60%)'><svg width='532' height='340'><path d='M40 250 L180 110 L300 250Z' fill='#6E8FB8'/><path d='M220 250 L360 70 L500 250Z' fill='#5877A0'/><circle cx='440' cy='80' r='34' fill='" + Y + "'/></svg></div><div class='ln' style='width:60%;margin-top:24px'></div>"),
    "c_grid_red": (560, "#FDECEA", grid(R)),
    "c_grid_green": (560, "#E7F5EA", grid(G)),
    "c_grid_blue": (480, "#E8F0FE", grid(B)),
    "c_note_yellow": (600, "#FFE7A3", "".join(f"<div class='ln' style='width:{w}%;background:rgba(120,80,0,.18)'></div>" for w in (70, 90, 80, 55, 85))),
    "c_dots": (380, "#FFFFFF", TOP + "<div style='display:flex;gap:30px;margin-top:40px;justify-content:center'>" + "".join(f"<div style='width:74px;height:74px;border-radius:50%;background:{c}'></div>" for c in (R, B, G, Y)) + "</div>"),
    "c_pie": (600, "#FFFFFF", TOP + "<div style='width:300px;height:300px;margin:30px auto;border-radius:50%;background:conic-gradient(" + B + " 0 40%," + R + " 0 62%," + Y + " 0 80%," + G + " 0)'></div>"),
    "c_cal": (560, "#FFFFFF", "<div style='height:70px;margin:-34px -34px 24px;background:" + B + "'></div><div style='display:grid;grid-template-columns:repeat(5,1fr);gap:14px'>" + "".join(f"<div style='height:62px;border-radius:12px;background:{c}'></div>" for c in ["#E8F0FE"] * 6 + [Y] + ["#E8F0FE"] * 4 + [R] + ["#E8F0FE"] * 3) + "</div>"),
}
for name, (h, bg, body) in CARDS.items():
    html = os.path.join(HERE, f"_{name}.html")
    open(html, "w").write(page(h, bg, body))
    subprocess.run([CH, "--headless", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
                    "--force-device-scale-factor=1.5", f"--window-size=600,{h}", f"--screenshot={os.path.join(HERE, name + '.png')}",
                    "file://" + html], check=True, capture_output=True)
print("cards:", len(CARDS))
