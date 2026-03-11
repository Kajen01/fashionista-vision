import base64
import io
import json
import math
import os
import time
import traceback
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── globals ──────────────────────────────────────────────────────────

HAS_MEDIAPIPE = False
pose = None
selfie_segmentation = None
mp_pose = None
mp_drawing = None


# ── helpers ──────────────────────────────────────────────────────────

def log_performance(task: str, duration: float) -> None:
    log_file = "performance_log.csv"
    if not os.path.exists(log_file):
        with open(log_file, "w", encoding="utf-8") as f:
            f.write("timestamp,task,duration_ms\n")
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')},{task},{duration * 1000:.2f}\n")


def init_mediapipe() -> None:
    global HAS_MEDIAPIPE, pose, selfie_segmentation, mp_pose, mp_drawing

    if pose is not None and selfie_segmentation is not None:
        return

    try:
        import mediapipe as mp

        mp_pose = mp.solutions.pose
        mp_drawing = mp.solutions.drawing_utils

        pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        mp_selfie = mp.solutions.selfie_segmentation
        selfie_segmentation = mp_selfie.SelfieSegmentation(model_selection=1)

        HAS_MEDIAPIPE = True
        print("MediaPipe initialized successfully")
    except Exception as e:
        HAS_MEDIAPIPE = False
        print(f"MediaPipe initialization failed: {e}")


init_mediapipe()


def process_image(img_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def pil_to_data_url(img: Image.Image) -> str:
    buffered = io.BytesIO()
    img.convert("RGB").save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"


def get_landmark_xy(landmarks, index: int, width: int, height: int) -> Tuple[float, float]:
    lm = landmarks[index]
    return lm.x * width, lm.y * height


def dist(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    return float(math.hypot(p2[0] - p1[0], p2[1] - p1[1]))


def clamp_point(x: float, y: float, width: int, height: int) -> Tuple[float, float]:
    return (
        max(0.0, min(float(width - 1), x)),
        max(0.0, min(float(height - 1), y)),
    )


def safe_parse_params(params: str) -> Dict:
    try:
        parsed = json.loads(params) if params else {}
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def default_garment_metadata(category: str = "dress") -> Dict:
    category = (category or "dress").lower()
    if category == "top":
        return {
            "anchors": {
                "left_shoulder": [0.24, 0.10],
                "right_shoulder": [0.76, 0.10],
                "left_hip": [0.30, 0.62],
                "right_hip": [0.70, 0.62],
            },
            "height_multiplier": 1.25,
        }
    return {
        "anchors": {
            "left_shoulder": [0.24, 0.08],
            "right_shoulder": [0.76, 0.08],
            "left_hip": [0.30, 0.58],
            "right_hip": [0.70, 0.58],
        },
        "height_multiplier": 2.15,
    }


# ── body quad ────────────────────────────────────────────────────────

def build_body_quad(
    landmarks, width: int, height: int, params: Dict
) -> Dict:
    ls = get_landmark_xy(landmarks, 11, width, height)
    rs = get_landmark_xy(landmarks, 12, width, height)
    lh = get_landmark_xy(landmarks, 23, width, height)
    rh = get_landmark_xy(landmarks, 24, width, height)

    shoulder_width = max(20.0, dist(ls, rs))
    hip_width = max(20.0, dist(lh, rh))
    torso_height = max(40.0, ((lh[1] + rh[1]) / 2.0) - ((ls[1] + rs[1]) / 2.0))

    x_offset = float(params.get("xOffset", 0.0))
    y_offset = float(params.get("yOffset", 0.0))
    scale = float(params.get("scale", 1.0))
    waist_scale = float(params.get("waistScale", 1.0))

    shoulder_expand = shoulder_width * 0.14 * scale
    hip_expand = hip_width * 0.10 * waist_scale * scale
    top_lift = torso_height * 0.08 * scale

    upper_left = clamp_point(ls[0] - shoulder_expand + x_offset, ls[1] - top_lift + y_offset, width, height)
    upper_right = clamp_point(rs[0] + shoulder_expand + x_offset, rs[1] - top_lift + y_offset, width, height)
    lower_left = clamp_point(lh[0] - hip_expand + x_offset, lh[1] + y_offset, width, height)
    lower_right = clamp_point(rh[0] + hip_expand + x_offset, rh[1] + y_offset, width, height)

    return {
        "upper_left": upper_left,
        "upper_right": upper_right,
        "lower_left": lower_left,
        "lower_right": lower_right,
        "shoulder_width": shoulder_width,
        "hip_width": hip_width,
        "torso_height": torso_height,
    }


def extend_quad_for_dress(quad: Dict, width: int, height: int, params: Dict) -> Dict:
    category = str(params.get("category", "dress")).lower()
    if category == "top":
        return quad

    height_multiplier = float(params.get("heightMultiplier", 2.15))
    lower_extension = quad["torso_height"] * max(0.9, height_multiplier - 1.0)
    skirt_flare = quad["hip_width"] * 0.08

    quad["lower_left"] = clamp_point(
        quad["lower_left"][0] - skirt_flare,
        quad["lower_left"][1] + lower_extension,
        width, height,
    )
    quad["lower_right"] = clamp_point(
        quad["lower_right"][0] + skirt_flare,
        quad["lower_right"][1] + lower_extension,
        width, height,
    )
    return quad


# ── garment source quad ──────────────────────────────────────────────

def get_garment_source_quad(garment_rgba: np.ndarray, params: Dict) -> np.ndarray:
    gh, gw = garment_rgba.shape[:2]
    metadata = params.get("garmentMetadata") or default_garment_metadata(
        params.get("category", "dress")
    )
    anchors = metadata.get("anchors", {})

    ls = anchors.get("left_shoulder", [0.24, 0.08])
    rs = anchors.get("right_shoulder", [0.76, 0.08])
    lh = anchors.get("left_hip", [0.30, 0.58])
    rh = anchors.get("right_hip", [0.70, 0.58])

    return np.array(
        [
            [ls[0] * gw, ls[1] * gh],
            [rs[0] * gw, rs[1] * gh],
            [lh[0] * gw, lh[1] * gh],
            [rh[0] * gw, rh[1] * gh],
        ],
        dtype=np.float32,
    )


def rotate_points(points: np.ndarray, center: np.ndarray, angle_deg: float) -> np.ndarray:
    if abs(angle_deg) < 0.001:
        return points
    rad = math.radians(angle_deg)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    rotated = []
    for p in points:
        t = p - center
        rotated.append([t[0] * cos_a - t[1] * sin_a + center[0],
                        t[0] * sin_a + t[1] * cos_a + center[1]])
    return np.array(rotated, dtype=np.float32)


# ── perspective warp (true 4-point) ─────────────────────────────────

def warp_garment_to_body(
    user_rgb: np.ndarray,
    garment_pil: Image.Image,
    body_quad: Dict,
    params: Dict,
) -> Image.Image:
    h, w, _ = user_rgb.shape

    garment_rgba = np.array(garment_pil.convert("RGBA"))
    src_quad = get_garment_source_quad(garment_rgba, params)

    dst_quad = np.array(
        [body_quad["upper_left"], body_quad["upper_right"],
         body_quad["lower_left"], body_quad["lower_right"]],
        dtype=np.float32,
    )

    rotation = float(params.get("rotation", 0.0))
    quad_center = np.mean(dst_quad, axis=0)
    dst_quad = rotate_points(dst_quad, quad_center, rotation)

    matrix = cv2.getPerspectiveTransform(src_quad, dst_quad)
    warped = cv2.warpPerspective(
        garment_rgba, matrix, (w, h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )

    user_pil = Image.fromarray(user_rgb).convert("RGBA")
    garment_overlay = Image.fromarray(warped, mode="RGBA")
    final_img = Image.alpha_composite(user_pil, garment_overlay)

    # ── arm/head occlusion via segmentation ──
    if HAS_MEDIAPIPE and selfie_segmentation is not None:
        seg_results = selfie_segmentation.process(user_rgb)
        if seg_results.segmentation_mask is not None:
            mask = (seg_results.segmentation_mask > 0.65).astype(np.uint8) * 255
            kernel = np.ones((5, 5), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            mask = cv2.GaussianBlur(mask, (7, 7), 0)

            pose_mask = np.zeros((h, w), dtype=np.uint8)
            try:
                pose_results = pose.process(user_rgb) if pose is not None else None
                if pose_results and pose_results.pose_landmarks:
                    lm = pose_results.pose_landmarks.landmark
                    pt = lambda idx: (int(lm[idx].x * w), int(lm[idx].y * h))

                    ls, le, lw = pt(11), pt(13), pt(15)
                    rs, re, rw = pt(12), pt(14), pt(16)
                    nose = pt(0)

                    arm_t = max(18, int(dist(ls, rs) * 0.12))
                    head_r = max(26, int(dist(ls, rs) * 0.22))

                    for a, b, c in [(ls, le, lw), (rs, re, rw)]:
                        cv2.line(pose_mask, a, b, 255, arm_t)
                        cv2.line(pose_mask, b, c, 255, arm_t)
                        cv2.circle(pose_mask, b, arm_t // 2, 255, -1)
                        cv2.circle(pose_mask, c, arm_t // 2, 255, -1)

                    cv2.circle(pose_mask, nose, head_r, 255, -1)
            except Exception:
                pass

            preserve_mask = cv2.bitwise_and(mask, cv2.max(mask // 3, pose_mask))
            preserve_pil = Image.fromarray(preserve_mask).convert("L")
            final_img.paste(user_pil, (0, 0), preserve_pil)

    return final_img


# ── routes ───────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "mediapipe": HAS_MEDIAPIPE,
        "python_version": os.sys.version,
    }


@app.post("/pose")
async def get_pose(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        contents = await file.read()
        image = process_image(contents)
        h, w, _ = image.shape

        landmarks_payload: List[Dict] = []
        annotated_image = image.copy()

        if HAS_MEDIAPIPE and pose is not None:
            results = pose.process(image)
            if results.pose_landmarks:
                for lm in results.pose_landmarks.landmark:
                    landmarks_payload.append({
                        "x": lm.x, "y": lm.y,
                        "z": lm.z, "visibility": lm.visibility,
                    })
                mp_drawing.draw_landmarks(
                    annotated_image,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                )

        if not landmarks_payload:
            landmarks_payload = [
                {"x": 0.5, "y": 0.3, "z": 0.0, "visibility": 0.0}
                for _ in range(33)
            ]
            cv2.putText(
                annotated_image, "Fallback pose mode",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2,
            )

        _, buffer = cv2.imencode(".png", cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR))
        skeleton_url = f"data:image/png;base64,{base64.b64encode(buffer).decode('utf-8')}"

        duration = time.time() - start_time
        log_performance("pose", duration)

        return {
            "landmarks": landmarks_payload,
            "skeleton_image": skeleton_url,
            "method": "mediapipe" if HAS_MEDIAPIPE else "fallback",
            "image_width": w,
            "image_height": h,
        }
    except Exception as e:
        with open("ml_debug.txt", "a", encoding="utf-8") as f:
            f.write(f"Pose Error: {str(e)}\n{traceback.format_exc()}\n")
        return {"error": str(e)}


@app.post("/tryon")
async def try_on(
    user_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    params: str = Form("{}"),
):
    start_time = time.time()
    try:
        p = safe_parse_params(params)

        user_bytes = await user_image.read()
        garment_bytes = await garment_image.read()

        user_rgb = process_image(user_bytes)
        h, w, _ = user_rgb.shape
        garment_pil = Image.open(io.BytesIO(garment_bytes)).convert("RGBA")

        if not HAS_MEDIAPIPE or pose is None:
            return {"error": "MediaPipe is not available in the ML service."}

        pose_results = pose.process(user_rgb)
        if not pose_results.pose_landmarks:
            return {"error": "Could not detect body landmarks in the uploaded image."}

        body_quad = build_body_quad(pose_results.pose_landmarks.landmark, w, h, p)
        body_quad = extend_quad_for_dress(body_quad, w, h, p)

        final_img = warp_garment_to_body(user_rgb, garment_pil, body_quad, p)

        duration = time.time() - start_time
        log_performance("tryon", duration)

        return {
            "tryon_image": pil_to_data_url(final_img),
            "debug": {
                "body_quad": {
                    k: v for k, v in body_quad.items()
                    if k in ("upper_left", "upper_right", "lower_left", "lower_right",
                             "shoulder_width", "hip_width", "torso_height")
                },
                "category": p.get("category", "dress"),
                "duration_ms": round(duration * 1000, 2),
            },
        }
    except Exception as e:
        with open("ml_debug.txt", "a", encoding="utf-8") as f:
            f.write(f"TryOn Error: {str(e)}\n{traceback.format_exc()}\n")
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    # Using 8002 to avoid zombie processes on 8001
    uvicorn.run(app, host="127.0.0.1", port=8002)
