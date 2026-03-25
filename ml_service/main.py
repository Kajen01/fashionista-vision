import base64
import io
import json
import os
import time
import traceback

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI()

GARMENT_SKELETON_SEGMENTS = [
    ["leftShoulder", "rightShoulder"],
    ["leftShoulder", "leftWaist"],
    ["rightShoulder", "rightWaist"],
    ["leftWaist", "hemLeft"],
    ["rightWaist", "hemRight"],
    ["hemLeft", "hemCenter"],
    ["hemCenter", "hemRight"],
]

REQUIRED_GARMENT_POINTS = [
    "leftShoulder",
    "rightShoulder",
    "leftWaist",
    "rightWaist",
]


def log_performance(task, duration):
    log_file = "performance_log.csv"
    if not os.path.exists(log_file):
        with open(log_file, "w") as f:
            f.write("timestamp,task,duration_ms\n")
    with open(log_file, "a") as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')},{task},{duration * 1000:.2f}\n")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HAS_MEDIAPIPE = False
pose = None
mp_pose = None
mp_drawing = None
selfie_segmentation = None


def init_mediapipe():
    global HAS_MEDIAPIPE, pose, mp_pose, mp_drawing, selfie_segmentation
    if pose is not None:
        return
    try:
        import mediapipe as mp

        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
        mp_drawing = mp.solutions.drawing_utils
        mp_selfie = mp.solutions.selfie_segmentation
        selfie_segmentation = mp_selfie.SelfieSegmentation(model_selection=1)
        HAS_MEDIAPIPE = True
        print("MediaPipe initialized successfully")
    except Exception as e:
        print(f"MediaPipe initialization failed: {e}. Falling back to manual mode.")
        HAS_MEDIAPIPE = False


init_mediapipe()


def process_image(img_bytes):
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def load_rgba_image(img_bytes):
    return Image.open(io.BytesIO(img_bytes)).convert("RGBA")


def image_to_base64_png(image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def build_garment_mask(rgba_image):
    rgba = np.array(rgba_image)
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]

    if np.any(alpha < 250):
        mask = np.where(alpha > 15, 255, 0).astype(np.uint8)
    else:
        light_background = (rgb[:, :, 0] > 240) & (rgb[:, :, 1] > 240) & (rgb[:, :, 2] > 240)
        mask = np.where(~light_background, 255, 0).astype(np.uint8)

    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError("Unable to isolate garment silhouette")

    largest = max(contours, key=cv2.contourArea)
    filled_mask = np.zeros_like(mask)
    cv2.drawContours(filled_mask, [largest], -1, 255, thickness=cv2.FILLED)
    return filled_mask


def crop_to_mask(rgba_image, mask, padding_ratio=0.06):
    ys, xs = np.where(mask > 0)
    if xs.size == 0 or ys.size == 0:
        raise ValueError("Garment silhouette is empty after masking")

    source_h, source_w = mask.shape
    min_x, max_x = xs.min(), xs.max()
    min_y, max_y = ys.min(), ys.max()
    pad_x = max(4, int((max_x - min_x + 1) * padding_ratio))
    pad_y = max(4, int((max_y - min_y + 1) * padding_ratio))

    x0 = max(0, min_x - pad_x)
    y0 = max(0, min_y - pad_y)
    x1 = min(source_w, max_x + pad_x + 1)
    y1 = min(source_h, max_y + pad_y + 1)

    rgba = np.array(rgba_image)
    rgba[:, :, 3] = np.where(mask > 0, mask, 0)
    cropped_rgba = rgba[y0:y1, x0:x1].copy()
    cropped_mask = mask[y0:y1, x0:x1].copy()

    return (
        Image.fromarray(cropped_rgba, mode="RGBA"),
        cropped_mask,
        {"width": int(source_w), "height": int(source_h)},
        {"x": int(x0), "y": int(y0), "width": int(x1 - x0), "height": int(y1 - y0)},
    )


def infer_garment_type(cropped_mask):
    h, w = cropped_mask.shape
    aspect_ratio = h / max(w, 1)
    return "dress" if aspect_ratio > 1.25 else "top"


def find_row_bounds(mask, target_fraction, minimum_coverage=0.04, search_radius=36):
    height, width = mask.shape
    target_row = int((height - 1) * target_fraction)
    min_pixels = max(8, int(width * minimum_coverage))

    for offset in range(search_radius + 1):
        candidates = [target_row - offset, target_row + offset] if offset else [target_row]
        for row in candidates:
            if row < 0 or row >= height:
                continue
            xs = np.where(mask[row] > 0)[0]
            if xs.size >= min_pixels:
                return row, xs
    return None, None


def normalize_point(x, y, width, height, confidence):
    return {
        "x": round(float(x) / max(width - 1, 1), 4),
        "y": round(float(y) / max(height - 1, 1), 4),
        "confidence": round(float(confidence), 4),
    }


def infer_garment_keypoints(cropped_mask, garment_type):
    height, width = cropped_mask.shape
    shoulder_row, shoulder_xs = find_row_bounds(cropped_mask, 0.12, minimum_coverage=0.06)
    waist_fraction = 0.56 if garment_type == "top" else 0.43
    waist_row, waist_xs = find_row_bounds(cropped_mask, waist_fraction, minimum_coverage=0.05)
    hem_row, hem_xs = find_row_bounds(cropped_mask, 0.96, minimum_coverage=0.03, search_radius=18)

    if shoulder_xs is None or waist_xs is None or hem_xs is None:
        raise ValueError("Failed to derive garment anchor points")

    def inset(bounds, ratio):
        left = int(bounds[0])
        right = int(bounds[-1])
        span = max(1, right - left)
        offset = int(span * ratio)
        return left + offset, right - offset

    shoulder_left, shoulder_right = inset(shoulder_xs, 0.06)
    waist_left, waist_right = inset(waist_xs, 0.05)
    hem_left = int(hem_xs[0])
    hem_right = int(hem_xs[-1])
    hem_center = int((hem_left + hem_right) / 2)

    shoulder_confidence = min(1.0, shoulder_xs.size / max(int(width * 0.55), 1))
    waist_confidence = min(1.0, waist_xs.size / max(int(width * 0.45), 1))
    hem_confidence = min(1.0, hem_xs.size / max(int(width * 0.35), 1))

    keypoints = {
        "leftShoulder": normalize_point(shoulder_left, shoulder_row, width, height, shoulder_confidence),
        "rightShoulder": normalize_point(shoulder_right, shoulder_row, width, height, shoulder_confidence),
        "leftWaist": normalize_point(waist_left, waist_row, width, height, waist_confidence),
        "rightWaist": normalize_point(waist_right, waist_row, width, height, waist_confidence),
        "hemLeft": normalize_point(hem_left, hem_row, width, height, hem_confidence),
        "hemRight": normalize_point(hem_right, hem_row, width, height, hem_confidence),
        "hemCenter": normalize_point(hem_center, hem_row, width, height, hem_confidence),
    }

    confidence = float(np.mean([keypoints[name]["confidence"] for name in REQUIRED_GARMENT_POINTS]))
    if confidence < 0.45:
        raise ValueError("Garment analysis confidence is too low")

    return keypoints, confidence


@app.post("/pose")
async def get_pose(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        contents = await file.read()
        image = process_image(contents)

        landmarks = None
        results = None

        if HAS_MEDIAPIPE:
            results = pose.process(image)
            if results.pose_landmarks:
                landmarks = []
                for lm in results.pose_landmarks.landmark:
                    landmarks.append({"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility})

        if not landmarks:
            landmarks = [{"x": 0.5, "y": 0.3} for _ in range(33)]

        annotated_image = image.copy()
        if HAS_MEDIAPIPE and results and results.pose_landmarks:
            mp_drawing.draw_landmarks(annotated_image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        else:
            cv2.putText(
                annotated_image,
                "Manual Mode Active (No Pose Detection)",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2,
            )

        _, buffer = cv2.imencode('.png', cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR))
        img_str = base64.b64encode(buffer).decode("utf-8")
        log_performance("pose", time.time() - start_time)

        return {
            "landmarks": landmarks,
            "skeleton_image": f"data:image/png;base64,{img_str}",
            "method": "mediapipe" if (HAS_MEDIAPIPE and results and results.pose_landmarks) else "fallback",
        }
    except Exception as e:
        with open("ml_debug.txt", "a") as f:
            f.write(f"Pose Error: {str(e)}\n{traceback.format_exc()}\n")
        print(f"ML Service Error (pose): {str(e)}")
        return {"error": str(e)}


@app.post("/garment/analyze")
async def analyze_garment(garment_image: UploadFile = File(...)):
    start_time = time.time()
    try:
        garment_bytes = await garment_image.read()
        garment_rgba = load_rgba_image(garment_bytes)
        mask = build_garment_mask(garment_rgba)
        cropped_image, cropped_mask, source_size, crop_box = crop_to_mask(garment_rgba, mask)
        garment_type = infer_garment_type(cropped_mask)
        keypoints, confidence = infer_garment_keypoints(cropped_mask, garment_type)
        log_performance("garment_analyze", time.time() - start_time)

        return {
            "cropped_image": f"data:image/png;base64,{image_to_base64_png(cropped_image)}",
            "garmentType": garment_type,
            "keypoints": keypoints,
            "skeletonSegments": GARMENT_SKELETON_SEGMENTS,
            "sourceSize": source_size,
            "cropBox": crop_box,
            "confidence": round(confidence, 4),
        }
    except Exception as e:
        with open("ml_debug.txt", "a") as f:
            f.write(f"Garment Analyze Error: {str(e)}\n{traceback.format_exc()}\n")
        print(f"ML Service Error (garment/analyze): {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/tryon")
async def try_on(
    user_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    params: str = Form(...),
):
    start_time = time.time()
    try:
        try:
            p = json.loads(params)
        except Exception:
            p = {"scale": 1.15, "xOffset": 0, "yOffset": 0, "rotation": 0}

        user_bytes = await user_image.read()
        garment_bytes = await garment_image.read()

        user_img = process_image(user_bytes)
        h, w, _ = user_img.shape
        garment_img = load_rgba_image(garment_bytes)

        ls = rs = None
        if HAS_MEDIAPIPE:
            results = pose.process(user_img)
            if results.pose_landmarks:
                lm = results.pose_landmarks.landmark
                ls = (lm[11].x * w, lm[11].y * h)
                rs = (lm[12].x * w, lm[12].y * h)

        if ls is None or rs is None:
            ls = (w * 0.35, h * 0.25)
            rs = (w * 0.65, h * 0.25)

        mid_x = (ls[0] + rs[0]) / 2
        mid_y = (ls[1] + rs[1]) / 2
        shoulder_width = np.sqrt((rs[0] - ls[0]) ** 2 + (rs[1] - ls[1]) ** 2)
        angle = np.degrees(np.arctan2(rs[1] - ls[1], rs[0] - ls[0]))

        target_width = max(10, int(shoulder_width * p.get("scale", 1.15)))
        aspect_ratio = garment_img.height / max(garment_img.width, 1)
        target_height = max(10, int(target_width * aspect_ratio))

        garment_resized = garment_img.resize((target_width, target_height), Image.LANCZOS)
        garment_rotated = garment_resized.rotate(-angle + p.get("rotation", 0), expand=True, resample=Image.BICUBIC)

        user_pil = Image.fromarray(user_img)
        garment_overlay = Image.new("RGBA", user_pil.size, (0, 0, 0, 0))

        rw, rh = garment_rotated.size
        paste_x = int(mid_x - rw // 2 + p.get("xOffset", 0))
        paste_y = int(mid_y - rh // 8 + p.get("yOffset", 0))
        garment_overlay.paste(garment_rotated, (paste_x, paste_y), garment_rotated)

        if HAS_MEDIAPIPE and selfie_segmentation is not None:
            seg_results = selfie_segmentation.process(user_img)
            condition = seg_results.segmentation_mask > 0.4
            mask_arr = (condition * 255).astype(np.uint8)
            person_mask = Image.fromarray(mask_arr).convert("L")
            final_img = Image.alpha_composite(user_pil.convert("RGBA"), garment_overlay)
            final_img.paste(user_pil.convert("RGBA"), (0, 0), person_mask)
        else:
            final_img = Image.alpha_composite(user_pil.convert("RGBA"), garment_overlay)

        img_str = image_to_base64_png(final_img.convert("RGBA"))
        log_performance("tryon", time.time() - start_time)

        return {"tryon_image": f"data:image/png;base64,{img_str}"}
    except Exception as e:
        with open("ml_debug.txt", "a") as f:
            f.write(f"TryOn Error: {str(e)}\n{traceback.format_exc()}\n")
        print(f"ML Service Error (tryon): {str(e)}")
        return {"error": str(e)}


@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "mediapipe": HAS_MEDIAPIPE,
        "python_version": "3.13.7",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8002)


