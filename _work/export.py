from PIL import Image
import os

SRC = "/app/_work/final"
DST = "/app/frontend/assets/mascot"
os.makedirs(DST, exist_ok=True)

MAP = {
    # full-body poses
    "welcome": "sheet1_00",
    "detective": "sheet2_00",
    "thinking": "sheet1_18",
    "curious": "sheet1_04",
    "excited": "sheet1_14",
    "success": "sheet2_05",
    "confused": "sheet3_05",
    "sleeping": "sheet2_18",
    "celebrating": "sheet3_18",
    "exploring": "sheet3_16",
    "camera": "sheet2_06",
    "map": "sheet1_16",
    "running": "sheet3_15",
    "idle": "sheet2_02",
    "peek": "sheet3_19",
    # faces
    "face_happy": "sheet3_07",
    "face_wink": "sheet2_12",
    "face_excited": "sheet3_08",
    "face_thinking": "sheet3_09",
    "face_sad": "sheet2_17",
    "face_love": "sheet2_16",
    "face_surprised": "sheet2_13",
    "face_curious": "sheet2_14",
    # props / brand
    "logo": "sheet1_25",
    "icon_magnifier": "sheet2_20",
    "icon_map": "sheet2_21",
    "icon_backpack": "sheet2_22",
    "icon_binoculars": "sheet2_23",
    "icon_camera": "sheet3_25",
    "icon_cap": "sheet2_19",
}

MAXW = 720
for name, src in MAP.items():
    p = os.path.join(SRC, src + ".png")
    im = Image.open(p).convert("RGBA")
    if im.width > MAXW:
        r = MAXW / im.width
        im = im.resize((MAXW, int(im.height * r)), Image.LANCZOS)
    im.save(os.path.join(DST, name + ".png"))
    print(f"{name:16s} <- {src}  {im.size}")
print("DONE", len(MAP))
