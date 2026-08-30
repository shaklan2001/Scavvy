import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from rembg import remove, new_session
import glob, os

SMOOTH, THR, CLOSE = 9, 26, 5
session = new_session("u2net")
OUT = "/app/_work/final"
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(OUT + "/*.png"):
    os.remove(f)

def boxes_for(arr):
    gray = arr.mean(2)
    gx = ndimage.sobel(gray, axis=1); gy = ndimage.sobel(gray, axis=0)
    energy = ndimage.uniform_filter(np.hypot(gx, gy), size=SMOOTH)
    mask = energy > THR
    mask = ndimage.binary_closing(mask, structure=np.ones((CLOSE, CLOSE)))
    mask = ndimage.binary_fill_holes(mask)
    mask = ndimage.binary_opening(mask, structure=np.ones((5, 5)))
    lbl, n = ndimage.label(mask)
    out = []
    for i in range(1, n + 1):
        ys, xs = np.where(lbl == i)
        if len(xs) < 7000: continue
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        if (x1 - x0) < 55 or (y1 - y0) < 55: continue
        out.append([int(x0), int(y0), int(x1), int(y1)])
    out.sort(key=lambda r: (round(r[1] / 90), r[0]))
    return out

def autocrop(rgba):
    a = np.array(rgba)[:, :, 3]
    ys, xs = np.where(a > 20)
    if len(xs) == 0: return rgba
    return rgba.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

allcrops = []
for p in sorted(glob.glob("/app/_work/raw/sheet*.png")):
    name = os.path.basename(p)[:-4]
    im = Image.open(p).convert("RGB")
    arr = np.array(im).astype(np.float32)
    boxes = boxes_for(arr)
    W, H = im.size
    for k, (x0, y0, x1, y1) in enumerate(boxes):
        pad = 14
        crop = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)))
        cut = remove(crop.convert("RGBA"), session=session, post_process_mask=True)
        cut = autocrop(cut)
        fn = f"{name}_{k:02d}.png"
        cut.save(os.path.join(OUT, fn))
        allcrops.append(fn)
    print(name, len(boxes))

# montage
crops = sorted(allcrops)
cell = 150; cols = 8
rows = (len(crops) + cols - 1) // cols
canvas = Image.new("RGB", (cols * cell, rows * cell), (255, 246, 230))
d = ImageDraw.Draw(canvas)
for k, c in enumerate(crops):
    im = Image.open(os.path.join(OUT, c)).convert("RGBA")
    im.thumbnail((cell - 14, cell - 30))
    r, col = divmod(k, cols)
    canvas.paste(im, (col * cell + (cell - im.width) // 2, r * cell + 4), im)
    d.text((col * cell + 3, r * cell + cell - 15), c[:-4].replace("sheet", "s"), fill=(200, 40, 0))
canvas.save("/app/_work/final_montage.png")
print("TOTAL", len(crops))
