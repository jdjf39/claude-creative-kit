"""The toy desk set from the reference (shots 1, 2 and 8).

Units are metres, real scale: laptop ~0.31 m wide, desk top at 0.74 m.
Axes: +x right, +y into the wall (wall plane at y = WALL_Y), +z up.
"""
import bpy, bmesh, math, os
from mathutils import Vector
from base import (lin, reset, mat_principled, mat_image, assign, smooth, slab, pill, ring,
                  emissive_image, key, cam_key, look_rot, TEX, ROOT)

G_BLUE, G_RED, G_YEL, G_GRN = "#2F6BE0", "#E8453C", "#F2B316", "#34A853"
WALL, DESK_TOP = "#F4F1EC", "#F6F3EE"
WALL_Y = 0.42
TOP_Z = 0.74


def grade(scene):
    vs = scene.view_settings
    vs.view_transform = "AgX"
    for look in ("AgX - Punchy", "Punchy", "AgX - Medium High Contrast"):
        try:
            vs.look = look
            break
        except TypeError:
            pass
    vs.exposure = 0.45


def box(name, size, loc, color, rough=0.5, bevel=0.004, rot=(0, 0, 0), coat=0.0):
    o = slab(name, size[0], size[1], size[2], corner=min(size[0], size[1]) * 0.08 + 1e-4, edge=bevel)
    o.location = loc
    o.rotation_euler = tuple(math.radians(a) for a in rot)
    assign(o, mat_principled(name + "_m", color, rough=rough, coat=coat))
    return o


def window_light(sun_dir=(56, 0, -50), strength=9.0):
    """Sun through a 4-pane window: an invisible wall-with-opening + mullions between sun and set."""
    bpy.ops.object.light_add(type="SUN")
    sun = bpy.context.active_object
    sun.data.energy = strength
    sun.data.color = (1.0, 0.85, 0.66)
    sun.data.angle = math.radians(0.8)
    sun.rotation_euler = tuple(math.radians(a) for a in sun_dir)
    bpy.ops.object.empty_add()
    rig = bpy.context.active_object
    rig.rotation_euler = sun.rotation_euler
    d = 4.0  # occluder distance along the light
    bars = []
    ow, oh, t = 1.6, 1.1, 0.07   # opening size and frame bar thickness
    big = 20
    for (sx, sy, cx, cy) in (
        (big, big, 0, oh / 2 + big / 2), (big, big, 0, -oh / 2 - big / 2),
        (big, oh, -ow / 2 - big / 2, 0), (big, oh, ow / 2 + big / 2, 0),
        (t, oh, 0, 0), (ow, t, 0, 0), (t, oh, -ow / 4, 0), (t, oh, ow / 4, 0)):
        bpy.ops.mesh.primitive_cube_add(size=1)
        b = bpy.context.active_object
        b.scale = (sx, sy, 0.02)
        b.parent = rig
        b.location = (cx, cy, d)
        for attr in ("visible_camera", "visible_glossy", "visible_diffuse", "visible_transmission"):
            setattr(b, attr, False)
        bars.append(b)
    rig.location = (-0.2, WALL_Y - 0.3, TOP_Z + 0.2)
    return sun, rig


def world_fill(color=(0.58, 0.62, 0.92), strength=0.75):
    w = bpy.data.worlds.new("sky")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*color, 1)
    bg.inputs["Strength"].default_value = strength


def pegboard(loc, w=0.62, h=0.36):
    pb = box("pegboard", (w, h, 0.018), loc, G_BLUE, rough=0.55, rot=(90, 0, 0))
    holes = mat_principled("hole_m", "#10224F", rough=0.8)
    for ix in range(6):
        for iy in range(3):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.009, depth=0.004, vertices=16,
                                                location=(loc[0] - w / 2 + 0.06 + ix * (w - 0.12) / 5,
                                                          loc[1] - 0.0095, loc[2] - h / 2 + 0.06 + iy * 0.12),
                                                rotation=(math.radians(90), 0, 0))
            assign(bpy.context.active_object, holes)
    box("peg_shelf", (w * 0.55, 0.06, 0.012), (loc[0] - 0.04, loc[1] - 0.04, loc[2] + 0.1), G_BLUE, rough=0.5)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.07, vertices=48, location=(loc[0] - 0.02, loc[1] - 0.04, loc[2] + 0.141))
    jar = bpy.context.active_object
    smooth(jar)
    assign(jar, mat_principled("jar_m", "#AFC6F2", rough=0.08, transmission=0.9))


def wire_grid(loc, w=0.8, h=0.3, pitch=0.035):
    gold = mat_principled("gold_m", "#D9A441", rough=0.3, metallic=1.0)
    for i in range(int(w / pitch) + 1):
        x = loc[0] - w / 2 + i * pitch
        o = pill(f"gv{i}", length=h, radius=0.0022, loc=(x, loc[1] - 0.01, loc[2]))
        assign(o, gold)
    for j in range(int(h / pitch) + 1):
        z = loc[2] - h / 2 + j * pitch
        o = pill(f"gh{j}", length=w, radius=0.0022, loc=(loc[0], loc[1] - 0.013, z), rot=(0, math.radians(90), 0))
        assign(o, gold)
    # sticky notes + clipped note + binder clips
    n1 = box("note_red", (0.13, 0.12, 0.004), (loc[0] - 0.06, loc[1] - 0.02, loc[2] + 0.06), G_RED, rough=0.7, rot=(90, 0, -3))
    n2 = box("note_green", (0.12, 0.13, 0.004), (loc[0] + 0.12, loc[1] - 0.03, loc[2] - 0.02), G_GRN, rough=0.7, rot=(84, 0, 6))
    for k, (dx, dz) in enumerate(((0.33, 0.07), (0.36, -0.02))):
        box(f"clip{k}", (0.03, 0.025, 0.012), (loc[0] + dx, loc[1] - 0.02, loc[2] + dz), "#D9A441", rough=0.3, rot=(90, 0, 0))
    return n1, n2


def wall_pencils(loc):
    cols = [G_YEL, G_GRN, G_RED]
    for i, c in enumerate(cols):
        bpy.ops.object.empty_add(location=(loc[0] + i * 0.13, loc[1] - 0.02, loc[2]))
        piv = bpy.context.active_object
        body = pill(f"wpen{i}", length=0.16, radius=0.006, color="#EDE7DD", loc=(0, 0, 0), rot=(0, math.radians(90), 0))
        tip = pill(f"wtip{i}", length=0.03, radius=0.0065, color=c, loc=(0.085, 0, 0), rot=(0, math.radians(90), 0))
        body.parent = piv
        tip.parent = piv
        piv.rotation_euler = (0, math.radians(-28), 0)


def file_tray(loc):
    wire = mat_principled("tray_wire", "#1D2B1F", rough=0.35, metallic=0.6)
    for lvl, col in enumerate((G_RED, G_YEL, G_GRN)):
        z = loc[2] + lvl * 0.075
        f = box(f"folder{lvl}", (0.3, 0.2, 0.012), (loc[0], loc[1], z + 0.012), col, rough=0.6)
        if lvl == 2:
            box("tray_top", (0.34, 0.22, 0.02), (loc[0] + 0.01, loc[1], z + 0.05), G_GRN, rough=0.5)
    for i in range(10):
        x = loc[0] + 0.16
        o = pill(f"tw{i}", length=0.24, radius=0.0025, loc=(x, loc[1] - 0.1 + i * 0.022, loc[2] + 0.12))
        assign(o, wire)


def pencil_cup(loc):
    box("cup_a", (0.09, 0.09, 0.13), (loc[0], loc[1], loc[2] + 0.065), "#F0B84A", rough=0.55)
    box("cup_b", (0.1, 0.09, 0.08), (loc[0] + 0.08, loc[1] - 0.01, loc[2] + 0.04), "#F4C766", rough=0.55)
    for i, (c, lean) in enumerate(((G_GRN, -8), (G_RED, 4), (G_BLUE, 14), ("#EDE7DD", -2))):
        pill(f"cpen{i}", length=0.2, radius=0.0045, color=c, loc=(loc[0] - 0.02 + i * 0.013, loc[1], loc[2] + 0.19),
             rot=(0, math.radians(lean), 0))


def planters(loc):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.13, vertices=6, location=(loc[0], loc[1], loc[2] + 0.065))
    p = bpy.context.active_object
    b = p.modifiers.new("bev", "BEVEL"); b.width = 0.006; b.segments = 3
    assign(p, mat_principled("pot_m", G_BLUE, rough=0.8))
    # succulent: rosette of pointed leaves
    leafm = mat_principled("leaf_m", "#F2D48A", rough=0.5, sss=0.1)
    for ring_i, (n, tilt, r, z) in enumerate(((7, 55, 0.028, 0.14), (6, 35, 0.015, 0.155), (4, 12, 0.005, 0.165))):
        for k in range(n):
            a = k / n * 2 * math.pi + ring_i * 0.4
            bpy.ops.mesh.primitive_cone_add(radius1=0.018, depth=0.07, vertices=12,
                                            location=(loc[0] + r * math.cos(a), loc[1] + r * math.sin(a), loc[2] + z))
            lf = bpy.context.active_object
            lf.rotation_euler = (math.radians(tilt) * math.sin(a) * -1, math.radians(tilt) * math.cos(a), 0)
            lf.scale = (1, 0.55, 1)
            smooth(lf)
            assign(lf, leafm)
    # green face box
    fb = box("face_box", (0.07, 0.06, 0.08), (loc[0] + 0.07, loc[1] - 0.05, loc[2] + 0.04), G_GRN, rough=0.6)
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.004, location=(loc[0] + 0.07 + sx * 0.015, loc[1] - 0.081, loc[2] + 0.055))
        assign(bpy.context.active_object, mat_principled("eye_m", "#1A1A1A", rough=0.3))
    bpy.ops.mesh.primitive_cylinder_add(radius=0.055, depth=0.08, vertices=6, location=(loc[0] + 0.14, loc[1] + 0.01, loc[2] + 0.04))
    p2 = bpy.context.active_object
    assign(p2, mat_principled("pot2_m", "#3D74E6", rough=0.8))


def chair(loc):
    gold = mat_principled("chair_m", "#E3A51E", rough=0.32, coat=0.5)
    back = slab("chair_back", 0.5, 0.62, 0.05, corner=0.1, edge=0.02)
    back.location = (loc[0] - 0.08, loc[1] + 0.05, loc[2] + 0.62)
    back.rotation_euler = (math.radians(84), 0, math.radians(62))
    assign(back, gold)
    armm = mat_principled("arm_m", "#EDB43A", rough=0.18, metallic=1.0)
    # arm: a bent tube (bezier curve with bevel) sweeping across the lower left of frame
    cu = bpy.data.curves.new("chair_arm", "CURVE"); cu.dimensions = "3D"
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(2)
    pts = [(loc[0] + 0.02, loc[1] + 0.06, loc[2] + 0.66), (loc[0] + 0.17, loc[1] + 0.02, loc[2] + 0.68),
           (loc[0] + 0.23, loc[1] - 0.01, loc[2] + 0.5)]
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p; bp.handle_left_type = bp.handle_right_type = "AUTO"
    cu.bevel_depth = 0.02; cu.bevel_resolution = 8
    arm = bpy.data.objects.new("chair_arm", cu); bpy.context.collection.objects.link(arm)
    assign(arm, armm)


def google_laptop(loc, width=0.36, screen_tex="google_home.png"):
    """MacBook Pro-ish: thick silver base with dark keyboard + trackpad, thin lid, notch, near-borderless screen."""
    h = width * 0.64
    alu = mat_principled("alu", "#D9DBDF", rough=0.26, metallic=0.9)
    dark = mat_principled("keys", "#2B2C30", rough=0.55)
    bpy.ops.object.empty_add(location=loc)
    root = bpy.context.active_object
    base = slab("lap_base", width, h, 0.014, corner=0.014, edge=0.005)
    assign(base, alu); base.parent = root; base.location = (0, -h / 2 + 0.01, 0.007)
    well = slab("lap_well", width * 0.86, h * 0.38, 0.002, corner=0.006, edge=0.001)
    assign(well, dark); well.parent = root; well.location = (0, -h * 0.34 + 0.01, 0.0141)
    for r in range(5):  # key rows (light grooves read as keys)
        bar = slab(f"keyrow{r}", width * 0.84, 0.0012, 0.0004, corner=0.0005, edge=0.0001)
        assign(bar, mat_principled(f"kg{r}", "#4A4B50", rough=0.6)); bar.parent = root
        bar.location = (0, -h * 0.34 + 0.01 - h * 0.15 + r * h * 0.075, 0.0152)
    pad = slab("lap_pad", width * 0.36, h * 0.34, 0.0006, corner=0.006, edge=0.0003)
    assign(pad, mat_principled("padm", "#CFD1D6", rough=0.2, metallic=0.8)); pad.parent = root
    pad.location = (0, -h * 0.78 + 0.01, 0.0143)
    bpy.ops.object.empty_add(location=(0, 0.01, 0.014))
    hinge = bpy.context.active_object; hinge.parent = root
    lid = slab("lap_lid", width, h, 0.005, corner=0.014, edge=0.002)
    assign(lid, mat_principled("bezel", "#141518", rough=0.25)); lid.parent = hinge
    lid.rotation_euler = (math.radians(90), 0, 0); lid.location = (0, 0, h / 2)
    back = slab("lap_back", width, h, 0.003, corner=0.014, edge=0.0012)
    assign(back, alu); back.parent = lid; back.location = (0, 0, -0.003)
    bpy.ops.mesh.primitive_plane_add(size=1)
    scr = bpy.context.active_object
    scr.scale = (width * 0.975, h * 0.955, 1)
    bpy.ops.object.transform_apply(scale=True)
    assign(scr, emissive_image("screen_m_" + screen_tex, os.path.join(TEX, screen_tex), strength=2.1))
    scr.parent = lid; scr.location = (0, -0.002, 0.0026)
    notch = slab("lap_notch", width * 0.075, h * 0.045, 0.0008, corner=0.004, edge=0.0003)
    assign(notch, mat_principled("notchm", "#0B0B0C", rough=0.3)); notch.parent = lid
    notch.location = (0, h * 0.478 - 0.002, 0.0031)
    hinge.rotation_euler = (math.radians(-12), 0, 0)
    return root, scr


def build(screen_tex="google_home.png"):
    world_fill()
    window_light()
    # wall, desk, under-desk
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, WALL_Y, 1.2), rotation=(math.radians(90), 0, 0))
    wall = bpy.context.active_object; wall.scale = (6, 3, 1)
    assign(wall, mat_principled("wall_m", WALL, rough=0.9))
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    fl = bpy.context.active_object; fl.scale = (6, 4, 1)
    assign(fl, mat_principled("floor_m", "#8C8698", rough=0.8))
    box("desk_top", (2.2, 0.62, 0.035), (0.1, WALL_Y - 0.31, TOP_Z - 0.0175), DESK_TOP, rough=0.45, bevel=0.006)
    box("cabinet", (0.5, 0.5, TOP_Z - 0.04), (0.78, WALL_Y - 0.3, (TOP_Z - 0.04) / 2), G_RED, rough=0.6)
    box("desk_leg", (0.05, 0.5, TOP_Z - 0.04), (-0.62, WALL_Y - 0.3, (TOP_Z - 0.04) / 2), G_BLUE, rough=0.5)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=2.2, vertices=48, location=(-0.03, WALL_Y - 0.05, TOP_Z + 1.1))
    col = bpy.context.active_object; smooth(col)
    assign(col, mat_principled("column_m", "#D5D3D0", rough=0.6))
    # wall props
    pegboard((-0.62, WALL_Y - 0.01, 1.27))
    wire_grid((0.5, WALL_Y - 0.005, 1.27))
    wall_pencils((0.3, WALL_Y, 1.03))
    # desk props
    file_tray((-0.72, WALL_Y - 0.2, TOP_Z))
    pencil_cup((-0.42, WALL_Y - 0.2, TOP_Z))
    planters((0.55, WALL_Y - 0.2, TOP_Z))
    box("notebook", (0.3, 0.2, 0.012), (0.66, WALL_Y - 0.42, TOP_Z + 0.006), "#F7F4EE", rough=0.7, rot=(0, 0, 3))
    chair((-0.36, WALL_Y - 1.2, 0.0))
    lap, scr = google_laptop((0.02, WALL_Y - 0.28, TOP_Z), width=0.36, screen_tex=screen_tex)
    return lap, scr
