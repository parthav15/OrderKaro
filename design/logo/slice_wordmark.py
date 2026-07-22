from PIL import Image

R = "/Users/parthav./Documents/OrderKaro/design/logo/render/"


def trim(src, dst, pad=6):
    img = Image.open(R + src).convert("RGBA")
    bbox = img.getchannel("A").getbbox()
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(img.width, r + pad)
    b = min(img.height, b + pad)
    crop = img.crop((l, t, r, b))
    crop.save(R + dst)
    return crop


gold = trim("vision-menu-h-gold-3d.png", "vision-menu-h-gold-trim.png")
trim("vision-menu-h-3d.png", "vision-menu-h-wine-trim.png")

ca = gold.getchannel("A")
W, H = ca.size
px = ca.load()
cov = [sum(1 for y in range(H) if px[x, y] > 40) for x in range(W)]
thr = max(2, int(H * 0.02))
ink = [c > thr for c in cov]

runs = []
i = 0
while i < W:
    if ink[i]:
        j = i
        while j < W and ink[j]:
            j += 1
        if j - i >= 3:
            runs.append((i, j))
        i = j
    else:
        i += 1

total = sum(cov)
N = 10
bounds = []
k = 1
acc = 0
for x in range(W):
    acc += cov[x]
    while k < N and total > 0 and acc >= total * k / N:
        bounds.append(round((x + 1) / W, 4))
        k += 1
bounds.append(1.0)

print("TRIM_SIZE", W, H, "ASPECT", round(W / H, 4))
print("RUNS", len(runs))
print("BOUNDS", bounds)
