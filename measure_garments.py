"""Auto-detect garment anchor points from transparent PNGs"""
from PIL import Image
import numpy as np
import os, json

path = r"d:\dm-project-mid-review\frontend\public\assets\garments"
garments_json = os.path.join(path, "garments.json")
with open(garments_json) as f:
    garments = json.load(f)

for g in garments:
    img_path = os.path.join(path, os.path.basename(g["image"]))
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    w, h = img.size
    
    alpha = arr[:,:,3]
    
    if alpha.min() > 200:
        r, g_ch, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
        mask = ~((r > 240) & (g_ch > 240) & (b > 240))
    else:
        mask = alpha > 30
    
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any():
        print(f"{g['id']}: EMPTY IMAGE")
        continue
    
    top = int(np.argmax(rows))
    bottom = int(len(rows) - np.argmax(rows[::-1]) - 1)
    left = int(np.argmax(cols))
    right = int(len(cols) - np.argmax(cols[::-1]) - 1)
    
    content_w = right - left
    content_h = bottom - top
    
    shoulder_y = int(top + content_h * 0.08)
    hip_y = int(top + content_h * 0.55)
    
    left_shoulder = [int(left + content_w * 0.12), shoulder_y]
    right_shoulder = [int(right - content_w * 0.12), shoulder_y]
    left_hip = [int(left + content_w * 0.15), hip_y]
    right_hip = [int(right - content_w * 0.15), hip_y]
    
    hem_y = int(top + content_h * 0.95)
    
    print(f"{g['id']} ({w}x{h}): bounds=({left},{top})-({right},{bottom})")
    print(f"  leftShoulder:  {left_shoulder}")
    print(f"  rightShoulder: {right_shoulder}")
    print(f"  leftHip:       {left_hip}")
    print(f"  rightHip:      {right_hip}")
    print(f"  hemLineY:      {hem_y}")
    print()
