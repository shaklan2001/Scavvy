import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
import glob, os

OUT = "/app/_work/poses"
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, "*.png")):
    os.remove(f)

def split(path):
    name = os.path.splitext(os.path.basename(path))[0]
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    mask = arr[:, :, 3] > 128
    mask = ndimage.binary_closing(mask, structure=np.ones((5, 5)))
    lbl, n = ndimage.label(mask)
    H, W = mask.shape
    boxes = []
    for i in range(1, n + 1):
        ys, xs = np.where(lbl == i)
        area = len(xs)
        if area < 4000:
            continue
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        if (x1 - x0) < 45 or (y1 - y0) < 45:
            continue
        boxes.append((int(x0), int(y0), int(x1), int(y1), int(area)))
    boxes.sort(key=lambda r: (round(r[1] / 110), r[0]))
    for idx, (x0, y0, x1, y1, area) in enumerate(boxes):
        pad = 10
        crop = img.crop((max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)))
        crop.save(os.path.join(OUT, f"{name}_{idx:02d}.png"))
    print(f"{name}: {len(boxes)}")

for p in sorted(glob.glob("/app/_work/nobg/sheet*.png")):
    split(p)

crops = sorted(glob.glob(os.path.join(OUT, "*.png")))
cell = 160
cols = 8
rows = (len(crops) + cols - 1) // cols
canvas = Image.new("RGB", (cols * cell, rows * cell), (255, 246, 230))
d = ImageDraw.Draw(canvas)
for k, c in enumerate(crops):
    im = Image.open(c).convert("RGBA")
    im.thumbnail((cell - 16, cell - 34))
    r, col = divmod(k, cols)
    canvas.paste(im, (col * cell + (cell - im.width) // 2, r * cell + 6), im)
    d.text((col * cell + 4, r * cell + cell - 16), os.path.basename(c)[:-4].replace("sheet", "s"), fill=(200, 40, 0))
canvas.save("/app/_work/montage.png")
print("total", len(crops))
