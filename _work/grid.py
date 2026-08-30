from PIL import Image, ImageDraw
import glob, os

for p in sorted(glob.glob("/app/_work/raw/sheet*.png")):
    name = os.path.basename(p)[:-4]
    im = Image.open(p).convert("RGB")
    W, H = im.size
    d = ImageDraw.Draw(im)
    for x in range(0, W, 128):
        d.line([(x, 0), (x, H)], fill=(255, 0, 255), width=2)
        d.text((x + 2, 2), str(x), fill=(255, 0, 255))
        d.text((x + 2, H - 14), str(x), fill=(255, 0, 255))
    for y in range(0, H, 128):
        d.line([(0, y), (W, y)], fill=(0, 255, 255), width=2)
        d.text((2, y + 2), str(y), fill=(0, 255, 255))
    im.resize((900, 600)).save(f"/app/_work/{name}_grid.png")
    print("grid", name)
