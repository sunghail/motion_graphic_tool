"""CCS absorption example in the Blender style: lit 3D columns, glass cut-view, glowing CO2, orbiting camera.

Render (background):
  "C:\\Program Files\\Blender Foundation\\Blender 5.0\\blender.exe" -b -P ccs_blender.py
PNG frames go to frames/, then encode with ffmpeg (see README).
"""
import math
import os

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, SECONDS = 30, 9
N = FPS * SECONDS
FONT = "C:/Windows/Fonts/malgunbd.ttf"


def h1(i):
    v = math.sin(i * 127.1 + 311.7) * 43758.5453
    return v - math.floor(v)


# ---------------- scene reset ----------------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, N
sc.render.fps = FPS
sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
sc.render.resolution_percentage = 100
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try:
        sc.render.engine = eng
        break
    except TypeError:
        pass
ee = sc.eevee
for k, v in (("taa_render_samples", 48), ("use_raytracing", True), ("use_shadows", True)):
    if hasattr(ee, k):
        setattr(ee, k, v)
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Medium High Contrast" if "AgX - Medium High Contrast" in [i.identifier for i in sc.view_settings.bl_rna.properties["look"].enum_items] else "None"
sc.render.image_settings.file_format = "PNG"
sc.render.filepath = os.path.join(HERE, "frames", "f_")

world = bpy.data.worlds.new("W")
sc.world = world
world.use_nodes = True
wn = world.node_tree.nodes
bg = next((n for n in wn if n.type == "BACKGROUND"), None) or wn.new("ShaderNodeBackground")
wo = next((n for n in wn if n.type == "OUTPUT_WORLD"), None) or wn.new("ShaderNodeOutputWorld")
world.node_tree.links.new(bg.outputs[0], wo.inputs[0])
bg.inputs[0].default_value = (0.035, 0.045, 0.07, 1)
bg.inputs[1].default_value = 1.0


# ---------------- materials ----------------
def mat(name, color, metal=0.0, rough=0.5, emit=None, strength=0.0, alpha=1.0, trans=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree  # look nodes up by type: node names follow the UI language
    p = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None) or nt.nodes.new("ShaderNodeBsdfPrincipled")
    out = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None) or nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(p.outputs[0], out.inputs[0])
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    if trans:
        p.inputs["Transmission Weight"].default_value = trans
        p.inputs["IOR"].default_value = 1.2
    if emit:
        p.inputs["Emission Color"].default_value = (*emit, 1)
        p.inputs["Emission Strength"].default_value = strength
    if alpha < 1:
        p.inputs["Alpha"].default_value = alpha
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "BLENDED"
    return m


STEEL = mat("steel", (0.62, 0.65, 0.68), metal=1.0, rough=0.28)
DARK = mat("dark", (0.12, 0.13, 0.15), metal=0.6, rough=0.45)
GLASS = mat("glass", (0.85, 0.93, 1.0), rough=0.04, alpha=0.18)
PACK_A = mat("packA", (0.22, 0.4, 0.62), rough=0.7, alpha=0.55)
PACK_S = mat("packS", (0.62, 0.36, 0.22), rough=0.7, alpha=0.55)
RICH = mat("rich", (0.95, 0.45, 0.15), metal=0.3, rough=0.35)
LEAN = mat("lean", (0.2, 0.5, 0.95), metal=0.3, rough=0.35)
GAS = mat("gas", (0.55, 0.55, 0.58), metal=0.3, rough=0.35)
FLOOR = mat("floor", (0.07, 0.075, 0.085), metal=0.2, rough=0.35)
CO2 = mat("co2", (1.0, 0.25, 0.15), emit=(1.0, 0.3, 0.12), strength=25)
SOLV = mat("solv", (0.3, 0.7, 1.0), emit=(0.3, 0.7, 1.0), strength=10)
HEAT = mat("heat", (1.0, 0.5, 0.1), emit=(1.0, 0.45, 0.08), strength=8)
TXT = mat("txt", (1, 1, 1), emit=(1, 1, 1), strength=2)


def link(o, m):
    o.data.materials.append(m)
    return o


def cyl(r, depth, loc, m, verts=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
    o = bpy.context.object
    bpy.ops.object.shade_smooth()
    return link(o, m)


def sphere(r, loc, m, seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    o = bpy.context.object
    bpy.ops.object.shade_smooth()
    return link(o, m)


def pipe(points, r, m):
    cu = bpy.data.curves.new("pipe", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 6
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, q in zip(sp.points, points):
        p.co = (*q, 1)
    o = bpy.data.objects.new("pipe", cu)
    sc.collection.objects.link(o)
    cu.materials.append(m)
    return o


def text(s, loc, size, m=TXT, rot=(math.radians(90), 0, 0)):
    cu = bpy.data.curves.new("t", "FONT")
    cu.body = s
    cu.font = bpy.data.fonts.load(FONT)
    cu.size = size
    cu.align_x = "CENTER"
    cu.extrude = 0.01
    o = bpy.data.objects.new("t", cu)
    o.location = loc
    o.rotation_euler = rot
    sc.collection.objects.link(o)
    cu.materials.append(m)
    return o


# ---------------- plant ----------------
bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, 0))
link(bpy.context.object, FLOOR)

COLS = {"A": dict(x=-2.4, r=0.8, z0=0.9, z1=6.4, pack=PACK_A), "S": dict(x=2.4, r=0.65, z0=1.2, z1=5.6, pack=PACK_S)}
for c in COLS.values():
    h = c["z1"] - c["z0"]
    zc = (c["z0"] + c["z1"]) / 2
    cyl(c["r"], h, (c["x"], 0, zc), GLASS)                         # glass shell = cut-view
    for zz in (c["z0"], c["z1"]):                                   # steel heads
        s = sphere(c["r"], (c["x"], 0, zz), STEEL)
        s.scale.z = 0.45
        cyl(c["r"] * 1.04, 0.14, (c["x"], 0, zz), STEEL)            # flange ring
    for k in range(2):                                              # two packed beds inside
        a = c["z0"] + h * (0.12 + 0.46 * k)
        cyl(c["r"] * 0.93, h * 0.3, (c["x"], 0, a + h * 0.15), c["pack"], verts=48)
    for zz in (c["z0"] + h * 0.44, c["z0"] + h * 0.9):              # liquid distributors
        cyl(c["r"] * 0.95, 0.05, (c["x"], 0, zz), DARK)
    for ang in (45, 135, 225, 315):                                 # legs
        a = math.radians(ang)
        cyl(0.07, c["z0"], (c["x"] + math.cos(a) * c["r"] * 0.7, math.sin(a) * c["r"] * 0.7, c["z0"] / 2), DARK, verts=16)

xa, xs = COLS["A"]["x"], COLS["S"]["x"]
pipe([(-8, 0, 1.6), (xa - 0.8, 0, 1.6)], 0.16, GAS)                  # flue gas in
pipe([(xa, 0, 6.7), (xa, 0, 8.2)], 0.14, GAS)                        # treated gas out
pipe([(xa, 0, 0.5), (xa, -1.2, 0.5), (0.4, -1.2, 0.5), (0.4, -1.2, 5.2), (xs - 0.65, -0.3, 5.2)], 0.1, RICH)   # rich
pipe([(xs, 0, 0.8), (xs, 1.2, 0.8), (-0.4, 1.2, 0.8), (-0.4, 1.2, 6.0), (xa + 0.8, 0.3, 6.0)], 0.1, LEAN)     # lean
pipe([(xs, 0, 5.9), (xs, 0, 7.4), (7.5, 0, 7.4)], 0.13, RICH)                                                  # CO2 to compression
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -1.2, 2.4))                                               # lean/rich HX box
hx = bpy.context.object
hx.scale = (1.4, 0.7, 0.7)
link(hx, STEEL)
bpy.ops.mesh.primitive_cube_add(size=1, location=(8.3, 0, 7.4))                                                # compressor
cp = bpy.context.object
cp.scale = (1.4, 1.1, 1.1)
link(cp, DARK)
for dx, dy in ((-0.5, -0.4), (0.5, -0.4), (-0.5, 0.4), (0.5, 0.4)):                                   # compressor stand
    cyl(0.08, 6.85, (8.3 + dx, dy, 3.43), DARK, verts=16)
rb = cyl(0.35, 1.2, (xs + 1.1, 0, 1.3), STEEL)                                                                # reboiler
rb.rotation_euler.y = math.radians(90)
glow = cyl(0.3, 1.0, (xs + 1.1, 0, 1.3), HEAT, verts=32)
glow.rotation_euler.y = math.radians(90)
glow.scale = (0.98, 0.98, 1.0)

text("흡수탑", (xa, -1.0, 7.0), 0.55)
text("재생탑", (xs, -1.0, 6.2), 0.55)
text("압축", (8.3, -0.8, 8.2), 0.45)
text("배가스", (-6.5, -0.4, 2.0), 0.4)

# ---------------- lights ----------------
sun = bpy.data.lights.new("sun", "SUN")
sun.energy = 1.2
sun.angle = math.radians(4)
so = bpy.data.objects.new("sun", sun)
so.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
sc.collection.objects.link(so)
for loc, e, col in (((-6, -6, 9), 700, (0.7, 0.85, 1.0)), ((7, 4, 6), 500, (1.0, 0.8, 0.6)), ((0, 8, 8), 900, (0.5, 0.7, 1.0))):
    li = bpy.data.lights.new("area", "AREA")
    li.energy, li.size, li.color = e, 6, col
    lo = bpy.data.objects.new("area", li)
    lo.location = loc
    lo.rotation_euler = (Vector((0, 0, 3)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(lo)


# ---------------- moving particles (keyframed, pure functions of t) ----------------
def keyed(o, fn, step=2):
    for f in range(1, N + 1, step):
        t = (f - 1) / FPS
        loc, s = fn(t)
        o.location = loc
        o.scale = (s, s, s)
        o.keyframe_insert("location", frame=f)
        o.keyframe_insert("scale", frame=f)


def smooth(u):
    u = max(0.0, min(1.0, u))
    return u * u * (3 - 2 * u)


cA = COLS["A"]
for i in range(46):                            # CO2 rising in the absorber, caught low (more near the bottom)
    ph, rx, ry = h1(i), h1(i + 50) * 2 - 1, h1(i + 90) * 2 - 1
    catch = cA["z0"] + 0.4 + (cA["z1"] - cA["z0"] - 0.8) * min(1, -math.log(1 - h1(i + 130) * 0.9) * 0.45)
    o = sphere(0.1, (0, 0, 0), CO2, seg=16)

    def fa(t, ph=ph, rx=rx, ry=ry, catch=catch):
        u = (t * 0.22 + ph) % 1.0
        z = cA["z0"] + 0.3 + u * (cA["z1"] - cA["z0"])
        if z < catch:
            return (xa + rx * 0.55, ry * 0.55, z), 1.0
        fade = 1 - smooth((z - catch) / 0.35)
        return (xa + rx * 0.55, ry * 0.55, catch - (z - catch) * 0.3), fade

    keyed(o, fa)

for i in range(40):                            # solvent drops falling in the absorber
    ph, rx, ry = h1(i + 300), h1(i + 350) * 2 - 1, h1(i + 390) * 2 - 1
    o = sphere(0.05, (0, 0, 0), SOLV, seg=12)
    keyed(o, lambda t, ph=ph, rx=rx, ry=ry: ((xa + rx * 0.6, ry * 0.6, cA["z1"] - 0.3 - ((t * 0.3 + ph) % 1.0) * (cA["z1"] - cA["z0"] - 0.4)), 1.0))

cS = COLS["S"]
for i in range(36):                            # released CO2 rising in the stripper, then to compression
    ph, rx, ry = h1(i + 500), h1(i + 550) * 2 - 1, h1(i + 590) * 2 - 1
    o = sphere(0.1, (0, 0, 0), CO2, seg=16)

    def fs(t, ph=ph, rx=rx, ry=ry):
        u = (t * 0.18 + ph) % 1.0
        on = smooth((t - 1.5) / 2.0)
        if u < 0.7:
            z = cS["z0"] + 0.3 + (u / 0.7) * (cS["z1"] - cS["z0"])
            return (xs + rx * 0.45 * (1 - u / 0.7), ry * 0.45 * (1 - u / 0.7), z), on
        v = (u - 0.7) / 0.3
        if v < 0.25:
            return (xs, 0, cS["z1"] + v / 0.25 * 1.8), on
        return (xs + (v - 0.25) / 0.75 * 5.0, 0, 7.4), on * (1 - smooth((v - 0.85) / 0.15))

    keyed(o, fs)

# ---------------- camera orbit ----------------
cam = bpy.data.cameras.new("cam")
cam.lens = 26
cam.dof.use_dof = True
cam.dof.aperture_fstop = 5.6
co = bpy.data.objects.new("cam", cam)
sc.collection.objects.link(co)
sc.camera = co
target = Vector((1.6, 0, 3.9))
cam.dof.focus_distance = 19
for f in range(1, N + 1, 3):
    u = smooth((f - 1) / (N - 1))
    a = math.radians(-118 + 50 * u)
    r = 21.0 - 3.0 * u
    co.location = (target.x + r * math.cos(a), target.y + r * math.sin(a), 5.2 + 1.2 * math.sin(u * math.pi))
    co.rotation_euler = (target - co.location).to_track_quat("-Z", "Y").to_euler()
    co.keyframe_insert("location", frame=f)
    co.keyframe_insert("rotation_euler", frame=f)

def add_bloom():
    try:
        if hasattr(sc, "compositing_node_group"):          # Blender 5.x
            tree = bpy.data.node_groups.new("comp", "CompositorNodeTree")
            sc.compositing_node_group = tree
            rl = tree.nodes.new("CompositorNodeRLayers")
            out = tree.nodes.new("NodeGroupOutput")
            tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
        else:
            sc.use_nodes = True
            tree = sc.node_tree
            tree.nodes.clear()
            rl = tree.nodes.new("CompositorNodeRLayers")
            out = tree.nodes.new("CompositorNodeComposite")
        g = tree.nodes.new("CompositorNodeGlare")
        for k, v in (("glare_type", "BLOOM"), ("quality", "HIGH"), ("threshold", 1.0), ("size", 7), ("mix", 0.0)):
            if hasattr(g, k):
                setattr(g, k, v)
        for name, v in (("Type", "Bloom"), ("Threshold", 1.0), ("Size", 0.6), ("Strength", 0.8)):
            if name in g.inputs and not g.inputs[name].is_linked:
                try:
                    g.inputs[name].default_value = v
                except Exception:
                    pass
        tree.links.new(rl.outputs["Image"], g.inputs["Image"])
        tree.links.new(g.outputs["Image"] if "Image" in g.outputs else g.outputs[0], out.inputs[0])
        print("bloom ok")
    except Exception as e:  # noqa: BLE001
        print("bloom skipped:", e)


add_bloom()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "ccs_blender.blend"))
if os.environ.get("CCS_STILL"):
    sc.frame_set(int(os.environ["CCS_STILL"]))
    sc.render.filepath = os.path.join(HERE, "still.png")
    bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
