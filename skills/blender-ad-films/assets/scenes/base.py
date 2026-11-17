"""Shared Acme 3D world: studio, sunlight through blinds, materials, props.

Every scene script imports this so the whole film shares one look.
"""
import bpy, bmesh, math, os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(ROOT, "tex")


def lin(hexstr):
    """sRGB hex -> linear RGBA tuple for Blender material inputs."""
    h = hexstr.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


LIME, INK, OLIVE, CREAM = "#EDFC47", "#0F0F0F", "#4A5A07", "#F7F7F7"


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def render_settings(w=1920, h=1080, samples=128, engine="CYCLES"):
    sc = bpy.context.scene
    sc.render.engine = engine
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    if engine == "CYCLES":
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        try:  # background Metal kernel specialization crashed Blender 5.2 mid-render
            prefs.kernel_optimization_level = "OFF"
        except Exception:
            pass
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = "GPU"
        sc.cycles.samples = samples
        sc.cycles.use_denoising = True
        sc.cycles.use_adaptive_sampling = True
        sc.cycles.max_bounces = 8
        sc.cycles.transmission_bounces = 8
        sc.cycles.caustics_reflective = False
        sc.cycles.caustics_refractive = False
    vs = sc.view_settings
    # Khronos PBR Neutral keeps brand colors (AgX washes the lime out)
    try:
        vs.view_transform = "Khronos PBR Neutral"
    except TypeError:
        vs.view_transform = "Standard"
    vs.look = "None"
    vs.exposure = -0.35


def mat_principled(name, color, rough=0.4, coat=0.0, transmission=0.0,
                   sss=0.0, metallic=0.0, ior=1.45):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = lin(color) if isinstance(color, str) else color
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    b.inputs["IOR"].default_value = ior
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = 0.08
    b.inputs["Transmission Weight"].default_value = transmission
    b.inputs["Subsurface Weight"].default_value = sss
    if sss:
        b.inputs["Subsurface Radius"].default_value = (0.2, 0.2, 0.2)
        b.inputs["Subsurface Scale"].default_value = 0.05
    return m


def mat_image(name, path, rough=0.45):
    """UI texture material with alpha cut-out (for UI decals on panels)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    img = nt.nodes.new("ShaderNodeTexImage")
    img.image = bpy.data.images.load(path)
    img.interpolation = "Cubic"
    nt.links.new(img.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(img.outputs["Alpha"], b.inputs["Alpha"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = 0.4
    b.inputs["Coat Roughness"].default_value = 0.06
    try:
        m.surface_render_method = "DITHERED"
    except Exception:
        pass
    return m


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True


def rounded_box(name, size, bevel, segments=10, loc=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    mod = o.modifiers.new("bevel", "BEVEL")
    mod.width = bevel
    mod.segments = segments
    mod.limit_method = "NONE"
    mod.harden_normals = False
    smooth(o)
    return o


def studio(wall_color="#F2F3F5", floor_color="#EEEFF1", sky=(0.62, 0.72, 0.95), sky_strength=0.55):
    """Seamless white cyclorama + blue sky fill (gives the cool shadows)."""
    world = bpy.data.worlds.new("sky")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*sky, 1)
    bg.inputs["Strength"].default_value = sky_strength

    # cyclorama: flat floor to y=wall_y-r, quarter circle of radius r, then vertical wall
    wall_y, r = 4.0, 3.0
    prof_pts = [(-14.0, 0.0), (wall_y - r, 0.0)]
    for i in range(1, 17):
        a = (math.pi / 2) * i / 16
        prof_pts.append((wall_y - r + r * math.sin(a), r - r * math.cos(a)))
    prof_pts.append((wall_y, 16.0))
    me = bpy.data.meshes.new("cyclorama")
    verts, faces = [], []
    for x in (-25.0, 25.0):
        for (y, z) in prof_pts:
            verts.append((x, y, z))
    n = len(prof_pts)
    for i in range(n - 1):
        faces.append((i, i + 1, n + i + 1, n + i))
    me.from_pydata(verts, [], faces)
    prof = bpy.data.objects.new("cyclorama", me)
    bpy.context.collection.objects.link(prof)
    smooth(prof)
    assign(prof, mat_principled("cyc", wall_color, rough=0.85))
    return prof


def sun_with_blinds(direction=(-35, 0, 40), strength=4.5, color=(1.0, 0.95, 0.88),
                    slat_count=18, slat_gap=0.55, slat_width=0.32, dist=9.0, tilt=28):
    """Sun + an invisible venetian blind between sun and set -> stripe shadows."""
    bpy.ops.object.light_add(type="SUN")
    sun = bpy.context.active_object
    sun.name = "sun"
    sun.data.energy = strength
    sun.data.color = color
    sun.data.angle = math.radians(1.2)
    rx, ry, rz = (math.radians(a) for a in direction)
    sun.rotation_euler = (rx, ry, rz)
    fwd = sun.matrix_world.to_quaternion() @ Vector((0, 0, -1))  # light travel dir

    blinds = []
    center = -fwd * dist
    for i in range(slat_count):
        off = (i - slat_count / 2) * slat_gap
        bpy.ops.mesh.primitive_cube_add(size=1)
        s = bpy.context.active_object
        s.name = f"slat_{i:02d}"
        s.scale = (30, slat_width, 0.02)
        s.rotation_euler = (math.radians(tilt), 0, 0)
        s.location = center + Vector((0, off * math.cos(math.radians(20)), off))
        s.visible_camera = False
        s.visible_glossy = False
        s.visible_diffuse = False
        s.visible_transmission = False
        s.visible_volume_scatter = False
        blinds.append(s)
    # parent slats to an empty aligned with the sun so they sit across its beam
    bpy.ops.object.empty_add(location=(0, 0, 0))
    rig = bpy.context.active_object
    rig.name = "blinds_rig"
    for s in blinds:
        s.parent = rig
    rig.rotation_euler = (rx, ry, rz)
    rig.location = (0, 0, 0)
    for s in blinds:
        s.location = Vector((0, (int(s.name[-2:]) - slat_count / 2) * slat_gap, dist))
        s.rotation_euler = (math.radians(tilt), 0, 0)
    return sun, rig


def camera(loc, target, lens=50, fstop=2.8, focus_obj=None):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam
    cam.data.lens = lens
    direction = Vector(target) - Vector(loc)
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = fstop
    if focus_obj:
        cam.data.dof.focus_object = focus_obj
    else:
        cam.data.dof.focus_distance = direction.length
    return cam


def slab(name, w, h, t, corner=0.18, edge=None, segments=12):
    """Rounded-rectangle slab: big corner radius in plan, soft small bevel on the faces."""
    edge = edge if edge is not None else t * 0.35
    bm = bmesh.new()
    pts = []
    cx, cy = w / 2 - corner, h / 2 - corner
    for qx, qy, a0 in ((cx, cy, 0), (-cx, cy, 90), (-cx, -cy, 180), (cx, -cy, 270)):
        for i in range(segments + 1):
            a = math.radians(a0 + 90 * i / segments)
            pts.append((qx + corner * math.cos(a), qy + corner * math.sin(a)))
    bot = [bm.verts.new((x, y, -t / 2)) for x, y in pts]
    top = [bm.verts.new((x, y, t / 2)) for x, y in pts]
    bm.faces.new(top)
    bm.faces.new(list(reversed(bot)))
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bot[i], bot[j], top[j], top[i]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    mod = o.modifiers.new("bevel", "BEVEL")
    mod.width = edge
    mod.segments = 6
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(60)
    mod.use_clamp_overlap = True
    smooth(o)
    o.data.shade_smooth() if hasattr(o.data, "shade_smooth") else None
    return o


# ---------- props ----------

def d_logo(name="d_logo", height=1.0, depth=0.28, color=LIME, loc=(0, 0, 0)):
    """Placeholder logo mark, extruded with rounded edges. Swap the two point loops for your own logo outline (80x96 box)."""
    outer = [(12, 0), (68, 0), (80, 12), (80, 84), (68, 96), (12, 96), (0, 84), (0, 12)]
    inner = [(20, 20), (60, 20), (60, 76), (20, 76)]
    s = height / 96.0
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    for loop in (outer, inner):
        sp = cu.splines.new("POLY")
        sp.points.add(len(loop) - 1)
        for i, (x, y) in enumerate(loop):
            sp.points[i].co = ((x - 40) * s, (48 - y) * s, 0, 1)
        sp.use_cyclic_u = True
    cu.extrude = depth / 2
    cu.bevel_depth = 0.035 * height
    cu.bevel_resolution = 6
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.location = loc
    assign(o, mat_principled(name + "_m", color, rough=0.32, coat=0.5, sss=0.05))
    return o


def pill(name, length=1.0, radius=0.18, color=INK, loc=(0, 0, 0), rot=(0, 0, 0), rough=0.25):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=length, vertices=48, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    mod = o.modifiers.new("bevel", "BEVEL")
    mod.width = radius * 0.98
    mod.segments = 12
    mod.limit_method = "ANGLE"
    smooth(o)
    assign(o, mat_principled(name + "_m", color, rough=rough, coat=0.6))
    return o


def dimple_ball(name, radius=0.35, color=LIME, loc=(0, 0, 0)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=6, radius=radius, location=loc)
    o = bpy.context.active_object
    o.name = name
    tex = bpy.data.textures.new(name + "_vor", "VORONOI")
    tex.noise_scale = 0.09
    tex.distance_metric = "DISTANCE"
    d = o.modifiers.new("dimples", "DISPLACE")
    d.texture = tex
    d.strength = -0.035
    d.mid_level = 0.0
    smooth(o)
    assign(o, mat_principled(name + "_m", color, rough=0.45, sss=0.08))
    return o


def ring(name, major=0.4, minor=0.12, color=LIME, loc=(0, 0, 0), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=96,
                                     minor_segments=32, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    smooth(o)
    assign(o, mat_principled(name + "_m", color, rough=0.3, coat=0.5))
    return o


def ui_panel(name, tex_file, width=2.0, thickness=0.14, loc=(0, 0, 0), rot=(0, 0, 0),
             body_color="#E9EDF2", frosted=True):
    """Thick rounded frosted slab with the UI texture laid on its front face."""
    img = bpy.data.images.load(os.path.join(TEX, tex_file))
    aspect = img.size[1] / img.size[0]
    h = width * aspect
    body = slab(name, width, h, thickness, corner=min(width, h) * 0.09)
    body_mat = mat_principled(name + "_body", body_color, rough=0.22 if frosted else 0.35,
                              coat=1.0, transmission=0.55 if frosted else 0.0, ior=1.45)
    assign(body, body_mat)
    # UI decal just in front of the face
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, thickness / 2 + 0.004))
    face = bpy.context.active_object
    face.name = name + "_ui"
    face.scale = (width * 0.9, h * 0.9, 1)
    bpy.ops.object.transform_apply(scale=True)
    assign(face, mat_image(name + "_ui_m", os.path.join(TEX, tex_file)))
    face.parent = body
    face.location = (0, 0, thickness / 2 + 0.006)  # on the front face, not inside the glass
    face.visible_glossy = False        # no ghost copy reflected inside the glass
    face.visible_transmission = False
    face.visible_shadow = False        # a decal casting a shadow on its own glass reads as ghost text
    body.location = loc
    body.rotation_euler = tuple(math.radians(a) for a in rot)
    return body


# ---------- animation + render driver ----------

FPS = 24


def key(obj, frame, loc=None, rot=None, scale=None, interp="BEZIER"):
    """Keyframe loc (tuple), rot (degrees tuple), scale (float or tuple)."""
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert("location", frame=frame)
    if rot is not None:
        obj.rotation_euler = tuple(math.radians(a) for a in rot)
        obj.keyframe_insert("rotation_euler", frame=frame)
    if scale is not None:
        obj.scale = (scale,) * 3 if isinstance(scale, (int, float)) else scale
        obj.keyframe_insert("scale", frame=frame)
    ad = obj.animation_data
    if ad and ad.action:
        fcurves = []
        try:
            fcurves = list(ad.action.fcurves)
        except AttributeError:  # Blender 5 layered actions
            for layer in ad.action.layers:
                for strip in layer.strips:
                    for cb in strip.channelbags:
                        fcurves.extend(cb.fcurves)
        for fc in fcurves:
            for kp in fc.keyframe_points:
                if int(kp.co.x) == frame:
                    kp.interpolation = interp
                    kp.easing = "AUTO"


def look_rot(frm, to):
    """Euler (degrees) that points a camera at `to` from `frm`."""
    q = (Vector(to) - Vector(frm)).to_track_quat("-Z", "Y")
    return tuple(math.degrees(a) for a in q.to_euler())


def cam_key(cam, frame, loc, target, lens=None):
    key(cam, frame, loc=loc, rot=look_rot(loc, target))
    if lens:
        cam.data.lens = lens
        cam.data.keyframe_insert("lens", frame=frame)


def render_shot(shot, frames, preview=None):
    """PREVIEW=1 -> 960x540, 16 spp. STILL=<frame> -> one frame. Otherwise full."""
    sc = bpy.context.scene
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = 1, frames
    sc.render.use_motion_blur = True
    sc.render.use_persistent_data = True  # keep BVH/textures between frames
    sc.render.motion_blur_shutter = 0.35
    preview = os.environ.get("PREVIEW") == "1" if preview is None else preview
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
    sc.render.use_overwrite = False     # resume: skip frames already on disk
    sc.render.use_placeholder = False
    bpy.ops.render.render(animation=True)
    print("RENDERED", out_dir)


# ---------- desk world ----------

def emissive_image(name, path, strength=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    img = nt.nodes.new("ShaderNodeTexImage")
    img.image = bpy.data.images.load(path)
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = strength
    gl = nt.nodes.new("ShaderNodeBsdfGlossy")
    gl.inputs["Roughness"].default_value = 0.08
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.06
    nt.links.new(img.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs[0], mix.inputs[1])
    nt.links.new(gl.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    return m


def laptop(loc=(0, 0, 0), width=1.4, screen_tex="dashboard.png", open_deg=102):
    """Rounded laptop: base slab, hinged screen slab, emissive screen. Returns (root, screen_plane)."""
    h = width * 0.625
    alu = mat_principled("alu", "#D9DCE1", rough=0.32, metallic=0.85)
    bezel = mat_principled("bezel", "#141414", rough=0.3)
    bpy.ops.object.empty_add(location=loc)
    root = bpy.context.active_object
    root.name = "laptop"
    base = slab("lap_base", width, h * 1.0, 0.035, corner=0.06, edge=0.012)
    assign(base, alu)
    base.parent = root
    base.location = (0, -h / 2, 0.0175)
    # keyboard well
    kb = slab("lap_kb", width * 0.86, h * 0.42, 0.006, corner=0.02, edge=0.002)
    assign(kb, mat_principled("kbm", "#2A2A2E", rough=0.5))
    kb.parent = root
    kb.location = (0, -h * 0.40, 0.036)
    bpy.ops.object.empty_add(location=(0, 0, 0.035))
    hinge = bpy.context.active_object
    hinge.name = "lap_hinge"
    hinge.parent = root
    lid = slab("lap_lid", width, h, 0.022, corner=0.06, edge=0.008)
    assign(lid, bezel)
    lid.parent = hinge
    lid.rotation_euler = (math.radians(90), 0, 0)
    lid.location = (0, 0, h / 2)
    back = slab("lap_back", width * 1.002, h * 1.002, 0.012, corner=0.06, edge=0.005)
    assign(back, alu)
    back.parent = lid
    back.location = (0, 0, -0.012)
    bpy.ops.mesh.primitive_plane_add(size=1)
    scr = bpy.context.active_object
    scr.name = "lap_screen"
    scr.scale = (width * 0.94, h * 0.9, 1)
    bpy.ops.object.transform_apply(scale=True)
    assign(scr, emissive_image("screen_m", os.path.join(TEX, screen_tex), strength=1.1))
    scr.parent = lid
    scr.location = (0, 0.0, 0.0115)  # lid local +z faces the keyboard / viewer once stood up
    hinge.rotation_euler = (math.radians(-(open_deg - 90)), 0, 0)  # negative = lid leans back
    root.location = loc
    return root, scr


def mug(loc, color=LIME, r=0.13, h=0.26):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=64, location=(loc[0], loc[1], loc[2] + h / 2))
    o = bpy.context.active_object
    o.name = "mug"
    sol = o.modifiers.new("shell", "SOLIDIFY")
    sol.thickness = 0.018
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(o.data)
    top = [f for f in bm.faces if f.normal.z > 0.9]
    bmesh.ops.delete(bm, geom=top, context="FACES")
    bmesh.update_edit_mesh(o.data)
    bpy.ops.object.mode_set(mode="OBJECT")
    bev = o.modifiers.new("bevel", "BEVEL")
    bev.width = 0.01
    bev.segments = 4
    smooth(o)
    assign(o, mat_principled("mug_m", color, rough=0.3, coat=0.6))
    ring("mug_handle", major=0.07, minor=0.018, color=color, loc=(loc[0] + r + 0.04, loc[1], loc[2] + h * 0.55),
         rot=(math.radians(90), 0, 0))
    return o


def headset(loc, color=INK, rot_z=0):
    bpy.ops.object.empty_add(location=loc)
    root = bpy.context.active_object
    root.name = "headset"
    band = ring("hs_band", major=0.2, minor=0.022, color=color, loc=(0, 0, 0.2), rot=(math.radians(90), 0, 0))
    # keep only the upper half of the band
    bpy.context.view_layer.objects.active = band
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(band.data)
    low = [v for v in bm.verts if v.co.y < -0.02]  # torus local: rotated, so local y maps to world -z
    bmesh.ops.delete(bm, geom=low, context="VERTS")
    bmesh.update_edit_mesh(band.data)
    bpy.ops.object.mode_set(mode="OBJECT")
    band.parent = root
    for sx in (-1, 1):
        cup = pill(f"hs_cup{sx}", length=0.09, radius=0.075, color=color, loc=(sx * 0.2, 0, 0.08),
                   rot=(0, math.radians(90), 0))
        cup.parent = root
        pad = ring(f"hs_pad{sx}", major=0.05, minor=0.02, color=LIME, loc=(sx * 0.155, 0, 0.08),
                   rot=(0, math.radians(90), 0))
        pad.parent = root
    root.rotation_euler = (0, 0, math.radians(rot_z))
    return root


def desk(loc=(0, 0, 0), w=4.2, d=1.6, top_h=0.78):
    top = slab("desk_top", w, d, 0.06, corner=0.08, edge=0.02)
    assign(top, mat_principled("desk_m", "#FAFAF7", rough=0.45, coat=0.2))
    top.location = (loc[0], loc[1], top_h - 0.03)
    legm = mat_principled("leg_m", INK, rough=0.35, coat=0.3)
    for sx in (-1, 1):
        for sy in (-1, 1):
            l = pill(f"leg{sx}{sy}", length=top_h - 0.06, radius=0.035, color=INK,
                     loc=(loc[0] + sx * (w / 2 - 0.2), loc[1] + sy * (d / 2 - 0.15), (top_h - 0.06) / 2))
            assign(l, legm)
    return top_h


def book_stack(loc, colors=(INK, LIME, OLIVE, "#FFFFFF")):
    z = loc[2]
    for i, c in enumerate(colors):
        t = 0.05 + 0.01 * (i % 2)
        b = slab(f"book{i}", 0.42 - i * 0.03, 0.3, t, corner=0.015, edge=0.006)
        assign(b, mat_principled(f"book{i}_m", c, rough=0.5))
        b.location = (loc[0] + (i % 2) * 0.02, loc[1], z + t / 2)
        b.rotation_euler = (0, 0, math.radians((-6, 4, -2, 7)[i % 4]))
        z += t
    return z
