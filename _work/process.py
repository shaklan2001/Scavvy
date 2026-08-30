import numpy as np
from PIL import Image
from scipy import ndimage
import glob, os

OUT = "/app/_work/crops"
os.makedirs(OUT, exist_ok=True)

def process(path):
    name = os.path.splitext(os.path.basename(path))[0]
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.int16)
    # near-white mask
    white = np.all(rgb > 236, axis=2)
    # background = white connected to border
    lbl, n = ndimage.label(white)
    border_ids = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    border_ids.discard(0)
    bg = np.isin(lbl, list(border_ids))
    # set background alpha to 0
    alpha = arr[:, :, 3].copy()
    alpha[bg] = 0
    arr[:, :, 3] = alpha
    # foreground mask
    fg = ~bg
    # clean small speckle: erode-ish via label filter later
    flbl, fn = ndimage.label(fg)
    sizes = ndimage.sum(np.ones_like(flbl), flbl, range(1, fn + 1))
    results = []
    H, W = fg.shape
    for i in range(1, fn + 1):
        area = sizes[i - 1]
        if area < 8000:  # skip tiny icons/specks
            continue
        ys, xs = np.where(flbl == i)
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        w, h = x1 - x0, y1 - y0
        if w < 60 or h < 60:
            continue
        results.append((int(x0), int(y0), int(x1), int(y1), int(area)))
    # sort by row then col
    results.sort(key=lambda r: (round(r[1] / 120), r[0]))
    out_img = Image.fromarray(arr, "RGBA")
    crops = []
    for idx, (x0, y0, x1, y1, area) in enumerate(results):
        pad = 12
        cx0, cy0 = max(0, x0 - pad), max(0, y0 - pad)
        cx1, cy1 = min(W, x1 + pad), min(H, y1 + pad)
        crop = out_img.crop((cx0, cy0, cx1, cy1))
        fn_out = f"{name}_{idx:02d}.png"
        crop.save(os.path.join(OUT, fn_out))
        crops.append((fn_out, cx1 - cx0, cy1 - cy0, area))
    print(f"\n== {name}: {len(crops)} crops ==")
    for c in crops:
        print(f"  {c[0]}  {c[1]}x{c[2]}  area={c[3]}")

for p in sorted(glob.glob("/app/_work/raw/*.png")):
    process(p)
