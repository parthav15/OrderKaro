from PIL import Image
import os

R = "/Users/parthav./Documents/OrderKaro/design/logo/render/"
MA = "/Users/parthav./Documents/OrderKaro/apps/mobile/assets/"
WB = "/Users/parthav./Documents/OrderKaro/apps/web/public/"

icon = Image.open(R + "app-icon-3d-1024.png").convert("RGB")
mark = Image.open(R + "vm-icon-mark.png").convert("RGBA")
mark = mark.crop(mark.split()[3].getbbox())

def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print(path)

def centered(m, canvas, frac, bg=(0, 0, 0, 0)):
    cv = Image.new("RGBA", (canvas, canvas), bg)
    w = int(canvas * frac)
    h = int(m.height * w / m.width)
    r = m.resize((w, h), Image.LANCZOS)
    cv.paste(r, ((canvas - w) // 2, (canvas - h) // 2), r)
    return cv

save(icon.resize((1024, 1024), Image.LANCZOS), MA + "icon.png")
save(icon.resize((48, 48), Image.LANCZOS), MA + "favicon.png")
save(centered(mark, 1024, 0.58), MA + "adaptive-icon.png")
save(centered(mark, 1242, 0.42), MA + "splash.png")

save(icon.resize((192, 192), Image.LANCZOS), WB + "icon-192.png")
save(icon.resize((512, 512), Image.LANCZOS), WB + "icon-512.png")
save(icon.resize((180, 180), Image.LANCZOS), WB + "apple-touch-icon.png")
save(icon.resize((32, 32), Image.LANCZOS), WB + "favicon-32.png")
