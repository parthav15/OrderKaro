from PIL import Image

R = "/Users/parthav./Documents/OrderKaro/design/logo/render/"
BOUNDS = [0.13, 0.2113, 0.2908, 0.3909, 0.4867, 0.6133, 0.6989, 0.7981, 0.8948, 1.0]

src = Image.open(R + "vision-menu-h-gold-trim.png").convert("RGBA")
Wd = 780
Hd = round(src.height * Wd / src.width)
mark = src.resize((Wd, Hd), Image.LANCZOS)

CW, CH = 940, 300
bg = (20, 17, 16, 255)
x0 = (CW - Wd) // 2
y0 = (CH - Hd) // 2


def frame(edge_px, shine=0.0):
    f = Image.new("RGBA", (CW, CH), bg)
    if edge_px > 0:
        strip = mark.crop((0, 0, edge_px, Hd))
        f.alpha_composite(strip, (x0, y0))
    if shine > 0:
        alpha = mark.getchannel("A").point(lambda a: int(a * shine))
        glow = Image.new("RGBA", (Wd, Hd), (255, 241, 198, 0))
        glow.putalpha(alpha)
        f.alpha_composite(glow, (x0, y0))
    return f.convert("P", palette=Image.ADAPTIVE)


frames = []
durations = []


def add(f, d):
    frames.append(f)
    durations.append(d)


for _ in range(5):
    add(frame(0), 60)

prev = 0.0
for b in BOUNDS:
    for t in (0.5, 1.0):
        e = prev + (b - prev) * t
        add(frame(round(e * Wd)), 45)
    prev = b

for _ in range(6):
    add(frame(Wd), 60)
for s in (0.2, 0.4, 0.5, 0.4, 0.2):
    add(frame(Wd, s), 55)
for _ in range(10):
    add(frame(Wd), 70)

frames[0].save(
    R + "reveal-preview.gif",
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    disposal=2,
)
print("GIF frames:", len(frames), "size:", CW, CH)
