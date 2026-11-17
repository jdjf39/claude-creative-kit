"""Shot 4 (3.1 s = 74 f), reference 9.2-12.3 s: near top-down tiled floor in venetian-blind light, a frosted
glass prompt bar types "Where should we start?", sends, and Google UI cards rain down around it while the camera
pulls back into a wall-to-wall mosaic.

Frame f <-> ref t = 9.2 + (f - 1) / 24. The reference cut actually lands at ~9.29 s (f3); f1-f2 are the whip-in.
"""
import sys, os, math, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
from base import (reset, render_settings, mat_principled, mat_image, assign, smooth, slab, render_shot, lin, TEX)
import desk_world as dw

random.seed(4)
reset()
render_settings(1920, 1080)
sc = bpy.context.scene
sc.cycles.use_auto_tile = True; sc.cycles.tile_size = 512   # lower GPU memory (shared machine)
dw.grade(sc)
sc.view_settings.exposure = float(os.environ.get("EXPO", "0.5"))
dw.world_fill(color=(0.5, 0.54, 1.0), strength=1.1)

NF = 74
TYPE = json.load(open(os.path.join(TEX, "p4_type.json")))


# ---------------------------------------------------------------- keyframe helper with explicit easing
def fcurves_of(obj):
    ad = obj.animation_data
    if not ad or not ad.action:
        return []
    try:
        return list(ad.action.fcurves)
    except AttributeError:
        out = []
        for layer in ad.action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    out.extend(cb.fcurves)
        return out


def k(obj, f, loc=None, rot=None, scale=None, interp="BEZIER", ease="AUTO"):
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert("location", frame=f)
    if rot is not None:
        obj.rotation_euler = tuple(math.radians(a) for a in rot)
        obj.keyframe_insert("rotation_euler", frame=f)
    if scale is not None:
        obj.scale = (scale,) * 3 if isinstance(scale, (int, float)) else scale
        obj.keyframe_insert("scale", frame=f)
    for fc in fcurves_of(obj):
        for kp in fc.keyframe_points:
            if abs(kp.co.x - f) < 1e-3:
                kp.interpolation = interp
                kp.easing = ease


def hide_from_camera(o):
    for a in ("visible_camera", "visible_glossy", "visible_diffuse", "visible_transmission"):
        setattr(o, a, False)


# ---------------------------------------------------------------- venetian-blind sun
s_dir = Vector((-0.42, 0.58, 0.70)).normalized()          # towards the sun: from upper-left-back
bpy.ops.object.light_add(type="SUN")
sun = bpy.context.active_object
sun.data.energy = float(os.environ.get("SUN", "8.0"))
sun.data.color = (1.0, 0.9, 0.78)
sun.data.angle = math.radians(4.0)
sun.rotation_euler = (-s_dir).to_track_quat("-Z", "Y").to_euler()

stripe = Vector((1, 1, 0)).normalized()      # stripe direction on the floor ("/" in frame)
n_fl = Vector((1, -1, 0)).normalized()
u = (stripe - s_dir * stripe.dot(s_dir)).normalized()       # slat long axis (projects exactly onto stripe)
w = s_dir.cross(u).normalized()
Pw = w - s_dir * (w.z / s_dir.z)
PERIOD = 0.42
pitch = PERIOD / abs(Pw.dot(n_fl))
D_OCC = 3.0
rot_m = Matrix((u, w, s_dir)).transposed()
slat_fracs = []
for i in range(-26, 27):
    width = 0.5 + 0.12 * math.sin(i * 1.7)          # irregular blind slats
    slat_fracs.append((i, width))
for i, wd in slat_fracs:
    bpy.ops.mesh.primitive_cube_add(size=1)
    b = bpy.context.active_object
    b.name = f"slat{i}"
    b.scale = (40, pitch * wd, 0.01)
    b.matrix_world = Matrix.Translation(s_dir * D_OCC + w * (i * pitch)) @ rot_m.to_4x4() @ Matrix.Diagonal((40, pitch * wd, 0.01, 1))
    hide_from_camera(b)

# ---------------------------------------------------------------- tiled floor (array of one pillowy tile)
T, GAP = 0.575, 0.010
groove = mat_principled("groove_m", "#CFD0E4", rough=0.7)
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -0.03))
assign(bpy.context.active_object, groove)
tile_m = mat_principled("tile_m", "#F1F1F7", rough=0.42, coat=0.25)
tile = slab("tile", T - GAP, T - GAP, 0.06, corner=0.03, edge=0.012)
tile.location = (-8 * T, -6 * T, -0.03)
arr = tile.modifiers.new("ax", "ARRAY"); arr.count = 17; arr.relative_offset_displace = (T / (T - GAP), 0, 0)
arr2 = tile.modifiers.new("ay", "ARRAY"); arr2.count = 13; arr2.relative_offset_displace = (0, T / (T - GAP), 0)
assign(tile, tile_m)
# little dimples at the groove crossings
dimple = mat_principled("dimple_m", "#D9DAEA", rough=0.4, coat=0.4)
for ix in range(-4, 5):
    for iy in range(-3, 4):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018, segments=16, ring_count=8,
                                             location=((ix + 0.5) * T, (iy + 0.5) * T, 0.0))
        o = bpy.context.active_object; o.scale.z = 0.4; smooth(o); assign(o, dimple)

# ---------------------------------------------------------------- the prompt bar
BAR_L, BAR_H, BAR_T = 1.86, 0.285, 0.085
Z0 = 0.004
glass = mat_principled("bar_glass", "#F2F3FC", rough=0.38, coat=1.0, transmission=0.35, sss=0.6, ior=1.25)
gb = glass.node_tree.nodes["Principled BSDF"]
gb.inputs["Subsurface Weight"].default_value = 0.0
bar = slab("bar", BAR_L, BAR_H, BAR_T, corner=BAR_H / 2 - 0.001, edge=0.035, segments=16)
bar.location = (0.02, 0, Z0 + BAR_T / 2)
assign(bar, glass)
# frosted core so the bar reads milky, not clear
core = slab("bar_core", BAR_L - 0.05, BAR_H - 0.05, BAR_T * 0.55, corner=BAR_H / 2 - 0.03, edge=0.02, segments=16)
core.location = (0.02, 0, Z0 + BAR_T * 0.4)
core_m = mat_principled("bar_core_m", "#F3F4FD", rough=0.6, sss=0.3)
assign(core, core_m)
TOP = Z0 + BAR_T

# icon bubble: glass dome on the left end holding the Gemini sparkle
BX = -0.80
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, segments=64, ring_count=32, location=(BX, 0, TOP - 0.035))
bub = bpy.context.active_object; bub.scale = (1, 1, 0.3); smooth(bub)
assign(bub, mat_principled("bubble_m", "#F7F8FF", rough=0.12, coat=1.0, transmission=0.45, sss=0.4, ior=1.2))
bpy.ops.mesh.primitive_cylinder_add(radius=0.155, depth=0.03, vertices=96, location=(BX, 0, TOP - 0.03))
rim = bpy.context.active_object; smooth(rim)
bv = rim.modifiers.new("b", "BEVEL"); bv.width = 0.012; bv.segments = 5
assign(rim, mat_principled("rim_m", "#F1F2FC", rough=0.25, coat=1.0, sss=0.4))


def sparkle_mesh(name, r=0.15, p=0.62, n=200, rings=18, h=0.07):
    def edge(a):
        c, s_ = math.cos(a), math.sin(a)
        return (r * math.copysign(abs(c) ** (2 / p), c), r * math.copysign(abs(s_) ** (2 / p), s_))
    bm = bmesh.new()
    top_c = bm.verts.new((0, 0, h)); bot_c = bm.verts.new((0, 0, -h))
    top, bot = [], []
    for ri in range(1, rings + 1):
        f = ri / rings
        z = h * math.sqrt(max(0.0, 1 - f * f)) + 0.0005
        rt, rb = [], []
        for kk in range(n):
            x, y = edge(2 * math.pi * kk / n)
            rt.append(bm.verts.new((x * f, y * f, z))); rb.append(bm.verts.new((x * f, y * f, -z)))
        top.append(rt); bot.append(rb)
    for kk in range(n):
        j = (kk + 1) % n
        bm.faces.new((top_c, top[0][kk], top[0][j])); bm.faces.new((bot_c, bot[0][j], bot[0][kk]))
        for ri in range(rings - 1):
            bm.faces.new((top[ri][kk], top[ri + 1][kk], top[ri + 1][j], top[ri][j]))
            bm.faces.new((bot[ri][j], bot[ri + 1][j], bot[ri + 1][kk], bot[ri][kk]))
        bm.faces.new((top[-1][kk], bot[-1][kk], bot[-1][j], top[-1][j]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); smooth(o)
    return o


star = sparkle_mesh("star", r=0.072, h=0.03)
star.location = (BX, 0, TOP + 0.012)
star.scale = (1, 1, 0.5)
star.rotation_euler = (0, 0, math.radians(0))
m = bpy.data.materials.new("star_m"); m.use_nodes = True; nt = m.node_tree
b = nt.nodes["Principled BSDF"]
tc = nt.nodes.new("ShaderNodeTexCoord"); grad = nt.nodes.new("ShaderNodeTexGradient"); grad.gradient_type = "RADIAL"
ramp = nt.nodes.new("ShaderNodeValToRGB"); cr = ramp.color_ramp
sat = [(0.0, "#2F6BFF"), (0.22, "#3F7BFF"), (0.4, "#FF3B30"), (0.55, "#FFB300"), (0.72, "#16C24A"), (1.0, "#2F6BFF")]
cr.elements[0].position, cr.elements[0].color = sat[0][0], lin(sat[0][1])
cr.elements[1].position, cr.elements[1].color = sat[-1][0], lin(sat[-1][1])
for pos, col in sat[1:-1]:
    e = cr.elements.new(pos); e.color = lin(col)
nt.links.new(tc.outputs["Object"], grad.inputs["Vector"]); nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
nt.links.new(ramp.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = 0.6
b.inputs["Roughness"].default_value = 0.15; b.inputs["Coat Weight"].default_value = 1.0
assign(star, m)

# send button
SX = 0.80
bpy.ops.mesh.primitive_cylinder_add(radius=0.078, depth=0.03, vertices=96, location=(SX, 0, TOP + 0.004))
btn = bpy.context.active_object; smooth(btn)
bv = btn.modifiers.new("b", "BEVEL"); bv.width = 0.013; bv.segments = 6
assign(btn, mat_principled("btn_m", "#4F7FEA", rough=0.22, coat=1.0, sss=0.15))
bpy.ops.mesh.primitive_plane_add(size=0.1, location=(0, 0, 0))
arrow = bpy.context.active_object
am = mat_image("arrow_m", os.path.join(TEX, "p4_arrow.png"))
ab = am.node_tree.nodes["Principled BSDF"]
ab.inputs["Emission Color"].default_value = (1, 1, 1, 1); ab.inputs["Emission Strength"].default_value = 0.6
assign(arrow, am)
bpy.ops.object.empty_add(location=(SX, 0, TOP + 0.02)); btn_root = bpy.context.active_object
btn.parent = btn_root; btn.location = (0, 0, -0.016)
arrow.parent = btn_root; arrow.location = (0, 0, 0.0012)
# press + arrow turns from up to right (sent) at ~10.85 s
k(btn_root, 36, scale=1.0); k(btn_root, 38, scale=(0.9, 0.9, 0.7)); k(btn_root, 41, scale=(1.06, 1.06, 1.0)); k(btn_root, 44, scale=1.0)
k(arrow, 1, rot=(0, 0, 0)); k(arrow, 38, rot=(0, 0, 0)); k(arrow, 42, rot=(0, 0, -96)); k(arrow, 45, rot=(0, 0, -90))

# typed text: frame-accurate image sequence decal on the bar top
TEXT_LEFT = -0.545
bpy.ops.mesh.primitive_plane_add(size=1, location=(TEXT_LEFT - 0.005 + 0.65, 0, TOP + 0.0015))
txt = bpy.context.active_object; txt.scale = (1.30, 0.12, 1)
tm = bpy.data.materials.new("type_m"); tm.use_nodes = True; tnt = tm.node_tree
tb = tnt.nodes["Principled BSDF"]
timg = tnt.nodes.new("ShaderNodeTexImage")
img = bpy.data.images.load(os.path.join(TEX, "p4_type", "0001.png"))
img.source = "SEQUENCE"
timg.image = img
timg.image_user.frame_duration = NF
timg.image_user.frame_start = 1
timg.image_user.frame_offset = 0
timg.image_user.use_auto_refresh = True
timg.interpolation = "Cubic"
tnt.links.new(timg.outputs["Color"], tb.inputs["Base Color"])
tnt.links.new(timg.outputs["Color"], tb.inputs["Emission Color"])
tnt.links.new(timg.outputs["Alpha"], tb.inputs["Alpha"])
tb.inputs["Emission Strength"].default_value = 0.5
tb.inputs["Roughness"].default_value = 1.0
tb.inputs["Coat Weight"].default_value = 0.0
assign(txt, tm)

# "sent" rainbow streak along the top edge of the bar
bpy.ops.mesh.primitive_cube_add(size=1)
streak = bpy.context.active_object
sm = bpy.data.materials.new("streak_m"); sm.use_nodes = True; snt = sm.node_tree
for nn in list(snt.nodes):
    snt.nodes.remove(nn)
so = snt.nodes.new("ShaderNodeOutputMaterial"); em = snt.nodes.new("ShaderNodeEmission")
tr = snt.nodes.new("ShaderNodeBsdfTransparent"); mx = snt.nodes.new("ShaderNodeMixShader")
stc = snt.nodes.new("ShaderNodeTexCoord"); sep = snt.nodes.new("ShaderNodeSeparateXYZ")
mr = snt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = -0.5; mr.inputs["From Max"].default_value = 0.5
sr = snt.nodes.new("ShaderNodeValToRGB"); c2 = sr.color_ramp
c2.elements[0].position, c2.elements[0].color = 0.0, lin("#34D86A")
c2.elements[1].position, c2.elements[1].color = 1.0, lin("#FF4A4A")
ee = c2.elements.new(0.55); ee.color = lin("#FFC23A")
snt.links.new(stc.outputs["Object"], sep.inputs[0]); snt.links.new(sep.outputs[0], mr.inputs[0])
snt.links.new(mr.outputs[0], sr.inputs[0]); snt.links.new(sr.outputs[0], em.inputs[0])
snt.links.new(tr.outputs[0], mx.inputs[1]); snt.links.new(em.outputs[0], mx.inputs[2]); snt.links.new(mx.outputs[0], so.inputs[0])
fac = mx.inputs[0]
for f, v in ((39, 0.0), (41, 1.0), (46, 0.7), (51, 0.0)):
    fac.default_value = v; fac.keyframe_insert("default_value", frame=f)
esf = em.inputs["Strength"]; esf.default_value = 2.2
assign(streak, sm)
for a in ("visible_diffuse", "visible_glossy", "visible_transmission", "visible_shadow"):
    setattr(streak, a, False)
Y_EDGE = BAR_H / 2 + 0.006
k(streak, 39, loc=(0.6, Y_EDGE, TOP - 0.01), scale=(0.3, 0.03, 0.004))
k(streak, 44, loc=(-0.45, Y_EDGE, TOP - 0.01), scale=(1.5, 0.03, 0.004))
k(streak, 51, loc=(-1.5, Y_EDGE, TOP - 0.01), scale=(1.2, 0.03, 0.004))

# ---------------------------------------------------------------- 3D triangle cursor
bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.042, radius2=0.0, depth=0.018)
cur = bpy.context.active_object
bv = cur.modifiers.new("b", "BEVEL"); bv.width = 0.006; bv.segments = 4
smooth(cur)
cm = mat_principled("cursor_m", "#6F97F2", rough=0.2, coat=1.0, transmission=0.55, sss=0.2)
assign(cur, cm)
end_m = {int(kk): v for kk, v in TYPE["end_m"].items()}
def text_end(f):
    return TEXT_LEFT + end_m[f]
CZ = TOP + 0.12
# cut-in: cursor sits above the bubble, then chases the caret (lagging slightly), then goes to send and clicks
k(cur, 1, loc=(BX + 0.12, 0.13, CZ), rot=(18, -12, 20))
for f in range(5, 31, 4):
    k(cur, f, loc=(text_end(max(1, f - 2)) + 0.03, 0.11, CZ), rot=(18, -12, 20 + (f % 8) * 1.5))
k(cur, 34, loc=(0.50, 0.14, CZ), rot=(16, -10, 26))
k(cur, 37, loc=(SX - 0.03, 0.05, CZ - 0.02), rot=(14, -10, 30))
k(cur, 38, loc=(SX - 0.03, 0.04, TOP + 0.06), rot=(10, -6, 30))
k(cur, 41, loc=(SX - 0.10, 0.10, CZ), rot=(18, -12, 26))
k(cur, 52, loc=(0.35, 0.17, CZ), rot=(18, -12, 22))
k(cur, NF, loc=(0.25, 0.16, CZ), rot=(18, -12, 20))

# ---------------------------------------------------------------- card rain
CARD_TEX = {
    # name: (body colour, weight)
    "p4_stat_green": ("#58C46E", 3), "p4_stat_blue": ("#4C84F0", 3), "p4_stat_orange": ("#F2A544", 3),
    "p4_area_orange": ("#F2A544", 3), "p4_area_red": ("#E8453C", 3), "p4_area_blue": ("#4C84F0", 3),
    "p4_phone_blue": ("#4C84F0", 2), "p4_tri_red": ("#E8453C", 3), "p4_mail": ("#F2A544", 1),
    "p4_dots": ("#E8453C", 1), "p4_green_soft": ("#58C46E", 2), "p4_redline": ("#E8453C", 2),
    "c_bars_green": ("#58C46E", 2), "c_grid_red": ("#E8453C", 2), "c_grid_green": ("#58C46E", 2),
    "c_grid_blue": ("#4C84F0", 2), "c_line": ("#4C84F0", 1), "c_doc_red": ("#E8453C", 1), "c_dots": ("#F2A544", 1),
    "c_pie": ("#58C46E", 1), "c_cal": ("#4C84F0", 1), "c_note_yellow": ("#F2A544", 1),
}
def tex_aspect(name):
    im = bpy.data.images.load(os.path.join(TEX, name + ".png"), check_existing=True)
    return im.size[1] / im.size[0]
pool = [n for n, (c, wt) in CARD_TEX.items() for _ in range(wt)]
face_mats, body_mats = {}, {}
def face_mat(n):
    if n not in face_mats:
        fm = mat_image("f_" + n, os.path.join(TEX, n + ".png"), rough=0.35)
        fb = fm.node_tree.nodes["Principled BSDF"]
        fb.inputs["Coat Weight"].default_value = 0.5
        fnt = fm.node_tree; timg_ = [nn for nn in fnt.nodes if nn.type == "TEX_IMAGE"][0]
        fnt.links.new(timg_.outputs["Color"], fb.inputs["Emission Color"]); fb.inputs["Emission Strength"].default_value = 0.12
        face_mats[n] = fm
    return face_mats[n]
def body_mat(c):
    if c not in body_mats:
        body_mats[c] = mat_principled("b_" + c, c, rough=0.3, coat=0.8, sss=0.1)
    return body_mats[c]


def make_card(name, tex, size):
    asp = tex_aspect(tex)
    wd = size if asp <= 1 else size / asp
    ht = wd * asp
    bpy.ops.object.empty_add(); root = bpy.context.active_object; root.name = name
    col = CARD_TEX[tex][0]
    body = slab(name + "_b", wd + 0.02, ht + 0.02, 0.032, corner=0.035, edge=0.008, segments=8)
    assign(body, body_mat(col)); body.parent = root; body.location = (0.012, -0.012, 0.016)
    face = slab(name + "_w", wd, ht, 0.02, corner=0.03, edge=0.006, segments=8)
    assign(face, body_mat("#FAFBFF"))
    face.parent = root; face.location = (0, 0, 0.042)
    bpy.ops.mesh.primitive_plane_add(size=1); dec = bpy.context.active_object
    dec.scale = (wd, ht, 1); dec.parent = root; dec.location = (0, 0, 0.0525)
    assign(dec, face_mat(tex))
    return root, max(wd, ht)


cards = []
EX_X, EX_Y = 1.06, 0.24            # keep the bar clear
cols = [(-2.64 + i * 0.48) for i in range(12)]
rows = [(-1.76 + j * 0.44) for j in range(9)]
idx = 0
for j, y in enumerate(rows):
    for i, x in enumerate(cols):
        x0 = x + (0.23 if j % 2 else 0) + random.uniform(-0.05, 0.05)
        y0 = y + random.uniform(-0.04, 0.04)
        if abs(x0) < EX_X and abs(y0) < EX_Y + 0.15:
            continue
        cards.append((x0, y0, random.uniform(0.40, 0.49)))
# a few extras overlapping near the bar edges (stacked look)
for x0, y0 in ((-0.6, 0.38), (0.25, 0.42), (0.7, -0.4), (-0.25, -0.42), (1.25, 0.05), (-1.3, -0.05)):
    cards.append((x0, y0, random.uniform(0.32, 0.38)))
random.shuffle(pool)
card_objs = []
for n, (x0, y0, sz) in enumerate(cards):
    tex = pool[n % len(pool)]
    root, big = make_card(f"card{n}", tex, sz)
    dist = math.hypot(x0 / 1.6, y0 / 0.9)
    land = int(44 + 4 * min(dist, 1.6) + random.uniform(-2, 3))      # near ones land first
    fly = random.randint(5, 7)
    tilt = (random.uniform(-7, 7), random.uniform(-7, 7)) if random.random() < 0.35 else (0, 0)
    zrest = 0.0 if tilt == (0, 0) else 0.04
    if n >= len(cards) - 6:
        zrest = 0.06
    rz = random.uniform(-8, 8)
    # start: up near the camera, pushed outward, tumbling
    ln_ = math.hypot(x0, y0) or 1.0
    push = random.uniform(1.0, 1.5)
    sx, sy = x0 + x0 / ln_ * push, y0 + y0 / ln_ * push * 0.8
    k(root, 1, loc=(sx, sy, 4.0), rot=(0, 0, 0), scale=0.001)
    k(root, land - fly, loc=(sx, sy, random.uniform(1.4, 2.1)),
      rot=(random.uniform(-50, 50), random.uniform(-50, 50), rz + random.uniform(-70, 70)), interp="EXPO", ease="EASE_OUT")
    k(root, land, loc=(x0, y0, zrest), rot=(tilt[0] * 1.4, tilt[1] * 1.4, rz + random.uniform(-4, 4)),
      scale=(1.04, 1.04, 0.8))
    k(root, land + 3, loc=(x0, y0, zrest), rot=(tilt[0], tilt[1], rz), scale=1.0)
    # invisible (scale ~0) until launch so nothing shadows the floor early
    k(root, land - fly - 1, scale=0.001, interp="CONSTANT")
    k(root, land - fly, scale=1.0)

# ---------------------------------------------------------------- camera: whip-in settle, hold, pull back
LENS = 50
TILT = math.radians(13)
def cam_at(D, dx=0.0, dy=0.0):
    return (dx, dy - D * math.sin(TILT), D * math.cos(TILT))
bpy.ops.object.camera_add(); cam = bpy.context.active_object; sc.camera = cam
cam.data.lens = LENS; cam.data.sensor_width = 36
cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 4.0
bpy.ops.object.empty_add(location=(0, 0, 0)); aim = bpy.context.active_object
cam.data.dof.focus_object = aim
tc_ = cam.constraints.new("TRACK_TO"); tc_.target = aim; tc_.track_axis = "TRACK_NEGATIVE_Z"; tc_.up_axis = "UP_Y"
CAMK = [(1, 2.4, 0.5), (3, 2.5, 0.2), (4, 2.6, 0.1), (6, 2.75, 0.02), (9, 2.79, 0.0), (38, 2.79, 0.0), (41, 2.93, 0.0),
        (44, 3.24, 0.0), (47, 3.6, 0.0), (50, 3.8, 0.0), (53, 3.85, 0.0), (65, 4.25, 0.0), (NF, 4.45, 0.0)]
for f, D, dx in CAMK:
    k(cam, f, loc=cam_at(D, dx))
    k(aim, f, loc=(dx, 0, TOP))
sc.frame_set(1)
render_shot("sh04_prompt", NF)
