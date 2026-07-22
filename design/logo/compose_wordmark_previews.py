from PIL import Image

R = "/Users/parthav./Documents/OrderKaro/design/logo/render/"


def load(p):
    return Image.open(R + p).convert("RGBA")


def scale_to_w(img, w):
    h = round(img.height * w / img.width)
    return img.resize((w, h), Image.LANCZOS)


def scale_to_h(img, h):
    w = round(img.width * h / img.height)
    return img.resize((w, h), Image.LANCZOS)


def sheet(bg_hex, stacked, horizontal, out):
    bg = tuple(int(bg_hex[i:i + 2], 16) for i in (0, 2, 4))
    W = 1200
    st = scale_to_h(stacked, 620)
    hz = scale_to_w(horizontal, 980)
    gap_top = 90
    gap_mid = 40
    gap_bot = 90
    H = gap_top + st.height + gap_mid + hz.height + gap_bot
    canvas = Image.new("RGBA", (W, H), bg + (255,))
    canvas.alpha_composite(st, ((W - st.width) // 2, gap_top))
    canvas.alpha_composite(hz, ((W - hz.width) // 2, gap_top + st.height + gap_mid))
    canvas.convert("RGB").save(R + out)
    print("SHEET:", out, canvas.size)


sheet("141110", load("vision-menu-gold-3d.png"), load("vision-menu-h-gold-3d.png"), "preview-dark-gold.png")
sheet("FFF7F3", load("vision-menu-3d.png"), load("vision-menu-h-3d.png"), "preview-light-wine.png")
