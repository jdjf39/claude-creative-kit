"""Shot 3 (2.5 s = 60 f), reference 6.0-8.45 s: top-down tiled floor in window light, a sparkle grows into
the Gemini star, rainbow lines run along the tile grooves, the star puffs up into jelly and lifts as the camera tilts."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from base import reset, render_settings, camera, key, cam_key, mat_principled, assign, smooth, render_shot, lin
import desk_world as dw

reset()
render_settings(1920, 1080)
sc = bpy.context.scene
dw.grade(sc)
sc.view_settings.exposure = 0.2
dw.world_fill(color=(0.5, 0.52, 0.98), strength=1.35)

# window light: one big pane -> a broad diagonal light band on the floor
bpy.ops.object.light_add(type="SUN")
sun = bpy.context.active_object
sun.data.energy = 5.5; sun.data.color = (1.0, 0.93, 0.85); sun.data.angle = math.radians(1.5)
sun.rotation_euler = (math.radians(40), 0, math.radians(35))
bpy.ops.object.empty_add(); rig = bpy.context.active_object; rig.rotation_euler = sun.rotation_euler
for (sx, sy, cx, cy) in ((60, 30, 0, 15.35), (60, 30, 0, -15.35)):
    bpy.ops.mesh.primitive_cube_add(size=1); b = bpy.context.active_object
    b.scale = (sx, sy, 0.02); b.parent = rig; b.location = (cx, cy, 6)
    for a in ("visible_camera", "visible_glossy", "visible_diffuse", "visible_transmission"):
        setattr(b, a, False)
rig.location = (0.36, -0.36, 0)

# tiled floor: tiles with rounded edges and grooves; the star sits on a groove crossing at the origin
T, gap = 2.2, 0.012
tile_m = mat_principled("tile_m", "#F3F2F6", rough=0.35, coat=0.3)
groove_m = mat_principled("groove_m", "#B9B7CC", rough=0.7)
bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, -0.012)); g = bpy.context.active_object; assign(g, groove_m)
for ix in range(-2, 2):
    for iy in range(-2, 2):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(ix * T + T / 2, iy * T + T / 2, -0.01))
        t = bpy.context.active_object
        t.scale = (T - gap, T - gap, 0.02)
        bev = t.modifiers.new("b", "BEVEL"); bev.width = 0.008; bev.segments = 4
        assign(t, tile_m)

# rainbow lines growing along the four grooves from the crossing
arms = [((1, 0), "#3B6CF0"), ((-1, 0), "#E8453C"), ((0, 1), "#9B59D0"), ((0, -1), "#F2C230")]
for i, ((dx, dy), col) in enumerate(arms):
    bpy.ops.object.empty_add(location=(0, 0, -0.004)); piv = bpy.context.active_object
    bpy.ops.mesh.primitive_cube_add(size=1); ln = bpy.context.active_object
    ln.scale = (3.0, 0.012, 0.006); ln.parent = piv; ln.location = (1.5, 0, 0)
    m = mat_principled(f"line{i}_m", col, rough=0.3)
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Emission Color"].default_value = lin(col); b.inputs["Emission Strength"].default_value = 4.0
    assign(ln, m)
    es = b.inputs["Emission Strength"]
    for f, v in ((1, 4.0), (36, 4.0), (56, 0.0)):
        es.default_value = v; es.keyframe_insert("default_value", frame=f)
    bc = b.inputs["Base Color"]
    for f, c in ((1, lin(col)), (36, lin(col)), (56, lin("#8E8BA3"))):
        bc.default_value = c; bc.keyframe_insert("default_value", frame=f)
    piv.rotation_euler = (0, 0, math.atan2(dy, dx))
    key(piv, 1, scale=(0.001, 1, 1)); key(piv, 8, scale=(0.02, 1, 1)); key(piv, 30, scale=(1, 1, 1))
    key(piv, 60, scale=(1, 1, 1))

# the star: a concave 4-point sparkle, extruded + bevelled so it reads as a soft jelly
def sparkle_mesh(name, r=0.15, p=0.62, n=240, rings=24, h=0.07):
    """Inflated sparkle: vertex at fraction f of the boundary radius gets z = +-h*sqrt(1-f^2) -> soft jelly lens."""
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
            rt.append(bm.verts.new((x * f, y * f, z)))
            rb.append(bm.verts.new((x * f, y * f, -z)))
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
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    smooth(o)
    return o

star = sparkle_mesh("star")
# Gemini gradient: angle around the centre drives a colour ramp (red / yellow / green / blue / pink)
m = bpy.data.materials.new("star_m"); m.use_nodes = True; nt = m.node_tree
b = nt.nodes["Principled BSDF"]
tc = nt.nodes.new("ShaderNodeTexCoord"); grad = nt.nodes.new("ShaderNodeTexGradient"); grad.gradient_type = "RADIAL"
ramp = nt.nodes.new("ShaderNodeValToRGB")
cr = ramp.color_ramp
stops = [(0.0, "#8FB4FF"), (0.2, "#C9A8FF"), (0.38, "#FF8FB0"), (0.55, "#FFD97A"), (0.74, "#8BE8A8"), (1.0, "#8FB4FF")]
cr.elements[0].position, cr.elements[0].color = stops[0][0], lin(stops[0][1])
cr.elements[1].position, cr.elements[1].color = stops[-1][0], lin(stops[-1][1])
for pos, col in stops[1:-1]:
    e = cr.elements.new(pos); e.color = lin(col)
nt.links.new(tc.outputs["Object"], grad.inputs["Vector"])
nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
ramp2 = nt.nodes.new("ShaderNodeValToRGB"); cr2 = ramp2.color_ramp
sat = [(0.0, "#1F5BFF"), (0.2, "#6A3CFF"), (0.38, "#FF1E3C"), (0.55, "#FFB300"), (0.74, "#00C24A"), (1.0, "#1F5BFF")]
cr2.elements[0].position, cr2.elements[0].color = sat[0][0], lin(sat[0][1])
cr2.elements[1].position, cr2.elements[1].color = sat[-1][0], lin(sat[-1][1])
for pos, col in sat[1:-1]:
    e = cr2.elements.new(pos); e.color = lin(col)
nt.links.new(grad.outputs["Fac"], ramp2.inputs["Fac"])
mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
nt.links.new(ramp.outputs["Color"], mix.inputs[6]); nt.links.new(ramp2.outputs["Color"], mix.inputs[7])
nt.links.new(mix.outputs[2], b.inputs["Base Color"])
fac = mix.inputs[0]
for f, v in ((1, 0.0), (34, 0.0), (52, 1.0), (60, 1.0)):
    fac.default_value = v; fac.keyframe_insert("default_value", frame=f)
b.inputs["Roughness"].default_value = 0.1
b.inputs["Coat Weight"].default_value = 1.0
b.inputs["Subsurface Weight"].default_value = 0.4
b.inputs["Subsurface Radius"].default_value = (0.3, 0.3, 0.3); b.inputs["Subsurface Scale"].default_value = 0.08
assign(star, m)

# sparkle: tiny -> flat star (0-1.2 s) -> puffs up and lifts, turning (1.2-2.5 s)
key(star, 1, loc=(0, 0, 0.0), rot=(0, 0, 0), scale=(0.001, 0.001, 0.001))
key(star, 6, loc=(0, 0, 0.0), rot=(0, 0, 0), scale=(0.08, 0.08, 0.05))
key(star, 24, loc=(0, 0, 0.005), rot=(0, 0, 0), scale=(1.0, 1.0, 0.12))
key(star, 34, loc=(0, 0, 0.01), rot=(0, 0, -3), scale=(1.0, 1.0, 0.2))
key(star, 48, loc=(0, 0, 0.09), rot=(-4, 3, -6), scale=(1.05, 1.05, 1.0))
key(star, 60, loc=(0, 0, 0.13), rot=(-5, 4, -9), scale=(1.05, 1.05, 1.0))

cam = camera(loc=(0, -0.001, 2.6), target=(0, 0, 0), lens=45, fstop=4.0, focus_obj=star)
bpy.ops.object.empty_add(location=(0, 0, 0)); aim = bpy.context.active_object
tc_ = cam.constraints.new("TRACK_TO"); tc_.target = aim; tc_.track_axis = "TRACK_NEGATIVE_Z"; tc_.up_axis = "UP_Y"
key(cam, 1, loc=(0.0, -0.001, 2.6))
key(cam, 30, loc=(0.0, -0.05, 2.35))
key(cam, 60, loc=(0.18, -0.6, 0.5))
key(aim, 1, loc=(0, 0, 0)); key(aim, 30, loc=(0, 0, 0)); key(aim, 60, loc=(0, 0, 0.11))
render_shot("sh03_star", 60)
