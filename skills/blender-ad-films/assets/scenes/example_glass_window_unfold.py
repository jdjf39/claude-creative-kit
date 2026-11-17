"""Shot 7 (110 f @ 24 fps), reference t 17.6-22.2 s: out of a whip pan into a warm white studio with blind stripes;
a frosted-glass Gemini window floats centre frame; coloured layers spin up as a stack, then unfold into the result
layout (story text, portrait, mountain, pug, info card); a rainbow glow sweeps the border; slow push-in; fast pull-back.

Frame f <-> ref t = 17.6 + (f-1)/24.  The reference's own cut-in is at ref 17.84 (f7) and its cut-out
(pull-back into the laptop shot) at ref 21.33 (f90); frames 90-110 are a pull-back handle.
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from base import (reset, render_settings, camera, key, mat_principled, assign, smooth, slab, pill,
                  dimple_ball, render_shot, lin, TEX)
import desk_world as dw

reset()
render_settings(1920, 1080)
sc = bpy.context.scene
dw.grade(sc)
sc.view_settings.exposure = 0.95
dw.world_fill(color=(0.78, 0.76, 0.98), strength=0.6)

G_BLUE, G_RED, G_YEL, G_GRN = "#3C7BF0", "#EA4335", "#F6C02E", "#2FC24E"
WHITE = "#F3F1ED"


def hide_from_rays(o):
    for a in ("visible_camera", "visible_glossy", "visible_diffuse", "visible_transmission"):
        setattr(o, a, False)


def kv(sock, frame, v):
    sock.default_value = v
    sock.keyframe_insert("default_value", frame=frame)


# ---------------- light: warm sun through blinds + lavender fill ----------------
bpy.ops.object.light_add(type="SUN")
sun = bpy.context.active_object
sun.data.energy = 9.0
sun.data.color = (1.0, 0.88, 0.72)
sun.data.angle = math.radians(1.6)
d = Vector((0.55, 0.75, -0.55)).normalized()
sun.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
bpy.ops.object.empty_add()
rig = bpy.context.active_object
rig.rotation_euler = sun.rotation_euler
rig.rotation_mode = "XYZ"
blind_roll = bpy.data.objects.new("blind_roll", None)
sc.collection.objects.link(blind_roll)
blind_roll.parent = rig
blind_roll.rotation_euler = (0, 0, math.radians(float(os.environ.get("BLIND_ROLL", "80"))))
for i in range(-40, 41):
    bpy.ops.mesh.primitive_cube_add(size=1)
    b = bpy.context.active_object
    b.scale = (60, 0.42, 0.02)
    b.parent = blind_roll
    b.location = (0, i * 0.9, 4)
    hide_from_rays(b)
rig.location = (0, 2, 0)
# blind stripes only land on the studio (the ref's window + toys are clean); a second, stripe-free sun keys the set
bg_coll = bpy.data.collections.new("p7_studio"); sc.collection.children.link(bg_coll)
fg_coll = bpy.data.collections.new("p7_fg"); sc.collection.children.link(fg_coll)
bpy.ops.object.light_add(type="SUN")
key_sun = bpy.context.active_object
key_sun.data.energy = 5.0
key_sun.data.color = (1.0, 0.9, 0.78)
key_sun.data.angle = math.radians(6)
key_sun.rotation_euler = Vector((0.45, 0.8, -0.6)).normalized().to_track_quat("-Z", "Y").to_euler()
sun.light_linking.receiver_collection = bg_coll
key_sun.light_linking.receiver_collection = fg_coll

# ---------------- studio: warm white walls, blurred shelves ----------------
wall_m = mat_principled("wall_m", "#F6F1E9", rough=0.6)
shelf_m = mat_principled("shelf_m", "#F4F2EE", rough=0.35, coat=0.3)
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 5.0, 0), rotation=(math.radians(90), 0, 0))
assign(bpy.context.active_object, wall_m)
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -3.2))
assign(bpy.context.active_object, wall_m)


def shelf(name, size, loc, rot=(0, 0, 0)):
    o = slab(name, size[0], size[1], size[2], corner=min(size[0], size[1]) * 0.3, edge=size[2] * 0.4)
    o.location = loc
    o.rotation_euler = tuple(math.radians(a) for a in rot)
    assign(o, shelf_m)
    return o


shelf("shelf_hi", (9, 1.2, 0.34), (3.6, 3.4, 1.15))
shelf("shelf_hi2", (9, 1.2, 0.3), (-6.2, 4.4, 1.9))
shelf("shelf_lo", (22, 1.6, 0.34), (0, 2.6, -1.45))
shelf("shelf_front", (22, 1.0, 0.3), (0, -1.6, -1.7))
shelf("post", (0.42, 0.6, 5.0), (-0.9, 4.2, 3.2), rot=(90, 0, 0))
shelf("post2", (0.42, 0.6, 5.0), (5.4, 4.6, 0.8), rot=(90, 0, 0))
bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.05, location=(1.2, 4.8, 2.35),
                                 rotation=(math.radians(90), 0, 0))
assign(bpy.context.active_object, shelf_m)

# ---------------- the Gemini window ----------------
WW, WH, WT = 2.6, 1.55, 0.09
win = bpy.data.objects.new("win", None)
sc.collection.objects.link(win)

glass = slab("win_glass", WW, WH, WT, corner=0.085, edge=0.03)
gm = mat_principled("glass_m", "#FFFFFF", rough=0.42, coat=1.0, transmission=0.75, ior=1.3)
gb = gm.node_tree.nodes["Principled BSDF"]
gb.inputs["Coat Roughness"].default_value = 0.04
assign(glass, gm)
glass.parent = win
glass.rotation_euler = (math.radians(90), 0, 0)
# milky backing so the frosted face reads white, not see-through
back = slab("win_milk", WW - 0.03, WH - 0.03, 0.004, corner=0.08, edge=0.001)
milk = mat_principled("milk_m", "#FFFFFF", rough=0.6, transmission=0.45)
milk.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = lin("#F4F6FC")
milk.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.45
assign(back, milk)
back.parent = win
back.rotation_euler = (math.radians(90), 0, 0)
back.location = (0, 0.03, 0)


def face_plane(name, png, w, h, y, mat=None, parent=win):
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    o.rotation_euler = (math.radians(90), 0, 0)
    o.location = (0, y, 0)
    o.parent = parent
    if mat is None:
        mat = img_mat(name + "_m", png)
    assign(o, mat)
    o.visible_shadow = False
    return o


def img_mat(name, png, rough=0.4, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    im = nt.nodes.new("ShaderNodeTexImage")
    im.image = bpy.data.images.load(os.path.join(TEX, png))
    im.interpolation = "Cubic"
    im.extension = "CLIP"
    nt.links.new(im.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(im.outputs["Alpha"], b.inputs["Alpha"])
    b.inputs["Roughness"].default_value = rough
    if emit:
        nt.links.new(im.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emit
    return m


ui = face_plane("win_ui", "p7_ui.png", WW, WH, -WT / 2 - 0.003)
ui.visible_glossy = False
ui.visible_transmission = False

# rainbow fan ribbons (whip-in -> thin lines -> gone by ref 19.4)
fan_m = img_mat("fan_m", "p7_fan.png", rough=0.3, emit=1.4)
fan_alpha = fan_m.node_tree.nodes.new("ShaderNodeMath")
fan_alpha.operation = "MULTIPLY"
fb = fan_m.node_tree.nodes["Principled BSDF"]
fim = [n for n in fan_m.node_tree.nodes if n.type == "TEX_IMAGE"][0]
fan_m.node_tree.links.new(fim.outputs["Alpha"], fan_alpha.inputs[0])
fan_m.node_tree.links.new(fan_alpha.outputs[0], fb.inputs["Alpha"])
for f, v in ((1, 1.0), (22, 0.95), (34, 0.75), (42, 0.35), (47, 0.0)):
    kv(fan_alpha.inputs[1], f, v)
fan_piv = bpy.data.objects.new("fan_piv", None)
sc.collection.objects.link(fan_piv)
fan_piv.parent = win
fan = face_plane("fan", None, WW * 1.02, WH * 1.02, 0, mat=fan_m, parent=fan_piv)
fan.location = (WW * 0.51, 0, -WH * 0.51)          # pivot at the window's top-left corner
fan.visible_shadow = False
key(fan_piv, 1, loc=(-WW * 0.51, -WT / 2 - 0.02, WH * 0.51), rot=(0, 8, 0), scale=(1.05, 1, 1.9))
key(fan_piv, 10, loc=(-WW * 0.51, -WT / 2 - 0.02, WH * 0.51), rot=(0, 3, 0), scale=(1.0, 1, 1.35))
key(fan_piv, 25, loc=(-WW * 0.51, -WT / 2 - 0.02, WH * 0.51), rot=(0, 0, 0), scale=(1.0, 1, 0.75))
key(fan_piv, 45, loc=(-WW * 0.51, -WT / 2 - 0.02, WH * 0.51), rot=(0, -2, 0), scale=(0.95, 1, 0.55))

# rainbow border glow sweep (ref 20.0-20.5)
glow_m = bpy.data.materials.new("glow_m")
glow_m.use_nodes = True
nt = glow_m.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
out = nt.nodes.new("ShaderNodeOutputMaterial")
gim = nt.nodes.new("ShaderNodeTexImage")
gim.image = bpy.data.images.load(os.path.join(TEX, "p7_glow.png"))
gim.extension = "CLIP"
em = nt.nodes.new("ShaderNodeEmission")
em.inputs["Strength"].default_value = 4.0
tr = nt.nodes.new("ShaderNodeBsdfTransparent")
mixs = nt.nodes.new("ShaderNodeMixShader")
tc = nt.nodes.new("ShaderNodeTexCoord")
rad = nt.nodes.new("ShaderNodeTexGradient")
rad.gradient_type = "RADIAL"
mp = nt.nodes.new("ShaderNodeMapping")
mp.inputs["Rotation"].default_value = (0, 0, math.radians(150))   # sweep starts at the top-left corner
nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
nt.links.new(mp.outputs["Vector"], rad.inputs["Vector"])
sweep = nt.nodes.new("ShaderNodeMath")
sweep.operation = "SUBTRACT"                        # sweep_pos - angle
nt.links.new(rad.outputs["Fac"], sweep.inputs[1])
sm = nt.nodes.new("ShaderNodeMapRange")              # soft leading edge
sm.inputs["From Min"].default_value = 0.0
sm.inputs["From Max"].default_value = 0.22
nt.links.new(sweep.outputs[0], sm.inputs["Value"])
m1 = nt.nodes.new("ShaderNodeMath")
m1.operation = "MULTIPLY"
nt.links.new(sm.outputs["Result"], m1.inputs[0])
nt.links.new(gim.outputs["Alpha"], m1.inputs[1])
m2 = nt.nodes.new("ShaderNodeMath")
m2.operation = "MULTIPLY"
nt.links.new(m1.outputs[0], m2.inputs[0])
nt.links.new(gim.outputs["Color"], em.inputs["Color"])
nt.links.new(m2.outputs[0], mixs.inputs["Fac"])
nt.links.new(tr.outputs[0], mixs.inputs[1])
nt.links.new(em.outputs[0], mixs.inputs[2])
nt.links.new(mixs.outputs[0], out.inputs[0])
for f, v in ((1, -0.3), (57, -0.3), (65, 1.3)):
    kv(sweep.inputs[0], f, v)
for f, v in ((1, 0.0), (57, 0.0), (60, 1.0), (66, 1.0), (74, 0.0)):
    kv(m2.inputs[1], f, v)
glow = face_plane("glow", None, WW * 1.0, WH * 1.0, -WT / 2 - 0.006, mat=glow_m)
hide_from_rays(glow)
glow.visible_camera = True


# ---------------- Gemini sparkle (top-right corner) ----------------
def sparkle_mesh(name, r=0.09, p=0.62, n=120, rings=12, h=0.03):
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
        for k in range(n):
            x, y = edge(2 * math.pi * k / n)
            rt.append(bm.verts.new((x * f, y * f, z))); rb.append(bm.verts.new((x * f, y * f, -z)))
        top.append(rt); bot.append(rb)
    for k in range(n):
        j = (k + 1) % n
        bm.faces.new((top_c, top[0][k], top[0][j])); bm.faces.new((bot_c, bot[0][j], bot[0][k]))
        for ri in range(rings - 1):
            bm.faces.new((top[ri][k], top[ri + 1][k], top[ri + 1][j], top[ri][j]))
            bm.faces.new((bot[ri][j], bot[ri + 1][j], bot[ri + 1][k], bot[ri][k]))
        bm.faces.new((top[-1][k], bot[-1][k], bot[-1][j], top[-1][j]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o)
    smooth(o)
    return o


star = sparkle_mesh("gem_star")
sm_ = mat_principled("star_m", "#4C8DF6", rough=0.15, coat=1.0, sss=0.3)
sb = sm_.node_tree.nodes["Principled BSDF"]
sb.inputs["Emission Color"].default_value = lin("#7FB0FF")
sb.inputs["Emission Strength"].default_value = 0.6
assign(star, sm_)
star.parent = win
key(star, 1, loc=(0.95, -0.09, -0.05), rot=(90, 0, 0), scale=0.9)
key(star, 25, loc=(1.0, -0.09, 0.17), rot=(90, 0, 60), scale=1.0)
key(star, 42, loc=(1.06, -0.09, 0.5), rot=(90, 0, 100), scale=1.0)
key(star, 56, loc=(1.11, -0.09, 0.63), rot=(90, 0, 135), scale=1.12)
key(star, 62, loc=(1.11, -0.09, 0.63), rot=(90, 0, 180), scale=1.0)
key(star, 110, loc=(1.11, -0.09, 0.63), rot=(90, 0, 180), scale=1.0)

# window settles out of the whip
key(win, 1, loc=(0.25, 0, 0.05), rot=(-16, 4, 14))
key(win, 8, loc=(0.05, 0, 0.0), rot=(-8, 1, 5))
key(win, 16, loc=(0, 0, 0), rot=(1.5, 0, -1.2))
key(win, 24, loc=(0, 0, 0), rot=(0, 0, 0))
key(win, 110, loc=(0, 0, 0), rot=(0, 0, 0))


# ---------------- result cards / spinning layers ----------------
def card_body(name, w, h, t=0.018, corner=0.045, cuts=28):
    o = slab(name, w, h, t, corner=corner, edge=0.006, segments=8)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    for i in range(1, cuts):
        x = -w / 2 + w * i / cuts
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(x, 0, 0), plane_no=(1, 0, 0))
    bm.to_mesh(o.data)
    bm.free()
    tw = o.modifiers.new("tw", "SIMPLE_DEFORM")
    tw.deform_method = "TWIST"
    tw.deform_axis = "X"
    tw.angle = 0.0
    return o


def layer_mat(name, color, grid_png=None, content_png=None):
    """Decal material: colour (or grid) -> content image crossfade via `fac` input."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.35
    b.inputs["Coat Weight"].default_value = 0.3
    rgb = nt.nodes.new("ShaderNodeRGB")
    rgb.outputs[0].default_value = lin(color)
    col_out, col_alpha = rgb.outputs[0], None
    if grid_png:
        gi = nt.nodes.new("ShaderNodeTexImage")
        gi.image = bpy.data.images.load(os.path.join(TEX, grid_png))
        gi.extension = "CLIP"
        col_out, col_alpha = gi.outputs["Color"], gi.outputs["Alpha"]
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    nt.links.new(col_out, mix.inputs[6])
    amix = nt.nodes.new("ShaderNodeMix")
    amix.data_type = "FLOAT"
    ci = None
    if content_png:
        ci = nt.nodes.new("ShaderNodeTexImage")
        ci.image = bpy.data.images.load(os.path.join(TEX, content_png))
        ci.interpolation = "Cubic"
        ci.extension = "CLIP"
        nt.links.new(ci.outputs["Color"], mix.inputs[7])
        nt.links.new(ci.outputs["Alpha"], amix.inputs[3])
    else:
        mix.inputs[7].default_value = lin(color)
        amix.inputs[3].default_value = 1.0
    if col_alpha is not None:
        nt.links.new(col_alpha, amix.inputs[2])
    elif ci is not None:
        nt.links.new(ci.outputs["Alpha"], amix.inputs[2])     # rounded silhouette from the content card
    else:
        amix.inputs[2].default_value = 1.0
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    nt.links.new(amix.outputs[0], b.inputs["Alpha"])
    return m, mix.inputs[0], amix.inputs[0]


# final layout in window-local x/z (measured off ref t 20.9), stack index (0 = bottom), colours
CARDS = [
    # name, x, z, w, h, stack_idx, colour, grid, content
    ("text", -0.55, 0.11, 0.87, 0.76, 7, G_YEL, None, "p7_text.png"),
    ("green", 0.30, 0.20, 0.62, 0.40, 6, G_GRN, None, None),
    ("info", 0.745, -0.09, 0.71, 0.36, 5, G_GRN, "p7_grid_green.png", "p7_info.png"),
    ("red2", 0.28, 0.12, 0.66, 0.30, 4, G_RED, None, None),
    ("portrait", 0.285, 0.31, 0.69, 0.365, 3, G_RED, None, "p7_portrait.png"),
    ("white", -0.35, 0.02, 0.95, 0.40, 2, "#FFFFFF", None, None),
    ("pug", 0.14, -0.09, 0.40, 0.36, 1, G_BLUE, "p7_grid_blue.png", "p7_pug.png"),
    ("mountain", 0.89, 0.31, 0.42, 0.365, 0, G_BLUE, None, "p7_mountain.png"),
]
FRONT_Y = -WT / 2 - 0.035
for (name, fx, fz, w, h, si, color, grid, content) in CARDS:
    body = card_body("card_" + name, w, h)
    bm_ = mat_principled("cardbody_" + name, color, rough=0.35, coat=0.4)
    bbc = bm_.node_tree.nodes["Principled BSDF"].inputs["Base Color"]
    assign(body, bm_)
    body.parent = win
    dm, cfac, afac = layer_mat("carddec_" + name, color, grid, content)
    bpy.ops.mesh.primitive_plane_add(size=1)
    dec = bpy.context.active_object
    dec.name = "dec_" + name
    dec.scale = (w * 0.995, h * 0.995, 1)
    bpy.ops.object.transform_apply(scale=True)
    assign(dec, dm)
    dec.parent = body
    dec.location = (0, 0, 0.0095)
    dec.visible_shadow = False
    # the decal can't follow the twist: hide it while the layers are ribbons
    for f, hid in ((1, True), (19, True), (20, False)):
        dec.hide_render = hid
        dec.keyframe_insert("hide_render", frame=f)
    tw = body.modifiers["tw"]
    for f, a in ((1, 230 + si * 25), (10, 150 + si * 18), (19, 40 + si * 6), (26, 0), (110, 0)):
        tw.angle = math.radians(a)
        body.keyframe_insert('modifiers["tw"].angle', frame=f)

    top_first = 7 - si                       # top layers unfold first
    fin = content is not None
    sx = lambda pw, ph: (pw / w, ph / h, 1.0)
    ph = 0.46
    # rising twisted ribbons -> spread spinning stack -> tight stack
    key(body, 1, loc=(0.05, -0.2, -1.75 + si * 0.09), rot=(0, 0, -620 - si * 30), scale=sx(0.8, 0.3))
    key(body, 7, loc=(0.02, -0.2, -1.45 + si * 0.1), rot=(-10, 0, -520 - si * 26), scale=sx(0.85, 0.34))
    key(body, 16, loc=(0.0, -0.2, -1.05 + si * 0.115), rot=(-4, 0, -330 - si * 20), scale=sx(0.9, 0.42))
    key(body, 26, loc=(0.0, -0.2, -0.88 + si * 0.12), rot=(0, 0, -190 - si * 14), scale=sx(0.95, ph))
    key(body, 39, loc=(0.0, -0.2, -0.30 + si * 0.078), rot=(0, 0, -60 - si * 7), scale=sx(1.1, 0.55))
    t0 = 43 + top_first * 0.5
    key(body, int(round(t0)), loc=(0.0, -0.2, -0.02 + si * 0.036), rot=(0, 0, -18 - si * 3), scale=sx(1.15, 0.6))
    # unfold: tilt up to face camera, spread to its slot (overshoot, then settle)
    mid = int(round(t0 + 3))
    ex, ez = fx * 0.55, fz * 0.55 + 0.12
    key(body, mid, loc=(ex, -0.32 - si * 0.02, ez), rot=(58, 0, -6 + (fx * 8)), scale=sx(0.5 * (1.15 + w), 0.5 * (0.6 + h)))
    land = int(round(t0 + 8))
    yslot = FRONT_Y - (0.012 if fin else -0.004) - 0.002 * si
    key(body, land, loc=(fx, yslot - 0.03, fz), rot=(93, 0, 1.5), scale=1.04)
    key(body, land + 4, loc=(fx, yslot, fz), rot=(90, 0, 0), scale=1.0)
    if fin:
        key(body, 110, loc=(fx, yslot, fz), rot=(90, 0, 0), scale=1.0)
        for f, v in ((1, 0.0), (land - 3, 0.0), (land + 5, 1.0), (110, 1.0)):
            kv(cfac, f, v)
            kv(afac, f, v)
        for f, c in ((1, lin(color)), (land - 3, lin(color)), (land + 5, lin("#ECEBE8"))):
            kv(bbc, f, c)
    else:   # colour-only layers sink back into the glass and vanish behind the content
        key(body, land + 8, loc=(fx * 0.9, FRONT_Y + 0.02, fz), rot=(90, 0, 0), scale=0.85)
        key(body, land + 12, loc=(fx * 0.85, FRONT_Y + 0.03, fz), rot=(90, 0, 0), scale=0.001)
        key(body, 110, loc=(fx * 0.85, FRONT_Y + 0.03, fz), rot=(90, 0, 0), scale=0.001)
        kv(cfac, 1, 0.0)
        kv(afac, 1, 0.0)


# ---------------- clay props ----------------
def revolve(name, profile, steps=96):
    """Spin a (r, z) profile around Z."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z)) for r, z in profile]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=math.radians(360), steps=steps,
                   use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o)
    smooth(o)
    return o


def ribbed_disc(name, R=0.3, H=0.1, ribs=6):
    prof = []
    n = 120
    for i in range(n + 1):
        r = R * i / n
        f = r / R
        z = H * math.sqrt(max(0, 1 - f ** 4)) * (0.82 + 0.18 * math.cos(2 * math.pi * ribs * f))
        prof.append((max(r, 1e-4), z))
    prof.append((R * 0.995, -H * 0.3))
    prof.append((R * 0.9, -H * 0.55))
    prof.append((1e-4, -H * 0.6))
    return revolve(name, prof)


def ribbed_cyl(name, R=0.16, L=0.8, ribs=14):
    prof = [(1e-4, -L / 2 - R * 0.1)]
    n = 200
    for i in range(n + 1):
        z = -L / 2 + L * i / n
        edge = min(1.0, (L / 2 - abs(z)) / (R * 0.5) + 0.25)
        r = R * math.sqrt(max(0.05, edge)) * (0.9 + 0.1 * abs(math.cos(math.pi * ribs * i / n)))
        prof.append((r, z))
    prof.append((1e-4, L / 2 + R * 0.1))
    o = revolve(name, prof)
    tex = bpy.data.textures.new(name + "_vor", "VORONOI")
    tex.noise_scale = 0.05
    dmod = o.modifiers.new("nubs", "DISPLACE")
    dmod.texture = tex
    dmod.strength = 0.018
    dmod.mid_level = 0.3
    return o


def clay(color, name, rough=0.45):
    return mat_principled(name, color, rough=rough, coat=0.25, sss=0.12)


props = []


def dotted_sphere(name, R, n, dot_r, depth, sub=6):
    """Sphere with n evenly spread round dimples (depth<0) or nubs (depth>0)."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=R)
    o = bpy.context.active_object
    o.name = name
    ga = math.pi * (3 - math.sqrt(5))
    cs = []
    for i in range(n):
        y = 1 - 2 * (i + 0.5) / n
        r = math.sqrt(1 - y * y)
        cs.append(Vector((math.cos(ga * i) * r, y, math.sin(ga * i) * r)))
    ang = dot_r / R
    for v in o.data.vertices:
        u = v.co.normalized()
        best = min(u.angle(c) for c in cs)
        if best < ang:
            k = best / ang
            v.co = u * (R + depth * (1 - k * k) ** 1.5 if depth < 0 else R + depth * math.sqrt(max(0, 1 - k * k)))
    smooth(o)
    return o

# yellow dimpled golf ball
yb = dotted_sphere("p_yball", 0.21, 34, 0.045, -0.022)
assign(yb, clay("#F2B92E", "yb_m"))
key(yb, 1, loc=(-2.0, -0.5, -0.85), rot=(10, 0, 0))
key(yb, 10, loc=(-1.9, -0.5, -0.75), rot=(15, 5, 10))
key(yb, 70, loc=(-1.42, -0.5, -0.2), rot=(40, 30, 80))
key(yb, 110, loc=(-1.4, -0.5, -0.1), rot=(55, 40, 110))
# blue dimpled disc (behind the window, left)
bd = dotted_sphere("p_bdisc", 0.36, 140, 0.035, 0.03)
bd.scale = (1, 1, 0.42)
bpy.context.view_layer.objects.active = bd
assign(bd, clay("#2F6FEA", "bd_m"))
key(bd, 1, loc=(-1.5, 0.55, -0.05), rot=(20, 70, 0), scale=(1, 1, 0.42))
key(bd, 10, loc=(-1.45, 0.55, 0.05), rot=(25, 65, 5), scale=(1, 1, 0.42))
key(bd, 70, loc=(-1.5, 0.6, 0.8), rot=(75, 20, 10), scale=(1, 1, 0.42))
key(bd, 110, loc=(-1.5, 0.6, 0.92), rot=(80, 12, 14), scale=(1, 1, 0.42))
# red ribbed disc (right, in front)
rd = ribbed_disc("p_rdisc", R=0.26, H=0.09)
assign(rd, clay("#EE3B3B", "rd_m", rough=0.4))
key(rd, 1, loc=(1.55, -0.3, -0.85), rot=(8, 35, -20))
key(rd, 10, loc=(1.5, -0.3, -0.75), rot=(12, 40, -20))
key(rd, 40, loc=(1.45, 0.0, -0.3), rot=(50, 55, -40))
key(rd, 70, loc=(1.45, 0.3, 0.0), rot=(88, 0, -40))
key(rd, 110, loc=(1.45, 0.3, 0.06), rot=(90, 4, -46))
# green ribbed cylinder (behind, right -> top-right)
gc = ribbed_cyl("p_gcyl", R=0.17, L=0.85)
assign(gc, clay("#34C759", "gc_m", rough=0.4))
key(gc, 1, loc=(1.55, 0.4, -0.35), rot=(90, 0, 10))
key(gc, 10, loc=(1.55, 0.45, -0.2), rot=(80, 0, 15))
key(gc, 70, loc=(1.6, 0.5, 0.8), rot=(62, 0, 64))
key(gc, 110, loc=(1.6, 0.5, 0.9), rot=(60, 0, 70))


def plus(name, color, arm=0.26, th=0.1, depth=0.1):
    a = slab(name + "_a", arm, th, depth, corner=th * 0.35, edge=0.02)
    b_ = slab(name + "_b", th, arm, depth, corner=th * 0.35, edge=0.02)
    m = clay(color, name + "_m", rough=0.35)
    assign(a, m); assign(b_, m)
    root = bpy.data.objects.new(name, None); sc.collection.objects.link(root)
    a.parent = root; b_.parent = root
    return root


rp = plus("p_rplus", "#EE3B3B", arm=0.28, th=0.11, depth=0.12)
key(rp, 1, loc=(0.25, 0.3, 0.55), rot=(80, 20, 10))
key(rp, 10, loc=(0.3, 0.3, 0.68), rot=(78, 10, 20))
key(rp, 40, loc=(0.42, 0.3, 0.92), rot=(70, -10, 35))
key(rp, 70, loc=(0.45, 0.3, 1.05), rot=(60, -30, 60))
key(rp, 110, loc=(0.45, 0.3, 1.12), rot=(55, -40, 75))
bx = plus("p_bx", "#3C7BF0", arm=0.34, th=0.11, depth=0.11)
key(bx, 1, loc=(2.0, -0.45, -1.6), rot=(70, 0, 45))
key(bx, 45, loc=(1.8, -0.45, -1.2), rot=(70, 10, 40))
key(bx, 70, loc=(1.45, -0.45, -0.78), rot=(75, 15, 35))
key(bx, 110, loc=(1.4, -0.45, -0.72), rot=(78, 18, 30))

# blue triangle cursor
bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=0.075, depth=0.03)
tri = bpy.context.active_object
tri.name = "p_cursor"
bev = tri.modifiers.new("b", "BEVEL"); bev.width = 0.014; bev.segments = 6
smooth(tri)
assign(tri, clay("#3F7FF0", "tri_m", rough=0.3))
tri.parent = win
key(tri, 1, loc=(-0.05, -0.2, -0.2), rot=(90, 0, 90))
key(tri, 10, loc=(-0.08, -0.2, -0.17), rot=(90, 0, 90))
key(tri, 25, loc=(0.1, -0.2, 0.62), rot=(90, 0, 80))
key(tri, 39, loc=(0.8, -0.2, 0.83), rot=(80, 10, 60))
key(tri, 48, loc=(0.2, -0.3, 0.7), rot=(70, 30, 30))
key(tri, 58, loc=(-0.95, -0.3, -0.25), rot=(80, 20, 10))
key(tri, 66, loc=(-1.05, -0.3, -0.33), rot=(85, 10, 0))
key(tri, 110, loc=(-1.07, -0.3, -0.36), rot=(88, 5, -6))

# foreground blue sticks + yellow stick (blurred)
st1 = pill("p_bstick", length=0.5, radius=0.045, color="#3C7BF0")
key(st1, 1, loc=(-1.6, -1.2, -1.7), rot=(30, 20, 0))
key(st1, 50, loc=(-1.5, -1.2, -1.3), rot=(25, 25, 0))
key(st1, 80, loc=(-1.35, -1.2, -0.92), rot=(22, 28, 0))
key(st1, 110, loc=(-1.32, -1.2, -0.86), rot=(20, 30, 0))
ys = pill("p_ystick", length=0.5, radius=0.04, color="#F2C230")
key(ys, 1, loc=(-2.35, 0.2, -0.2), rot=(0, 80, 10))
key(ys, 40, loc=(-2.4, 0.2, -0.02), rot=(0, 75, 14))
key(ys, 70, loc=(-2.9, 0.2, 0.25), rot=(0, 70, 18))
key(ys, 110, loc=(-3.0, 0.2, 0.3), rot=(0, 70, 20))

# ---------------- camera: whip in, hold, push, settle, pull back ----------------
bpy.ops.object.empty_add(location=(0, 0, 0)); aim = bpy.context.active_object
cam = camera(loc=(0.3, -6.2, 0.5), target=(0, 0, 0), lens=50, fstop=2.2, focus_obj=win)
tc_ = cam.constraints.new("TRACK_TO"); tc_.target = aim
tc_.track_axis = "TRACK_NEGATIVE_Z"; tc_.up_axis = "UP_Y"
key(aim, 1, loc=(-5.0, 0, 0.35))
key(aim, 4, loc=(-1.2, 0, 0.12))
key(aim, 8, loc=(0.08, 0, 0.0))
key(aim, 12, loc=(0, 0, 0.0))
key(aim, 110, loc=(0, 0, 0.0))
key(cam, 1, loc=(0.35, -6.3, 0.55))
key(cam, 10, loc=(0.25, -6.15, 0.5))
key(cam, 26, loc=(0.18, -6.0, 0.48))
key(cam, 39, loc=(0.1, -5.6, 0.45))
key(cam, 50, loc=(0.02, -4.95, 0.42))
key(cam, 86, loc=(0.0, -4.75, 0.38))
key(cam, 92, loc=(0.15, -8.2, 0.55))
key(cam, 110, loc=(0.3, -10.0, 0.65))
# stronger shutter for the whip and the pull-back
sc.render.motion_blur_shutter = 0.35
for f, v in ((1, 1.0), (6, 1.0), (10, 0.35), (86, 0.35), (88, 0.9), (94, 0.9), (98, 0.35)):
    sc.render.motion_blur_shutter = v
    sc.render.keyframe_insert("motion_blur_shutter", frame=f)

STUDIO = ("shelf", "post", "Plane", "Torus")
for o in list(sc.collection.objects):
    if o.type != "MESH" or o.name.startswith("Cube"):
        continue
    (bg_coll if o.name.startswith(STUDIO) else fg_coll).objects.link(o)

if os.environ.get("BGTEST"):   # background-only check of the blind stripes
    for o in list(win.children_recursive) + [win]:
        o.hide_render = True
render_shot("sh07_window", 110)
