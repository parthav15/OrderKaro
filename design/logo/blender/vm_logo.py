import bpy, os, glob, math

def srgb_to_linear(v):
    v = v / 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

def hexlin(h):
    h = h.lstrip("#")
    return (srgb_to_linear(int(h[0:2], 16)), srgb_to_linear(int(h[2:4], 16)), srgb_to_linear(int(h[4:6], 16)), 1.0)

def setin(node, name, val):
    if name in node.inputs:
        node.inputs[name].default_value = val

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
MODE = os.environ.get("VM_MODE", "logo")
WM = MODE in ("wordmark", "wordmark-h")
GOLD = os.environ.get("VM_GOLD", "") == "1"

font_path = None
patterns = [
    "/Users/parthav./Documents/OrderKaro/**/PlayfairDisplay_700Bold.ttf",
    "/Users/parthav./Documents/OrderKaro/**/PlayfairDisplay_800ExtraBold.ttf",
]
for pat in patterns:
    hits = glob.glob(pat, recursive=True)
    if hits:
        font_path = hits[0]
        break
for cand in ["/System/Library/Fonts/Supplemental/Georgia.ttf",
             "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
             "/System/Library/Fonts/NewYork.ttf"]:
    if font_path is None and os.path.exists(cand):
        font_path = cand
print("FONT:", font_path)

curve = bpy.data.curves.new(name="VM", type="FONT")
curve.body = "Vision Menu" if MODE == "wordmark-h" else "Vision\nMenu" if MODE == "wordmark" else "VM"
if font_path:
    try:
        curve.font = bpy.data.fonts.load(font_path)
    except Exception as e:
        print("font load failed", e)
curve.extrude = 0.09 if WM else 0.13
curve.bevel_depth = 0.02
curve.bevel_resolution = 6
curve.align_x = "CENTER"
curve.align_y = "CENTER"
curve.space_character = 0.92
curve.space_line = 0.84 if MODE == "wordmark" else 1.0

obj = bpy.data.objects.new("VM", curve)
scene.collection.objects.link(obj)
obj.rotation_euler = (math.radians(90), 0, 0)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.convert(target="MESH")
try:
    bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
except Exception:
    try:
        bpy.ops.object.shade_smooth()
    except Exception:
        pass
bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
obj.location = (0, 0, 0)

mat = bpy.data.materials.new("WineLacquer")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if MODE == "icon" or GOLD:
    setin(bsdf, "Base Color", hexlin("E4C368"))
    setin(bsdf, "Metallic", 1.0)
    setin(bsdf, "Roughness", 0.30)
    setin(bsdf, "Coat Weight", 0.2)
    setin(bsdf, "Specular IOR Level", 0.6)
else:
    setin(bsdf, "Base Color", hexlin("911A2E"))
    setin(bsdf, "Metallic", 0.2)
    setin(bsdf, "Roughness", 0.34)
    setin(bsdf, "Coat Weight", 0.4)
    setin(bsdf, "Coat Roughness", 0.12)
    setin(bsdf, "Specular IOR Level", 0.5)
obj.data.materials.append(mat)

target = bpy.data.objects.new("Target", None)
scene.collection.objects.link(target)
target.location = (0, 0, 0.0)

def aim(o):
    c = o.constraints.new("TRACK_TO")
    c.target = target
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"

cam_data = bpy.data.cameras.new("Cam")
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
if MODE == "icon":
    cam.location = (0.28, -5.4, 0.05)
    cam_data.lens = 110
elif MODE == "wordmark-h":
    cam.location = (0.0, -8.6, 0.5)
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 5.4
elif MODE == "wordmark":
    cam.location = (0.0, -8.6, 0.62)
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 3.05
else:
    cam.location = (0.8, -4.6, 0.4)
    cam_data.lens = 95
aim(cam)

def area(name, loc, energy, size, color):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = energy
    ld.size = size
    ld.color = color
    lo = bpy.data.objects.new(name, ld)
    lo.location = loc
    scene.collection.objects.link(lo)
    aim(lo)

area("Key", (-2.6, -2.6, 3.0), 380, 4.0, (1.0, 0.93, 0.80))
area("Fill", (3.0, -1.6, 0.7), 110, 3.6, (0.86, 0.84, 1.0))
area("RimGold", (1.8, 2.6, 1.7), 430, 2.4, (1.0, 0.76, 0.38))

if MODE != "icon" and not WM:
    bpy.ops.mesh.primitive_plane_add(size=16, location=(0, 0, -0.64))
    ground = bpy.context.active_object
    ground.is_shadow_catcher = True

scene.world = bpy.data.worlds.new("W")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.03, 0.02, 0.025, 1.0)
bg.inputs["Strength"].default_value = 1.2 if (MODE == "icon" or GOLD) else 0.35

scene.render.engine = "CYCLES"
scene.cycles.samples = 160
scene.cycles.use_denoising = True
scene.render.resolution_x = 1600 if MODE == "wordmark-h" else 1024
scene.render.resolution_y = 640 if MODE == "wordmark-h" else 1024
scene.render.film_transparent = True
try:
    scene.view_settings.view_transform = "Standard"
except Exception:
    pass

if MODE == "icon":
    name = "vm-icon-mark.png"
elif MODE == "wordmark-h":
    name = "vision-menu-h" + ("-gold" if GOLD else "") + "-3d.png"
elif MODE == "wordmark":
    name = "vision-menu" + ("-gold" if GOLD else "") + "-3d.png"
else:
    name = "vm-3d.png"
out = "/Users/parthav./Documents/OrderKaro/design/logo/render/" + name
os.makedirs(os.path.dirname(out), exist_ok=True)
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("RENDERED:", out)
