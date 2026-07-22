from PIL import Image, ImageDraw

SRC = "/Users/parthav./Documents/OrderKaro/design/logo/render/vm-icon-mark.png"
OUT = "/Users/parthav./Documents/OrderKaro/design/logo/render/app-icon-3d-1024.png"
SHEET = "/tmp/vm_icon_sizes.png"

vm = Image.open(SRC).convert("RGBA")
vm = vm.crop(vm.split()[3].getbbox())

S = 1024
tile = Image.new("RGB", (S, S))
top, bot = (0x8E, 0x1A, 0x2D), (0x36, 0x0D, 0x16)
d = ImageDraw.Draw(tile)
for y in range(S):
    t = y / (S - 1)
    d.line([(0, y), (S, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))

tw = int(S * 0.82)
vm2 = vm.resize((tw, int(vm.height * tw / vm.width)), Image.LANCZOS)
tile.paste(vm2, ((S - vm2.width) // 2, (S - vm2.height) // 2), vm2)
tile.save(OUT)

def rounded(im, rad):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius=rad, fill=255)
    o = im.convert("RGBA")
    o.putalpha(m)
    return o

sheet = Image.new("RGB", (980, 460), (74, 72, 71))
big = rounded(tile.resize((300, 300), Image.LANCZOS), 66)
sheet.paste(big, (24, 80), big)
x = 360
for sz in [180, 120, 90, 60, 44]:
    ic = rounded(tile.resize((sz, sz), Image.LANCZOS), max(6, int(sz * 0.22)))
    sheet.paste(ic, (x, 80 + (180 - sz)), ic)
    x += sz + 34
sheet.save(SHEET)
print("saved", OUT, "and", SHEET)
