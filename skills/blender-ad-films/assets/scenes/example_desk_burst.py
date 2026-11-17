"""Shots 1+2 (6.0 s @ 24 fps = 144 f), matched to the reference's 0.0-6.0 s:
0-2 s desk wide, slow push | 2-3.25 s windows erupt from the laptop into a pile |
3.25-4.6 s pile drifts, camera keeps pushing | 4.6-6 s camera rockets into the pile, cards blast past."""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, Euler
from base import reset, render_settings, camera, key, cam_key, slab, assign, mat_principled, mat_image, render_shot, TEX
import desk_world as dw

reset()
render_settings(1920, 1080)
dw.grade(bpy.context.scene)
lap, scr = dw.build()
bpy.context.view_layer.update()
sc_c = scr.matrix_world.translation.copy()
sc_q = scr.matrix_world.to_quaternion()
sc_n = (sc_q @ Vector((0, 0, 1))).normalized()
if sc_n.y > 0:
    sc_n = -sc_n
right = Vector((1, 0, 0))
up = sc_n.cross(right).normalized()
if up.z < 0:
    up = -up
base_rot = sc_n.to_track_quat("Z", "Y").to_euler()

BODY = {"c_grid_red": "#E8453C", "c_grid_green": "#34A853", "c_grid_blue": "#4285F4", "c_note_yellow": "#FBBC05",
        "c_bars_green": "#34A853", "c_doc_red": "#EA4335", "c_cal": "#4285F4", "c_photo": "#4285F4",
        "c_bars_blue": "#4285F4", "c_line": "#FBBC05", "c_dots": "#EA4335", "c_pie": "#34A853"}

def card(name, tex, w):
    img = bpy.data.images.load(os.path.join(TEX, tex))
    h = w * img.size[1] / img.size[0]
    body = slab(name, w, h, 0.009, corner=w * 0.06, edge=0.003)   # thick, coloured edge like a paper stack
    assign(body, mat_principled(name + "_b", BODY.get(tex[:-4], "#FFFFFF"), rough=0.45, coat=0.3))
    bpy.ops.mesh.primitive_plane_add(size=1)
    f = bpy.context.active_object
    f.scale = (w * 0.998, h * 0.998, 1)
    bpy.ops.object.transform_apply(scale=True)
    assign(f, mat_image(name + "_f", os.path.join(TEX, tex), rough=0.35))
    f.parent = body
    f.location = (0, 0, 0.0046)
    f.visible_shadow = False
    return body

rng = random.Random(7)
texs = ["c_bars_blue", "c_grid_red", "c_doc_red", "c_photo", "c_grid_green", "c_line", "c_note_yellow", "c_dots",
        "c_bars_green", "c_grid_blue", "c_pie", "c_cal"]
N = 36
cards = []
for i in range(N):
    t = texs[i % len(texs)]
    w = rng.uniform(0.12, 0.18)
    c = card(f"card{i}", t + ".png", w)
    # pile slot in screen space (x right, y up, d toward camera)
    # dense collage over the laptop: a jittered grid, facing the camera
    col, row = i % 6, (i // 6) % 6
    sx = -0.19 + col * 0.076 + rng.uniform(-0.025, 0.025)
    sy = -0.09 + row * 0.052 + rng.uniform(-0.02, 0.02)
    d = 0.015 + rng.uniform(0, 0.07)
    tilt = Euler((math.radians(rng.uniform(-6, 6)), math.radians(rng.uniform(-7, 7)), math.radians(rng.uniform(-8, 8))))
    pile = sc_c + right * sx + up * sy + sc_n * d
    r_pile = tuple(math.degrees(a) for a in (base_rot.x + tilt.x, base_rot.y + tilt.y, base_rot.z + tilt.z))
    r0 = tuple(math.degrees(a) for a in base_rot)
    f_out = 34 + int(i * 0.55)                      # erupt 1.6 s .. 2.6 s, like the reference
    key(c, 1, loc=tuple(sc_c + sc_n * 0.003), rot=r0, scale=0.02)
    key(c, f_out, loc=tuple(sc_c + sc_n * 0.003), rot=r0, scale=0.02)
    key(c, f_out + 9, loc=tuple(pile + sc_n * 0.01), rot=r_pile, scale=1.06, interp="BEZIER")
    key(c, f_out + 14, loc=tuple(pile), rot=r_pile, scale=1.0)
    # gentle drift while the camera pushes
    drift = pile + Vector((rng.uniform(-0.01, 0.01), 0, rng.uniform(-0.006, 0.01))) + sc_n * 0.02
    r_drift = tuple(a + rng.uniform(-5, 5) for a in r_pile)
    key(c, 110, loc=tuple(drift), rot=r_drift, scale=1.0)
    # blast: outward from the centre and toward/past the camera
    # blast as the camera arrives: toward the lens and outward, so they fly past it
    out = (right * sx * 0.45 + up * (sy - 0.04) * 0.45) + sc_n * rng.uniform(0.2, 0.42)
    f_b = 118 + int(rng.uniform(0, 8))
    key(c, 110, loc=tuple(drift), rot=r_drift)
    key(c, f_b, loc=tuple(drift + sc_n * 0.01), rot=r_drift)
    key(c, 162, loc=tuple(drift + out), rot=tuple(a + rng.uniform(-50, 50) for a in r_drift), interp="LINEAR")
    cards.append(c)

cam = camera(loc=(0.05, dw.WALL_Y - 1.75, 0.95), target=(0.03, dw.WALL_Y, 0.84), lens=36, fstop=2.8, focus_obj=scr)
cam_key(cam, 1, (0.05, dw.WALL_Y - 1.75, 0.95), (0.03, dw.WALL_Y, 0.84))
cam_key(cam, 110, (0.035, dw.WALL_Y - 1.2, 0.93), (0.025, dw.WALL_Y, 0.87))
cam_key(cam, 144, tuple(sc_c + sc_n * 0.5 + up * 0.05), tuple(sc_c + up * 0.05))
# the rocket push needs a fast, linear-ish ending
for fc_owner in (cam,):
    ad = fc_owner.animation_data
render_shot("sh01_desk_burst", 144)
