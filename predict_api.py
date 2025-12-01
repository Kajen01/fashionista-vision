import io
import os
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models
from torchvision.models import efficientnet_b3, EfficientNet_B3_Weights
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

TRAIN_MODEL_TYPE = "resnet50"          ### resnet50 || efficientnet_b3 || MultiHeadResNet50

BEST_MODEL_PATH = "./model/prototype_model/prototype_trained_models/resnet50_20251120_045757/best_model.pth"

# ----------------------------
# FASTAPI APP
# ----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# IMAGE TRANSFORM (same as val)
# ----------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

# ----------------------------
# LOAD MODEL
# ----------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model():
    print("Loading model...")

    # Load class names from ImageFolder
    # CLASS_NAMES_PATH = os.path.join(LOCAL_MODEL_DIR, "classes.txt")

    CLASS_NAMES_PATH = "./classes.txt"
    if not os.path.exists(CLASS_NAMES_PATH):
        raise FileNotFoundError("classes.txt not found. Save it during training.")

    with open(CLASS_NAMES_PATH, "r") as f:
        classes = [line.strip() for line in f.readlines()]

    num_classes = len(classes)

    # ----------------------
    # CREATE MODEL
    # ----------------------
    if TRAIN_MODEL_TYPE == "efficientnet_b3":
        model = efficientnet_b3(weights=EfficientNet_B3_Weights.IMAGENET1K_V1)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)

    elif TRAIN_MODEL_TYPE == "resnet50":
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
        model.fc = nn.Linear(model.fc.in_features, num_classes)

    else:
        raise ValueError(f"Unknown TRAIN_MODEL_TYPE: {TRAIN_MODEL_TYPE}")

    # ----------------------
    # LOAD SAVED WEIGHTS
    # ----------------------
    model.load_state_dict(torch.load(BEST_MODEL_PATH, map_location=device))
    model.to(device)
    model.eval()

    print("Model loaded successfully.")
    return model, classes

model, class_names = load_model()

# ----------------------------
# PREDICT FUNCTION
# ----------------------------
def predict_image(img_bytes: bytes):
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_t = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_t)
        probs = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probs, dim=1)

    return class_names[predicted.item()], float(confidence.item())


# ----------------------------
# API ROUTE
# ----------------------------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    
    predicted_class, confidence = predict_image(img_bytes)

    return {
        "predicted_class": predicted_class,
        "confidence": confidence
    }


# ----------------------------
# RUN SERVER
# ----------------------------
if __name__ == "__main__":
    uvicorn.run("predict_api:app", host="0.0.0.0", port=8000, reload=True)
