from rembg import remove, new_session
from PIL import Image
import glob, os

os.makedirs("/app/_work/nobg", exist_ok=True)
session = new_session("u2net")
for p in sorted(glob.glob("/app/_work/raw/sheet*.png")):
    name = os.path.basename(p)
    img = Image.open(p).convert("RGBA")
    out = remove(img, session=session, post_process_mask=True)
    out.save(f"/app/_work/nobg/{name}")
    print("done", name)
print("ALL DONE")
