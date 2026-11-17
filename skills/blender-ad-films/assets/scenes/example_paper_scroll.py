"""Shot 5 (65 f @ 24 fps), reference 12.3-15.0 s: tilted glossy-blue Gemini chat panel; the answer arrives as a paper
scroll that unrolls down the panel (red core, orange back, white text face), then the answer types + scrolls while
translucent Google-colour ribbons carrying 3D app icons sweep behind the panel.

Paper = one mesh whose per-frame shape (flat part + spiral roll) is baked into 65 shape keys, blended linearly so
motion blur interpolates correctly. Textures come from tex/sh05/make_sh05_tex.py (typing = image sequences).
"""
import sys, os, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from base import (reset, render_settings, camera, key, mat_principled, mat_image, assign, smooth, slab, render_shot,
                  lin, TEX)
import desk_world as dw

FR = 65
T5 = os.path.join(TEX, "sh05")
reset()
render_settings(1920, 1080)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, FR
dw.grade(sc)
sc.view_settings.exposure = 0.45


def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def ease_out(x, p=2.2):
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** p


def fcurves_of(idblock):
    ad = idblock.animation_data
    if not (ad and ad.action):
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


def all_linear(idblock):
    for fc in fcurves_of(idblock):
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


# ---------------------------------------------------------------- world + light
w = bpy.data.worlds.new("sky"); sc.world = w; w.use_nodes = True
nt = w.node_tree
bg = nt.nodes["Background"]; bg.inputs["Color"].default_value = (0.74, 0.82, 1.0, 1); bg.inputs["Strength"].default_value = 1.1
# camera sees a pale blue-white gradient sky; lighting sees the cooler fill
bg2 = nt.nodes.new("ShaderNodeBackground"); bg2.inputs["Strength"].default_value = 2.6
tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.3; ramp.color_ramp.elements[0].color = lin("#8FB4F6")
ramp.color_ramp.elements[1].position = 0.8; ramp.color_ramp.elements[1].color = lin("#E6EFFF")
mp = nt.nodes.new("ShaderNodeMapRange"); mp.inputs[1].default_value = -0.6; mp.inputs[2].default_value = 0.8
nt.links.new(tc.outputs["Window"], sep.inputs[0])
add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"
nt.links.new(sep.outputs[0], add.inputs[0]); nt.links.new(sep.outputs[1], add.inputs[1])
mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 0.5
nt.links.new(add.outputs[0], mul.inputs[0]); nt.links.new(mul.outputs[0], ramp.inputs[0])
nt.links.new(ramp.outputs[0], bg2.inputs[0])
lp = nt.nodes.new("ShaderNodeLightPath"); mix = nt.nodes.new("ShaderNodeMixShader")
nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
nt.links.new(bg.outputs[0], mix.inputs[1]); nt.links.new(bg2.outputs[0], mix.inputs[2])
nt.links.new(mix.outputs[0], nt.nodes["World Output"].inputs[0])


def sun_from(direction_to_light, energy, color, angle=3.0, name="sun"):
    bpy.ops.object.light_add(type="SUN")
    s = bpy.context.active_object; s.name = name
    s.data.energy = energy; s.data.color = color; s.data.angle = math.radians(angle)
    s.rotation_euler = Vector(direction_to_light).normalized().to_track_quat("Z", "Y").to_euler()
    return s


sun_from((-0.6, -0.7, 0.8), 3.2, (1.0, 0.92, 0.82), angle=4, name="key")
bpy.ops.object.light_add(type="AREA", location=(1.6, -1.6, 0.6))
rim = bpy.context.active_object; rim.data.energy = 90; rim.data.size = 2.5; rim.data.color = (0.85, 0.9, 1.0)
rim.rotation_euler = (Vector((0, 0, 0.2)) - rim.location).to_track_quat("-Z", "Y").to_euler()

# ---------------------------------------------------------------- panel
PW, PH, PT = 1.0, 1.6, 0.1
ZF = PT / 2  # front face (local +z)
bpy.ops.object.empty_add(location=(0, 0, 0)); root = bpy.context.active_object; root.name = "panel_root"

panel = slab("panel", PW, PH, PT, corner=0.085, edge=0.03)
panel.parent = root
pm = bpy.data.materials.new("panel_m"); pm.use_nodes = True; pnt = pm.node_tree
front = pnt.nodes["Principled BSDF"]
g_tc = pnt.nodes.new("ShaderNodeTexCoord"); g_sep = pnt.nodes.new("ShaderNodeSeparateXYZ")
nt_ = pnt
nt_.links.new(g_tc.outputs["Object"], g_sep.inputs[0])
g_mr = pnt.nodes.new("ShaderNodeMapRange"); g_mr.inputs[1].default_value = -0.8; g_mr.inputs[2].default_value = 0.8
pnt.links.new(g_sep.outputs[1], g_mr.inputs[0])
g_rm = pnt.nodes.new("ShaderNodeValToRGB")
g_rm.color_ramp.elements[0].color = lin("#2458E4"); g_rm.color_ramp.elements[1].color = lin("#5E90F4")
pnt.links.new(g_mr.outputs[0], g_rm.inputs[0]); pnt.links.new(g_rm.outputs[0], front.inputs["Base Color"])
front.inputs["Roughness"].default_value = 0.28
front.inputs["Coat Weight"].default_value = 0.8; front.inputs["Coat Roughness"].default_value = 0.08
front.inputs["Subsurface Weight"].default_value = 0.25
front.inputs["Subsurface Radius"].default_value = (0.3, 0.5, 1.0); front.inputs["Subsurface Scale"].default_value = 0.05
side = pnt.nodes.new("ShaderNodeBsdfPrincipled")
side.inputs["Base Color"].default_value = lin("#E6EEFF"); side.inputs["Roughness"].default_value = 0.12
side.inputs["Transmission Weight"].default_value = 0.7; side.inputs["Coat Weight"].default_value = 1.0
geo = pnt.nodes.new("ShaderNodeNewGeometry"); vt = pnt.nodes.new("ShaderNodeVectorTransform")
vt.vector_type = "NORMAL"; vt.convert_from = "WORLD"; vt.convert_to = "OBJECT"
pnt.links.new(geo.outputs["Normal"], vt.inputs[0])
n_sep = pnt.nodes.new("ShaderNodeSeparateXYZ"); pnt.links.new(vt.outputs[0], n_sep.inputs[0])
n_abs = pnt.nodes.new("ShaderNodeMath"); n_abs.operation = "ABSOLUTE"; pnt.links.new(n_sep.outputs[2], n_abs.inputs[0])
n_mr = pnt.nodes.new("ShaderNodeMapRange"); n_mr.inputs[1].default_value = 0.55; n_mr.inputs[2].default_value = 0.92
pnt.links.new(n_abs.outputs[0], n_mr.inputs[0])
pmix = pnt.nodes.new("ShaderNodeMixShader")
pnt.links.new(n_mr.outputs[0], pmix.inputs[0])
pnt.links.new(side.outputs[0], pmix.inputs[1]); pnt.links.new(front.outputs[0], pmix.inputs[2])
pnt.links.new(pmix.outputs[0], pnt.nodes["Material Output"].inputs[0])
assign(panel, pm)


def decal(name, png, w, h, loc, parent, seq_frames=None, rough=0.4, emit=0.0):
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object; o.name = name
    o.scale = (w, h, 1); bpy.ops.object.transform_apply(scale=True)
    m = mat_image(name + "_m", png, rough=rough)
    if seq_frames:
        img = [n for n in m.node_tree.nodes if n.type == "TEX_IMAGE"][0]
        img.image.source = "SEQUENCE"
        img.image_user.frame_duration = seq_frames
        img.image_user.frame_start = 1
        img.image_user.frame_offset = 0
        img.image_user.use_auto_refresh = True
    if emit:
        b = m.node_tree.nodes["Principled BSDF"]
        img = [n for n in m.node_tree.nodes if n.type == "TEX_IMAGE"][0]
        m.node_tree.links.new(img.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emit
    assign(o, m)
    o.parent = parent; o.location = loc
    o.visible_shadow = False
    return o


decal("face", os.path.join(T5, "sh05_face.png"), 0.98, 1.58, (0, 0, ZF + 0.002), panel, emit=0.35)

# app icon: white rounded square with the sparkle
ic = slab("icon_sq", 0.14, 0.14, 0.035, corner=0.035, edge=0.01); ic.parent = root
ic.location = (-0.365, 0.54, ZF + 0.0175)
assign(ic, mat_principled("icon_m", "#FFFFFF", rough=0.25, coat=0.6, sss=0.1))
decal("icon_star", os.path.join(T5, "sh05_icon.png"), 0.11, 0.11, (0, 0, 0.0185), ic, emit=0.2)

# question bubble (white glossy slab) with typing texture
bub = slab("bubble", 0.68, 0.155, 0.032, corner=0.05, edge=0.012); bub.parent = root
bub.location = (0.085, 0.54, ZF + 0.016)
assign(bub, mat_principled("bubble_m", "#FFFFFF", rough=0.4, coat=0.3, sss=0.1))
decal("q_text", os.path.join(T5, "q", "q0001.png"), 0.66, 0.15, (0, 0, 0.0168), bub, seq_frames=FR)

# ---------------------------------------------------------------- paper scroll
SW, L = 0.84, 1.25
Y_TOP, Z0 = 0.43, ZF + 0.012
NX, NS = 12, 420
GAP = 0.022           # radial gap per turn of the roll


def U_of(f):          # unrolled (flat) length
    return 0.015 + 0.985 * ease_out((f - 1) / 30.0, 1.6) ** 1.25


def rcore_of(f):
    return 0.115 - 0.078 * ease((f - 2) / 28.0)


def sheet_profile(f):
    """returns list of (Y, Z) per arc-length sample s_i and the roll centre / core radius."""
    U = U_of(f); rc = rcore_of(f) + 0.008
    rad = lambda s: math.sqrt(rc * rc + GAP * max(0.0, L - s) / math.pi)
    rU = rad(U)
    cy, cz = Y_TOP - U, Z0 + rU
    pts = []
    phi = 0.0
    prev_s = None
    for i in range(NS + 1):
        s = L * i / NS
        if s <= U:
            # top lip: the first few cm of paper still peel up a little while the roll is near the top
            lift = 0.0
            if s < 0.07:
                lift = (0.07 - s) ** 2 * 6.0 * (1 - ease((f - 4) / 14.0))
            pts.append((Y_TOP - s, Z0 + lift))
        else:
            ds = s - (prev_s if prev_s is not None and prev_s > U else U)
            r = rad(s)
            phi += ds / r
            if phi < 1.8:  # the outer lap hangs loose -> a lip that bulges out at the front
                r += 0.05 * math.sin(phi / 1.8 * math.pi) * (0.6 + 0.4 * rU / 0.15)
            pts.append((cy - r * math.sin(phi), cz - r * math.cos(phi)))
        prev_s = s
    return pts, (cy, cz), rcore_of(f)


def sheet_mesh():
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    pts, _, _ = sheet_profile(1)
    grid = []
    for i in range(NS + 1):
        row = []
        for j in range(NX + 1):
            x = -SW / 2 + SW * j / NX
            row.append(bm.verts.new((x, pts[i][0], pts[i][1])))
        grid.append(row)
    for i in range(NS):
        for j in range(NX):
            fce = bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
            for lo in fce.loops:
                v = lo.vert
                ii = next(k for k in (i, i + 1) if v in grid[k])
                jj = next(k for k in (j, j + 1) if grid[ii][k] == v)
                lo[uv].uv = (jj / NX, 1 - (ii * L / NS) / L)
    me = bpy.data.meshes.new("paper"); bm.to_mesh(me); bm.free()
    # make faces point +z (text side) when flat
    o = bpy.data.objects.new("paper", me); sc.collection.objects.link(o)
    me.update()
    if me.polygons[0].normal.z < 0:
        bm = bmesh.new(); bm.from_mesh(me)
        bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    smooth(o)
    return o


paper = sheet_mesh(); paper.parent = root
paper.shape_key_add(name="Basis")
kb = []
for f in range(1, FR + 1):
    k = paper.shape_key_add(name=f"f{f:03d}", from_mix=False)
    pts, _, _ = sheet_profile(f)
    for i in range(NS + 1):
        for j in range(NX + 1):
            x = -SW / 2 + SW * j / NX
            k.data[i * (NX + 1) + j].co = (x, pts[i][0], pts[i][1])
    kb.append(k)
for f, k in enumerate(kb, start=1):
    for ff, v in ((f - 1, 0.0), (f, 1.0), (f + 1, 0.0)):
        k.value = v; k.keyframe_insert("value", frame=ff)
    # extrapolate cleanly at the ends
    if f == 1:
        k.value = 1.0; k.keyframe_insert("value", frame=-5)
    if f == FR:
        k.value = 1.0; k.keyframe_insert("value", frame=FR + 6)
all_linear(paper.data.shape_keys)
sol = paper.modifiers.new("thick", "SOLIDIFY"); sol.thickness = 0.005; sol.offset = -1
sol.material_offset = 1; sol.material_offset_rim = 1

pf = mat_image("paper_front", os.path.join(T5, "a", "a0001.png"), rough=0.35)
img_n = [n for n in pf.node_tree.nodes if n.type == "TEX_IMAGE"][0]
img_n.image.source = "SEQUENCE"; iu = img_n.image_user
iu.frame_duration = FR; iu.frame_start = 1; iu.frame_offset = 0; iu.use_auto_refresh = True
bpf = pf.node_tree.nodes["Principled BSDF"]
bpf.inputs["Alpha"].default_value = 1.0
for l in list(pf.node_tree.links):
    if l.to_socket == bpf.inputs["Alpha"]:
        pf.node_tree.links.remove(l)
bpf.inputs["Subsurface Weight"].default_value = 0.15; bpf.inputs["Coat Weight"].default_value = 0.0
bpf.inputs["Roughness"].default_value = 0.6; bpf.inputs["Specular IOR Level"].default_value = 0.25
pb = mat_principled("paper_back", "#F5A13A", rough=0.3, coat=0.5, sss=0.1)
# back colour: the loose outer lap (just past the contact line) is orange, the wound layers are red
bt = pb.node_tree; bb = bt.nodes["Principled BSDF"]
b_uv = bt.nodes.new("ShaderNodeUVMap"); b_sp = bt.nodes.new("ShaderNodeSeparateXYZ"); bt.links.new(b_uv.outputs[0], b_sp.inputs[0])
b_u = bt.nodes.new("ShaderNodeValue"); b_u.name = "U_now"; b_fl = bt.nodes.new("ShaderNodeValue"); b_fl.name = "FLAP"
b_s = bt.nodes.new("ShaderNodeMath"); b_s.operation = "MULTIPLY_ADD"; b_s.inputs[1].default_value = -L; b_s.inputs[2].default_value = L
bt.links.new(b_sp.outputs[1], b_s.inputs[0])
b_d = bt.nodes.new("ShaderNodeMath"); b_d.operation = "SUBTRACT"; bt.links.new(b_s.outputs[0], b_d.inputs[0]); bt.links.new(b_u.outputs[0], b_d.inputs[1])
b_q = bt.nodes.new("ShaderNodeMath"); b_q.operation = "DIVIDE"; bt.links.new(b_d.outputs[0], b_q.inputs[0]); bt.links.new(b_fl.outputs[0], b_q.inputs[1])
b_r = bt.nodes.new("ShaderNodeValToRGB"); cr_ = b_r.color_ramp
cr_.elements[0].position = 0.0; cr_.elements[0].color = lin("#F7A935")
cr_.elements[1].position = 1.0; cr_.elements[1].color = lin("#E8352D")
e_ = cr_.elements.new(0.9); e_.color = lin("#F59331")
cr_.elements[1].position = 0.97
bt.links.new(b_q.outputs[0], b_r.inputs[0]); bt.links.new(b_r.outputs[0], bb.inputs["Base Color"])
for f in range(1, FR + 1):
    Uf = U_of(f); rcf = rcore_of(f) + 0.008
    rUf = math.sqrt(rcf * rcf + GAP * max(0.0, L - Uf) / math.pi)
    b_u.outputs[0].default_value = Uf; b_u.outputs[0].keyframe_insert("default_value", frame=f)
    b_fl.outputs[0].default_value = 0.6 * math.pi * rUf; b_fl.outputs[0].keyframe_insert("default_value", frame=f)
all_linear(bt)
paper.data.materials.append(pf); paper.data.materials.append(pb)

# red core the paper is wound on
bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=SW + 0.02, vertices=96, rotation=(0, math.radians(90), 0))
core = bpy.context.active_object; core.name = "core"
bpy.ops.object.transform_apply(rotation=True)
bv = core.modifiers.new("b", "BEVEL"); bv.width = 0.01; bv.segments = 4
smooth(core); assign(core, mat_principled("core_m", "#E8352D", rough=0.22, coat=0.8, sss=0.12))
core.parent = root
for f in range(1, FR + 1):
    _, (cy, cz), rc = sheet_profile(f)
    key(core, f, loc=(0, cy, cz), scale=(1, rc, rc))
all_linear(core)

# blue 3D caret (triangle pointer) that follows the typing
cur_track = json.load(open(os.path.join(T5, "sh05_cursor.json")))
bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.045, radius2=0, depth=0.03)
cur = bpy.context.active_object; cur.name = "caret"
cur.scale = (1.0, 1.35, 1.0); bpy.ops.object.transform_apply(scale=True)
cb = cur.modifiers.new("b", "BEVEL"); cb.width = 0.006; cb.segments = 4
smooth(cur); cur.parent = root
cm = mat_principled("caret_m", "#4C86F2", rough=0.12, coat=1.0, transmission=0.35, sss=0.2)
assign(cur, cm)
for f in range(1, FR + 1):
    xmm, ymm = cur_track[str(f)]
    x = -SW / 2 + xmm / 1000.0; y = Y_TOP - ymm / 1000.0
    y = max(y, Y_TOP - U_of(f) + 0.05)
    sc_ = 0.001 if f < 17 else (1.12 if f == 21 else 1.0) if f <= 21 else 1.0
    if 17 <= f < 21:
        sc_ = 0.3 + 0.82 * (f - 17) / 4
    key(cur, f, loc=(x, y, Z0 + 0.03), rot=(0, 0, 18 + 6 * math.sin(f * 0.3)), scale=sc_)

# ---------------------------------------------------------------- ribbons + riding icons
def catmull(pts, n):
    P = [Vector(p) for p in pts]
    P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]
    out = []
    segs = len(P) - 3
    for i in range(n + 1):
        u = i / n * segs
        k = min(int(u), segs - 1); t = u - k
        p0, p1, p2, p3 = P[k:k + 4]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                          + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    return out


def ribbon(name, ctrl, width, c0, c1, up=(0, -0.25, 1), alpha=0.82, n=260):
    pts = catmull(ctrl, n)
    upv = Vector(up).normalized()
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new("UVMap")
    rows = []
    for i, p in enumerate(pts):
        tg = (pts[min(i + 1, n)] - pts[max(i - 1, 0)]).normalized()
        wd = (upv - upv.dot(tg) * tg).normalized()
        rows.append((bm.verts.new(p - wd * width / 2), bm.verts.new(p + wd * width / 2)))
    for i in range(n):
        fce = bm.faces.new((rows[i][0], rows[i + 1][0], rows[i + 1][1], rows[i][1]))
        for lo, uv in zip(fce.loops, ((i / n, 0), ((i + 1) / n, 0), ((i + 1) / n, 1), (i / n, 1))):
            lo[uvl].uv = uv
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); smooth(o)
    s = o.modifiers.new("t", "SOLIDIFY"); s.thickness = 0.002; s.offset = 0
    m = bpy.data.materials.new(name + "_m"); m.use_nodes = True; mt = m.node_tree
    b = mt.nodes["Principled BSDF"]
    uvn = mt.nodes.new("ShaderNodeUVMap"); sp = mt.nodes.new("ShaderNodeSeparateXYZ")
    mt.links.new(uvn.outputs[0], sp.inputs[0])
    r = mt.nodes.new("ShaderNodeValToRGB"); r.color_ramp.elements[0].color = lin(c0); r.color_ramp.elements[1].color = lin(c1)
    mt.links.new(sp.outputs[0], r.inputs[0]); mt.links.new(r.outputs[0], b.inputs["Base Color"])
    # lighter edges across the band
    edge = mt.nodes.new("ShaderNodeMath"); edge.operation = "PINGPONG"; edge.inputs[1].default_value = 0.5
    mt.links.new(sp.outputs[1], edge.inputs[0])
    er = mt.nodes.new("ShaderNodeMapRange"); er.inputs[1].default_value = 0.0; er.inputs[2].default_value = 0.12
    er.inputs[3].default_value = 0.55; er.inputs[4].default_value = 0.0
    mt.links.new(edge.outputs[0], er.inputs[0])
    mt.links.new(er.outputs[0], b.inputs["Coat Weight"])
    b.inputs["Roughness"].default_value = 0.18
    b.inputs["Alpha"].default_value = alpha
    b.inputs["Transmission Weight"].default_value = 0.35
    b.inputs["Subsurface Weight"].default_value = 0.2
    b.inputs["Coat Weight"].default_value = 0.6
    assign(o, m)
    o.visible_shadow = False
    # hidden poly curve with the same centreline for Follow Path
    cu = bpy.data.curves.new(name + "_path", "CURVE"); cu.dimensions = "3D"; cu.use_path = True
    spl = cu.splines.new("POLY"); spl.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        spl.points[i].co = (p.x, p.y, p.z, 1)
    co = bpy.data.objects.new(name + "_path", cu); sc.collection.objects.link(co)
    co.hide_render = True
    return o, co


def mat_toy(name, color):
    return mat_principled(name, color, rough=0.25, coat=0.8, sss=0.12)


def stroke(name, pts2d, r, color, parent, cyclic=False):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"
    sp = cu.splines.new("POLY"); sp.points.add(len(pts2d) - 1)
    for i, (x, y) in enumerate(pts2d):
        sp.points[i].co = (x, y, 0, 1)
    sp.use_cyclic_u = cyclic
    cu.bevel_depth = r; cu.bevel_resolution = 6; cu.use_fill_caps = True
    o = bpy.data.objects.new(name, cu); sc.collection.objects.link(o)
    o.parent = parent; assign(o, mat_toy(name + "_m", color))
    return o


def arc(a0, a1, rad, n=24):
    return [(rad * math.cos(math.radians(a0 + (a1 - a0) * i / n)), rad * math.sin(math.radians(a0 + (a1 - a0) * i / n)))
            for i in range(n + 1)]


def new_icon(kind, name):
    bpy.ops.object.empty_add(); e = bpy.context.active_object; e.name = name
    R_, Y_, G_, B_ = "#EA4335", "#FBBC05", "#34A853", "#4285F4"
    t = 0.028
    if kind == "G":
        stroke(name + "r", arc(40, 140, 0.1), t, R_, e); stroke(name + "y", arc(140, 215, 0.1), t, Y_, e)
        stroke(name + "g", arc(215, 318, 0.1), t, G_, e); stroke(name + "b", arc(318, 362, 0.1) + [(0.02, 0.0)], t, B_, e)
    elif kind == "M":
        stroke(name + "b", [(-0.1, -0.07), (-0.1, 0.07)], t, B_, e)
        stroke(name + "r", [(-0.1, 0.07), (0.0, -0.01), (0.1, 0.07)], t, R_, e)
        stroke(name + "g", [(0.1, 0.07), (0.1, -0.07)], t, G_, e)
        stroke(name + "y", [(0.1, 0.07), (0.07, 0.045)], t * 1.02, Y_, e)
    elif kind == "YT":
        s = slab(name + "s", 0.2, 0.14, 0.05, corner=0.045, edge=0.015); s.parent = e; assign(s, mat_toy(name + "sm", "#FF1E1E"))
        bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.04, radius2=0, depth=0.02, location=(0.005, 0, 0.03))
        tri = bpy.context.active_object; tri.parent = e; assign(tri, mat_toy(name + "tm", "#FFFFFF"))
    elif kind == "DRIVE":
        a, b_, c = (0, 0.09), (-0.095, -0.07), (0.095, -0.07)
        stroke(name + "g", [a, b_], t, G_, e); stroke(name + "b", [b_, c], t, B_, e); stroke(name + "y", [c, a], t, Y_, e)
    elif kind == "MEET":
        s = slab(name + "s", 0.15, 0.13, 0.05, corner=0.03, edge=0.012); s.parent = e; s.location = (-0.02, 0, 0)
        assign(s, mat_toy(name + "sm", G_))
        stroke(name + "b", [(-0.095, 0.065), (0.02, 0.065)], t * 0.9, B_, e)
        stroke(name + "y", [(-0.095, -0.065), (0.02, -0.065)], t * 0.9, Y_, e)
        bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.055, radius2=0, depth=0.05, location=(0.08, 0, 0),
                                        rotation=(0, 0, math.radians(180)))
        tri = bpy.context.active_object; tri.parent = e; assign(tri, mat_toy(name + "tm", G_))
    elif kind == "PIN":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(0, 0.03, 0)); sph = bpy.context.active_object
        smooth(sph); sph.parent = e; assign(sph, mat_toy(name + "rm", R_))
        bpy.ops.mesh.primitive_cone_add(radius1=0.062, radius2=0.0, depth=0.12, vertices=48)
        cn = bpy.context.active_object; smooth(cn); cn.parent = e
        cn.location = (0, -0.035, 0); cn.rotation_euler = (math.radians(90), 0, 0)  # tip points local -Y
        assign(cn, mat_toy(name + "cm", R_))
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.026, location=(0, 0.03, 0.055)); d = bpy.context.active_object
        smooth(d); d.parent = e; assign(d, mat_toy(name + "dm", "#8A1B12"))
    return e


# ribbons live in world space around the panel (panel at origin, facing -Y, camera in front)
RIB = [
    ("rib_red",   [(-3.2, -1.4, 0.05), (-1.4, -0.35, 0.25), (-0.3, 0.45, 0.5), (0.9, 0.55, 0.75), (2.0, 0.1, 1.2), (3.2, -0.6, 1.9)],
     0.26, "#D9261C", "#F25A36", (0.0, -0.3, 1.0)),
    ("rib_orange", [(-3.2, -1.3, -0.2), (-1.4, -0.25, 0.02), (-0.3, 0.55, 0.28), (0.9, 0.65, 0.52), (2.0, 0.2, 0.98), (3.2, -0.5, 1.66)],
     0.2, "#F2701C", "#F59A2A", (0.0, -0.3, 1.0)),
    ("rib_green", [(-3.2, -0.6, -0.55), (-1.5, 0.3, -0.3), (-0.2, 0.7, -0.15), (1.0, 0.5, 0.0), (2.3, -0.3, 0.15), (3.4, -1.2, 0.3)],
     0.24, "#1FA84A", "#6BD68A", (0.0, -0.4, 1.0)),
    ("rib_blue", [(-3.2, -1.2, -0.95), (-1.6, -0.3, -0.75), (-0.4, 0.5, -0.6), (0.9, 0.6, -0.45), (2.2, -0.2, -0.3), (3.4, -1.2, -0.1)],
     0.22, "#2F6BEA", "#79A3F5", (0.0, -0.5, 1.0)),
]
RIB += [
    ("rib_red2", [(-3.2, -0.8, 0.75), (-1.5, 0.2, 0.85), (-0.2, 0.8, 1.0), (1.0, 0.8, 1.15), (2.3, 0.2, 1.35), (3.4, -0.6, 1.6)],
     0.14, "#E3362B", "#FF8A6A", (0.0, -0.3, 1.0)),
    ("rib_blue2", [(-3.2, -0.2, 0.35), (-1.5, 0.6, 0.3), (-0.2, 0.95, 0.35), (1.0, 0.9, 0.3), (2.3, 0.3, 0.4), (3.4, -0.5, 0.5)],
     0.12, "#3F7BEF", "#9FC0FA", (0.0, -0.3, 1.0)),
]
paths = {}
for name, ctrl, wd, c0, c1, up in RIB:
    wd *= 0.7
    _, pth = ribbon(name, ctrl, wd, c0, c1, up=up)
    paths[name] = pth

ICONS = [  # (kind, ribbon, start offset, speed per shot, size, spin deg)
    ("M", "rib_red", 0.12, 0.22, 1.0, 20), ("G", "rib_red", 0.58, 0.2, 1.25, -15), ("MEET", "rib_orange", 0.3, 0.24, 0.9, 25),
    ("YT", "rib_orange", 0.72, 0.2, 0.85, -20), ("DRIVE", "rib_green", 0.2, 0.25, 0.95, 30), ("PIN", "rib_green", 0.62, 0.22, 0.9, -25),
    ("M", "rib_green", 0.9, 0.2, 0.9, 15), ("MEET", "rib_blue", 0.15, 0.24, 1.0, -20), ("G", "rib_blue", 0.5, 0.22, 0.9, 25),
    ("YT", "rib_red", 0.35, 0.2, 0.8, 10), ("DRIVE", "rib_orange", 0.02, 0.24, 0.85, -30),
]
for i, (kind, rb, o0, spd, size, spin) in enumerate(ICONS):
    bpy.ops.object.empty_add(); carrier = bpy.context.active_object; carrier.name = f"carrier{i}"
    fp = carrier.constraints.new("FOLLOW_PATH"); fp.target = paths[rb]; fp.use_fixed_location = True
    fp.offset_factor = o0; fp.keyframe_insert("offset_factor", frame=1)
    fp.offset_factor = min(1.0, o0 + spd); fp.keyframe_insert("offset_factor", frame=FR)
    ic_ = new_icon(kind, f"icon{i}_{kind}")
    ic_.parent = carrier
    ic_.location = (0, -0.03, 0)
    ic_.scale = (size * 1.3,) * 3
    key(ic_, 1, rot=(90, 0, spin * 0.5)); key(ic_, FR, rot=(90, spin * 0.6, -spin * 0.5))
for o in bpy.data.objects:
    if o.name.startswith("carrier"):
        all_linear(o)

# ---------------------------------------------------------------- panel pose + camera
# panel rolls CCW in frame (top edge rising to the right) and leans back; the roll grows through the shot
key(root, 1, rot=(76, -20, -18)); key(root, 30, rot=(80, -26, -20)); key(root, FR, rot=(80, -29, -22))

bpy.ops.object.empty_add(location=(0, 0, 0)); focus = bpy.context.active_object; focus.name = "focus"
cam = camera(loc=(-0.3, -1.6, -0.2), target=(0, 0, 0.3), lens=40, fstop=1.6, focus_obj=focus)
bpy.ops.object.empty_add(location=(0, 0, 0.3)); aim = bpy.context.active_object; aim.name = "aim"
tt = cam.constraints.new("TRACK_TO"); tt.target = aim; tt.track_axis = "TRACK_NEGATIVE_Z"; tt.up_axis = "UP_Y"
# start tight + low on the roll, pull back to the panel as the paper lands (12.9-13.5 s), then a slow push-in
key(cam, 1, loc=(-0.5, -1.4, -0.55)); key(aim, 1, loc=(0.02, 0, 0.3)); key(focus, 1, loc=(0.0, 0, 0.3))
key(cam, 14, loc=(-0.55, -1.55, -0.6)); key(aim, 14, loc=(0.02, 0, 0.2)); key(focus, 14, loc=(0.0, 0, 0.2))
key(cam, 30, loc=(-0.62, -1.95, -0.7)); key(aim, 30, loc=(0.0, 0, 0.18)); key(focus, 30, loc=(0.0, 0, 0.1))
key(cam, FR, loc=(-0.5, -1.85, -0.7)); key(aim, FR, loc=(0.0, 0, 0.06)); key(focus, FR, loc=(0.0, 0, 0.0))

# copy of base.render_shot with persistent data OFF: with it on, the 2nd frame hit Metal "Insufficient Memory"
# (the per-frame image sequences + shape keys pile up on the GPU while other shots render alongside).
def render_shot_np(shot, frames):
    ROOT = os.path.dirname(TEX)
    sc.render.fps = 24
    sc.frame_start, sc.frame_end = 1, frames
    sc.render.use_motion_blur = True
    sc.render.use_persistent_data = False
    sc.render.motion_blur_shutter = 0.35
    preview = os.environ.get("PREVIEW") == "1"
    if preview:
        sc.render.resolution_percentage = 50
        sc.cycles.samples = int(os.environ.get("SAMPLES", "16"))
    else:
        sc.cycles.samples = int(os.environ.get("SAMPLES", "96"))
    out_dir = os.path.join(ROOT, "renders", ("prev_" if preview else "") + shot)
    os.makedirs(out_dir, exist_ok=True)
    sc.render.image_settings.file_format = "PNG"
    still = os.environ.get("STILL")
    if still:
        for f in still.split(","):
            sc.frame_set(int(f))
            sc.render.filepath = os.path.join(ROOT, "renders", f"still_{shot}_{int(f):04d}.png")
            bpy.ops.render.render(write_still=True)
            print("WROTE", sc.render.filepath)
        return
    sc.render.filepath = os.path.join(out_dir, "")
    sc.render.use_overwrite = False
    sc.render.use_placeholder = False
    bpy.ops.render.render(animation=True)
    print("RENDERED", out_dir)


render_shot_np("sh05_scroll", FR)
