import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
import glob, os, sys

SMOOTH = int(sys.argv[1]) if len(sys.argv) > 1 else 9
THR = float(sys.argv[2]) if len(sys.argv) > 2 else 22
CLOSE = int(sys.argv[3]) if len(sys.argv) > 3 else 7

def boxes_for(path):
    im = Image.open(path).convert("RGB")
    arr = np.array(im).astype(np.float32)
    gray = arr.mean(2)
    gx = ndimage.sobel(gray, axis=1); gy = ndimage.sobel(gray, axis=0)
    edge = np.hypot(gx, gy)
    energy = ndimage.uniform_filter(edge, size=SMOOTH)
    mask = energy > THR
    mask = ndimage.binary_closing(mask, structure=np.ones((CLOSE, CLOSE)))
    mask = ndimage.binary_fill_holes(mask)
    mask = ndimage.binary_opening(mask, structure=np.ones((5, 5)))
    lbl, n = ndimage.label(mask)
    H, W = mask.shape
    boxes = []
    for i in range(1, n + 1):
        ys, xs = np.where(lbl == i)
        if len(xs) < 7000: continue
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        if (x1 - x0) < 55 or (y1 - y0) < 55: continue
        boxes.append([int(x0), int(y0), int(x1), int(y1)])
    boxes.sort(key=lambda r: (round(r[1] / 90), r[0]))
    return im, boxes

for p in sorted(glob.glob("/app/_work/raw/sheet*.png")):
    name = os.path.basename(p)[:-4]
    im, boxes = boxes_for(p)
    prev = im.copy(); d = ImageDraw.Draw(prev)
    for k, (x0, y0, x1, y1) in enumerate(boxes):
        d.rectangle([x0, y0, x1, y1], outline=(255, 0, 255), width=4)
        d.text((x0 + 4, y0 + 4), str(k), fill=(0, 255, 0))
    prev.resize((900, 600)).save(f"/app/_work/{name}_boxes.png")
    print(name, len(boxes))
