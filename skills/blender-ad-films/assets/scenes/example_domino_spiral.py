"""Shot 6 (2.6 s = 62 f), reference 15.0-17.6 s: an S-curved line of Google window cards stands like dominoes on a
high-key white floor striped by window light. A toppling wave runs along the line toward camera while clay toys float
by; the camera pushes and trucks right along the line, then whips out in the last frames."""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from base import (reset, render_settings, key, mat_principled, mat_image, assign, smooth, slab, pill, ring,
                  dimple_ball, rounded_box, render_shot, lin, TEX)
import desk_world as dw

random.seed(6)
NF = 62
ROLL0 = float(os.environ.get('ROLL0', '0'))
reset()
render_settings(1920, 1080)
sc = bpy.context.scene
sc.view_settings.view_transform = "Khronos PBR Neutral"
sc.view_settings.look = "None"
sc.view_settings.exposure = 0.0
dw.world_fill(color=(0.9, 0.91, 0.95), strength=1.0)

# ---------------- light: warm key from front-left + big soft fill (cards read high key and saturated)
bpy.ops.object.light_add(type="SUN")
sun = bpy.context.active_object
sun.data.energy = 3.0; sun.data.color = (1.0, 0.95, 0.88); sun.data.angle = math.radians(6.0)
sun.rotation_euler = (math.radians(55), 0, math.radians(-150))
bpy.ops.object.light_add(type="AREA", location=(-3.0, -3, 4.0))
fill = bpy.context.active_object; fill.data.energy = 700; fill.data.size = 8; fill.data.color = (0.95, 0.96, 1.0)
fill.rotation_euler = (Vector((0.5, 6, 0.8)) - fill.location).to_track_quat("-Z", "Y").to_euler()

# backdrop: far white wall with soft diagonal window stripes (emissive so its value is exact)
WALL_Y = 45.0
bpy.ops.mesh.primitive_plane_add(size=1, location=(8, WALL_Y, 10), rotation=(math.radians(90), 0, 0))
wall = bpy.context.active_object; wall.scale = (400, 250, 1); bpy.ops.object.transform_apply(scale=True)
wm = bpy.data.materials.new("wall_m"); wm.use_nodes = True; nt = wm.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
out = nt.nodes.new("ShaderNodeOutputMaterial"); em = nt.nodes.new("ShaderNodeEmission")
tco = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"
mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 2 * math.pi / 7.0
sin_ = nt.nodes.new("ShaderNodeMath"); sin_.operation = "SINE"
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = (0.84, 0.84, 0.855, 1)
ramp.color_ramp.elements[1].position = 0.6; ramp.color_ramp.elements[1].color = (0.93, 0.93, 0.93, 1)
mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs[1].default_value = -1; mr.inputs[2].default_value = 1
nt.links.new(tco.outputs["Generated"] if False else tco.outputs["Object"], sep.inputs[0])
nt.links.new(sep.outputs[0], add.inputs[0]); nt.links.new(sep.outputs[2], add.inputs[1])
nt.links.new(add.outputs[0], mul.inputs[0]); nt.links.new(mul.outputs[0], sin_.inputs[0])
nt.links.new(sin_.outputs[0], mr.inputs[0]); nt.links.new(mr.outputs[0], ramp.inputs[0])
nt.links.new(ramp.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0])
assign(wall, wm)
wall.visible_diffuse = False; wall.visible_glossy = False; wall.visible_shadow = False

# ---------------- the S path in 3D (the far end climbs away like a ramp), index 0 = nearest camera
CTRL = [(-1.6, 2.9, 0), (-0.9, 4.4, 0), (0.15, 6.6, 0.05), (1.0, 9.3, 0.5), (1.5, 11.8, 1.1), (2.3, 14.5, 2.4),
        (3.3, 18, 4.3), (5, 22, 6.5), (7, 26, 8.6), (9, 30, 10)]


def catmull(pts, n=40):
    out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = (Vector(P[j]) for j in (i - 1, i, i + 1, i + 2))
        for s in range(n):
            t = s / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
                              (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(Vector(pts[-1]))
    return out


poly = catmull(CTRL)
cum = [0.0]
for a, b in zip(poly, poly[1:]):
    cum.append(cum[-1] + (b - a).length)


def at(s):
    for i in range(1, len(cum)):
        if cum[i] >= s:
            f = (s - cum[i - 1]) / max(1e-6, cum[i] - cum[i - 1])
            p = poly[i - 1].lerp(poly[i], f)
            t = (poly[i] - poly[i - 1]).normalized()
            return p, t
    return poly[-1], (poly[-1] - poly[-2]).normalized()


# ---------------- card kinds: (texture, body colour, w, h)
T = lambda n: os.path.join(TEX, n)
KINDS = {
    "bred": ("p6_browser_red.png", "#E9564B", 1.25, 1.55),
    "bwhite": ("p6_browser_white.png", "#EEF0F3", 1.0, 1.3),
    "chart": ("p6_chart_blue.png", "#3D7BEA", 1.05, 1.35),
    "grid": ("p6_grid_blue.png", "#F4F6FA", 1.0, 1.3),
    "green": ("p6_green.png", "#34A853", 0.95, 1.25),
    "redbars": ("p6_redbars.png", "#F4F6FA", 0.95, 1.25),
    "orange": ("p6_orange.png", "#FFA95A", 0.95, 1.2),
    "redtop": ("p6_redtop.png", "#F6F6F6", 0.95, 1.2),
    "greentop": ("p6_greentop.png", "#F6F6F6", 0.95, 1.2),
    "sea": ("p6_photo_sea.png", "#F4F7FA", 1.1, 1.4),
    "car": ("p6_photo_car.png", "#F29A2E", 0.95, 0.95),
    "flower": ("p6_photo_flower.png", "#F6F6F6", 0.9, 1.1),
    "c_line": ("c_line.png", "#FFFFFF", 1.0, 0.75),
    "c_cal": ("c_cal.png", "#FFFFFF", 0.95, 0.9),
    "c_gridg": ("c_grid_green.png", "#E7F5EA", 0.95, 0.9),
    "c_gridr": ("c_grid_red.png", "#FDECEA", 0.95, 0.9),
    "c_dots": ("c_dots.png", "#FFFFFF", 1.0, 0.65),
    "c_pie": ("c_pie.png", "#FFFFFF", 0.95, 0.95),
    "c_doc": ("c_doc_red.png", "#FFFFFF", 0.85, 1.05),
    "c_note": ("c_note_yellow.png", "#FFE7A3", 0.9, 0.9),
    "c_bars": ("c_bars_blue.png", "#FFFFFF", 0.95, 0.95),
}
# sequence from the camera outwards (mirrors the reference ordering: red + white browsers, blue chart, grid,
# green, photo, car, blue ... then a long mixed orange/white/green/red tail)
SEQ = ["bred", "bwhite", "chart", "bwhite", "grid", "redbars", "green", "sea", "car", "chart", "flower", "grid",
       "orange", "redtop", "c_line", "orange", "greentop", "c_gridr", "orange", "bwhite", "c_cal", "redtop", "orange",
       "c_gridg", "greentop", "c_dots", "orange", "redtop", "c_pie", "greentop", "orange", "c_doc", "redtop", "c_note",
       "greentop", "orange", "c_bars", "redtop", "orange", "greentop", "c_gridr", "orange"]
mats = {}


def card_mats(kind):
    if kind not in mats:
        tex, body, w, h = KINDS[kind]
        mb = mat_principled("body_" + kind, body, rough=0.3, coat=0.5)
        md = mat_image("face_" + kind, T(tex), rough=0.3)
        mats[kind] = (mb, md)
    return mats[kind]


LEAN = 30.0          # resting lean (deg) toward camera once toppled
DUR = 7              # frames for one card to fall
STEP = 2.6           # frames between neighbours (wave speed)
HIT0 = 50            # frame the wave starts pushing card 0 (nearest)
cards = []
s = 0.0
for i, kind in enumerate(SEQ):
    tex, body, w, h = KINDS[kind]
    grow = 1.0 + max(0.0, s - 9.0) * 0.07          # far cards grow so the tail stays readable
    sc_ = (1.0 if i > 3 else 1.0 + (3 - i) * 0.06) * grow
    w, h = w * sc_, h * sc_
    p, tan = at(s)
    heading = math.atan2(-tan.x, max(0.2, tan.y))
    if kind == "car":
        p = p + Vector((0.55, -0.35, -0.35)); heading -= math.radians(30)
    bpy.ops.object.empty_add(location=(p.x, p.y, p.z)); piv = bpy.context.active_object; piv.name = f"piv{i:02d}"
    t = 0.075
    body_o = slab(f"card{i:02d}", w, h, t, corner=min(w, h) * 0.1, edge=0.02)
    mb, md = card_mats(kind)
    assign(body_o, mb)
    body_o.parent = piv
    body_o.rotation_euler = (math.radians(90), 0, 0)          # face (+Z) now points at -Y = toward camera
    body_o.location = (0, 0, h / 2)
    bpy.ops.mesh.primitive_plane_add(size=1)
    face = bpy.context.active_object; face.name = f"face{i:02d}"
    face.scale = (w * 0.985, h * 0.985, 1); bpy.ops.object.transform_apply(scale=True)
    assign(face, md); face.parent = body_o; face.location = (0, 0, t / 2 + 0.003)
    face.visible_shadow = False
    jitter = random.uniform(-4, 4)
    # wave runs toward camera: slow near the lens (ref: card 4 already down at f1, card 0 hit ~f46)
    hit = 46 - 11 * i if i < 5 else -9 - STEP * (i - 5)
    dur = DUR * (2.0 if i < 5 else 1.0)
    lean_end = LEAN + random.uniform(-4, 4)
    yaw = math.degrees(heading) + jitter + 22.0 * max(0.0, 1 - i / 14)   # near faces turned toward lens
    # upright -> falls over DUR frames with a small settle bounce
    # cheat the fall toward screen-left (reads like the reference) with a little toward the lens
    fx, fy = 0.35, -0.9
    key(piv, int(round(hit)) - 1, rot=(random.uniform(-1, 1), 0, yaw))
    key(piv, int(round(hit + dur * 0.8)), rot=((lean_end + 5) * fx, (lean_end + 5) * fy, yaw))
    key(piv, int(round(hit + dur * 1.4)), rot=((lean_end - 1.5) * fx, (lean_end - 1.5) * fy, yaw))
    key(piv, int(round(hit + dur * 2.0)), rot=(lean_end * fx, lean_end * fy, yaw))
    cards.append(piv)
    s += (0.62 if i < 10 else 0.55) * grow
    if s > cum[-1]:
        break

# ---------------- clay toys
clay = lambda n, c: mat_principled(n, c, rough=0.42, sss=0.06, coat=0.2)


def holed_cube(name, size, color):
    o = rounded_box(name, (size, size, size), size * 0.18, segments=8)
    for ax in ((0, 0, 0), (90, 0, 0), (0, 90, 0)):
        bpy.ops.mesh.primitive_cylinder_add(radius=size * 0.2, depth=size * 1.4, vertices=48,
                                            rotation=tuple(math.radians(a) for a in ax))
        c = bpy.context.active_object; c.hide_render = True; c.hide_viewport = True
        bo = o.modifiers.new("hole", "BOOLEAN"); bo.object = c; bo.operation = "DIFFERENCE"
        c.parent = o
    assign(o, clay(name + "_m", color))
    return o


def nub_pill(name, length, radius, color):
    o = rounded_box(name, (radius * 2, radius * 2, length), radius * 0.95, segments=10)
    m = clay(name + "_m", color); assign(o, m)
    for a in range(16):
        for z in range(10):
            ang = 2 * math.pi * (a + 0.5 * (z % 2)) / 16
            bpy.ops.mesh.primitive_uv_sphere_add(radius=radius * 0.12, segments=12, ring_count=8,
                                                 location=(radius * 0.97 * math.cos(ang), radius * 0.97 * math.sin(ang),
                                                           -length * 0.36 + z * length * 0.08))
            n = bpy.context.active_object; smooth(n); assign(n, m); n.parent = o
    return o


def plus3d(name, size, color):
    bpy.ops.object.empty_add(); root = bpy.context.active_object; root.name = name
    m = clay(name + "_m", color)
    for r in ((0, 90, 0), (90, 0, 0)):
        p = pill(name + str(r[0]), length=size, radius=size * 0.17, color=color, rot=tuple(math.radians(a) for a in r))
        assign(p, m); p.parent = root
    return root


def cursor(name, size, color):
    bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=size, radius2=size, depth=size * 0.3)
    o = bpy.context.active_object; o.name = name
    o.scale = (1, 0.72, 1); bpy.ops.object.transform_apply(scale=True)
    bv = o.modifiers.new("b", "BEVEL"); bv.width = size * 0.12; bv.segments = 8
    smooth(o); assign(o, clay(name + "_m", color))
    return o


toys = {
    "cube": holed_cube("t_cube", 0.42, dw.G_RED),
    "cube2": holed_cube("t_cube2", 0.4, dw.G_RED),
    "pill": nub_pill("t_pill", 0.8, 0.13, dw.G_BLUE),
    "plus": plus3d("t_plus", 0.34, "#F7B84A"),
    "ball": dimple_ball("t_ball", 0.13, dw.G_GRN),
    "cursor": cursor("t_cursor", 0.11, "#4A86F0"),
    "disc": dimple_ball("t_disc", 0.16, "#3F7BEA"),
    "ring": ring("t_ring", major=0.1, minor=0.035, color=dw.G_RED),
}
toys["disc"].scale = (1, 1, 0.38)
C30 = Vector((0.1, 0.9, 1.45))


def scr(x, y, d):
    """screen point (0..1, y down) at depth d from the frame-30 camera -> world position."""
    return (C30.x + (x - 0.5) / 0.833 * d, C30.y + d, C30.z - (y - 0.5) * d / 1.48)


# name: [(frame, (sx, sy, depth), rot)] -- slow drift + tumble; toys enter as the camera pushes in
TOY_KEYS = {
    "cube":   [(1, (0.88, 0.92, 3.0), (20, 10, 30)), (NF, (0.8, 1.35, 3.0), (40, 30, 80))],
    "cube2":  [(1, (-0.35, 0.62, 3.2), (15, -20, 20)), (NF, (0.05, 0.42, 3.2), (35, -5, 60))],
    "pill":   [(1, (0.84, 0.46, 3.8), (78, 0, -70)), (NF, (0.9, 0.3, 3.8), (84, 10, -64))],
    "plus":   [(1, (0.8, 0.8, 3.5), (70, 20, 10)), (NF, (0.74, 0.55, 3.5), (95, 45, 60))],
    "cursor": [(1, (0.66, 0.66, 4.5), (60, 0, 20)), (NF, (0.56, 0.38, 4.5), (85, 45, 80))],
    "ball":   [(1, (0.45, -0.25, 6.0), (0, 0, 0)), (NF, (0.5, 0.05, 6.0), (30, 40, 0))],
    "ring":   [(1, (1.2, 0.2, 5.0), (60, 30, 0)), (NF, (0.96, 0.08, 5.0), (75, 70, 20))],
    "disc":   [(1, (-0.45, 0.0, 3.5), (70, 10, 0)), (NF, (0.08, 0.12, 3.5), (85, 45, 40))],
}
for n, ks in TOY_KEYS.items():
    for f, sp, rot in ks:
        key(toys[n], f, loc=scr(*sp), rot=rot, interp="LINEAR")

# ---------------- camera: Track-To aim empty; push + truck right along the line, whip out at the end
bpy.ops.object.empty_add(); crig = bpy.context.active_object; crig.name = "cam_rig"
bpy.ops.object.camera_add(); cam = bpy.context.active_object; sc.camera = cam
cam.parent = crig; cam.location = (0, 0, 0)
cam.data.lens = 30; cam.data.sensor_width = 36
bpy.ops.object.empty_add(); aim = bpy.context.active_object; aim.name = "aim"
tt = crig.constraints.new("TRACK_TO"); tt.target = aim; tt.track_axis = "TRACK_NEGATIVE_Z"; tt.up_axis = "UP_Y"
cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 1.3
bpy.ops.object.empty_add(); foc = bpy.context.active_object; foc.name = "focus"
cam.data.dof.focus_object = foc
fp = cards[7].location
key(foc, 1, loc=(fp.x, fp.y, 0.6)); key(foc, NF, loc=(fp.x, fp.y, 0.6))

# (frame, rig loc, aim, roll deg): push + truck right along the line while the dutch angle deepens
CAM = [(1, (0.0, 0.0, 1.5), (0.0, 10.0, 1.3), ROLL0),
       (30, tuple(C30), (-0.4, 10.9, 0.9), ROLL0),
       (56, (0.4, 2.0, 1.35), (-1.2, 12.0, 0.6), ROLL0)]
for f, l, a, r in CAM:
    key(crig, f, loc=l); key(aim, f, loc=a); key(cam, f, rot=(0, 0, r))
# whip: aim snaps hard right over the last frames (ease-in, no settle; next shot picks up the motion)
key(crig, NF, loc=(0.46, 2.2, 1.34), interp="LINEAR")
key(aim, 57, loc=(-1.2, 12.1, 0.6))
key(aim, NF, loc=(7.5, 12.0, 4.0))
key(cam, NF, rot=(0, 0, ROLL0 - 8))
# longer shutter on the whip so it smears into streaks
sc.render.motion_blur_shutter = 0.35
sc.render.keyframe_insert("motion_blur_shutter", frame=56)
sc.render.motion_blur_shutter = 1.0
sc.render.keyframe_insert("motion_blur_shutter", frame=59)

if os.environ.get("DRY"):
    from bpy_extras.object_utils import world_to_camera_view
    for f in (1, 30, 56):
        sc.frame_set(f)
        row = []
        for i in (0, 1, 3, 7, 10, 14, 20, 28, len(cards) - 1):
            c = cards[i].matrix_world @ Vector((0, 0, 0.6))
            v = world_to_camera_view(sc, cam, c)
            row.append(f"{i}:({v.x:.2f},{1 - v.y:.2f},{v.z:.1f})")
        print("DRY", f, " ".join(row), "n=", len(cards))
    raise SystemExit
render_shot("sh06_dominoes", NF)
