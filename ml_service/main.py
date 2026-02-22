import cv2
import mediapipe as mp
import numpy as np
import base64
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import json
import traceback
import time
import os

app = FastAPI()

def log_performance(task, duration):
    log_file = "performance_log.csv"
    if not os.path.exists(log_file):
        with open(log_file, "w") as f:
            f.write("timestamp,task,duration_ms\n")
    with open(log_file, "a") as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')},{task},{duration*1000:.2f}\n")

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

def init_mediapipe():
    global HAS_MEDIAPIPE, pose, mp_pose, mp_drawing
    if pose is not None:
        return
    try:
        import mediapipe as mp
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
        mp_drawing = mp.solutions.drawing_utils
        
        # Add Selfie Segmentation for occlusion
        global selfie_segmentation
        mp_selfie = mp.solutions.selfie_segmentation
        selfie_segmentation = mp_selfie.SelfieSegmentation(model_selection=1)
        
        HAS_MEDIAPIPE = True
        print("MediaPipe initialized successfully")
    except Exception as e:
        print(f"MediaPipe initialization failed: {e}. Falling back to manual mode.")
        HAS_MEDIAPIPE = False

# Call init once at start, but ignore errors
init_mediapipe()

def process_image(img_bytes):
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

@app.post("/pose")
async def get_pose(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        contents = await file.read()
        image = process_image(contents)
        h, w, _ = image.shape
        
        landmarks = None
        results = None
        
        if HAS_MEDIAPIPE:
            results = pose.process(image)
            if results.pose_landmarks:
                landmarks = []
                for lm in results.pose_landmarks.landmark:
                    landmarks.append({"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility})
        
        # Fallback landmarks (estimated center of image)
        if not landmarks:
            landmarks = [{"x": 0.5, "y": 0.3} for _ in range(33)] # Basic fallback
        
        # Draw skeleton for debug
        annotated_image = image.copy()
        if HAS_MEDIAPIPE and results and results.pose_landmarks:
            mp_drawing.draw_landmarks(annotated_image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        else:
            # Just draw a status message or points
            cv2.putText(annotated_image, "Manual Mode Active (No Pose Detection)", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        # Convert to base64
        _, buffer = cv2.imencode('.png', cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR))
        img_str = base64.b64encode(buffer).decode("utf-8")
        
        return {
            "landmarks": landmarks,
            "skeleton_image": f"data:image/png;base64,{img_str}",
            "method": "mediapipe" if (HAS_MEDIAPIPE and results and results.pose_landmarks) else "fallback"
        }
    except Exception as e:
        with open("ml_debug.txt", "a") as f:
            f.write(f"Pose Error: {str(e)}\n{traceback.format_exc()}\n")
        print(f"ML Service Error (pose): {str(e)}")
        return {"error": str(e)}

@app.post("/tryon")
async def try_on(
    user_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    params: str = Form(...)
):
    start_time = time.time()
    try:
        try:
            p = json.loads(params)
        except:
            p = {"scale": 1.15, "xOffset": 0, "yOffset": 0, "rotation": 0}
            
        user_bytes = await user_image.read()
        garment_bytes = await garment_image.read()
        
        user_img = process_image(user_bytes)
        h, w, _ = user_img.shape
        print(f"ML Service: Processing user image, dimensions: {w}x{h}")
        # Use PIL for garment to preserve alpha
        garment_img = Image.open(io.BytesIO(garment_bytes)).convert("RGBA")
        
        # 1. Get user pose landmarks
        ls = rs = None
        if HAS_MEDIAPIPE:
            results = pose.process(user_img)
            if results.pose_landmarks:
                lm = results.pose_landmarks.landmark
                ls = (lm[11].x * w, lm[11].y * h)
                rs = (lm[12].x * w, lm[12].y * h)
        
        # Fallback to center-upper third if no landmarks
        if ls is None or rs is None:
            ls = (w * 0.35, h * 0.25)
            rs = (w * 0.65, h * 0.25)
        
        # Midpoint and width
        mid_x = (ls[0] + rs[0]) / 2
        mid_y = (ls[1] + rs[1]) / 2
        shoulder_width = np.sqrt((rs[0] - ls[0])**2 + (rs[1] - ls[1])**2)
        angle = np.degrees(np.arctan2(rs[1] - ls[1], rs[0] - ls[0]))
        
        # 2. Transform garment
        # Target width = shoulder_width * scale
        target_width = max(10, int(shoulder_width * p.get("scale", 1.15)))
        aspect_ratio = garment_img.height / garment_img.width
        target_height = max(10, int(target_width * aspect_ratio))
        
        garment_resized = garment_img.resize((target_width, target_height), Image.LANCZOS)
        garment_rotated = garment_resized.rotate(-angle + p.get("rotation", 0), expand=True, resample=Image.BICUBIC)
        
        # 3. Composite
        user_pil = Image.fromarray(user_img)
        
        # Create garment overlay
        garment_overlay = Image.new("RGBA", user_pil.size, (0,0,0,0))
        
        # Position: top-center of garment at midpoint M with offsets
        rw, rh = garment_rotated.size
        paste_x = int(mid_x - rw // 2 + p.get("xOffset", 0))
        paste_y = int(mid_y - rh // 8 + p.get("yOffset", 0)) 
        
        garment_overlay.paste(garment_rotated, (paste_x, paste_y), garment_rotated)
        
        # 4. Occlusion (The Magic Part)
        if HAS_MEDIAPIPE and 'selfie_segmentation' in globals():
            # Get mask of the person
            seg_results = selfie_segmentation.process(user_img)
            condition = seg_results.segmentation_mask > 0.4
            
            # Convert condition to PIL mask
            mask_arr = (condition * 255).astype(np.uint8)
            person_mask = Image.fromarray(mask_arr).convert("L")
            
            # Step-by-step composition:
            # A. User Photo
            # B. Paste garment
            # C. Paste user's FOREGROUND (mask) AGAIN to put arms/hair over garment
            final_img = Image.alpha_composite(user_pil.convert("RGBA"), garment_overlay)
            final_img.paste(user_pil.convert("RGBA"), (0, 0), person_mask)
        else:
            # Simple Paste (Fallback)
            final_img = Image.alpha_composite(user_pil.convert("RGBA"), garment_overlay)
        
        # Convert back to base64
        buffered = io.BytesIO()
        final_img.convert("RGB").save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return {
            "tryon_image": f"data:image/png;base64,{img_str}"
        }
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
        "python_version": "3.13.7"
    }

if __name__ == "__main__":
    import uvicorn
    # Using 8002 to avoid zombie processes on 8001
    uvicorn.run(app, host="127.0.0.1", port=8002)
