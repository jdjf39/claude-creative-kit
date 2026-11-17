"""Gemini star: inflated sparkle mesh + saturated gradient material (shared by shots 3, 3b, 9)."""
import bpy, bmesh, math
from base import smooth, assign, lin


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



def star_material(saturated=1.0):
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
    b.inputs["Roughness"].default_value = 0.1
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Subsurface Weight"].default_value = 0.4
    b.inputs["Subsurface Radius"].default_value = (0.3, 0.3, 0.3); b.inputs["Subsurface Scale"].default_value = 0.08
    fac.default_value = saturated
    return m


def make_star(name="star", saturated=1.0, **kw):
    o = sparkle_mesh(name, **kw)
    assign(o, star_material(saturated))
    return o
