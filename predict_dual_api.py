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

# --------------------------------------------------------------
# MODEL PATHS
# --------------------------------------------------------------
BEST_MODEL_RESNET = "./model/prototype_model/prototype_trained_models/resnet50_20251120_045757/best_model.pth"
BEST_MODEL_EFFNET = "./model/prototype_model/prototype_trained_models/efficientnet_b3_20251119_081256/best_model.pth"

CLASSES_PATH = "./classes.txt"

# --------------------------------------------------------------
# FASTAPI APP
# --------------------------------------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------
# IMAGE TRANSFORMS
# --------------------------------------------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --------------------------------------------------------------
# LOAD CLASS NAMES
# --------------------------------------------------------------
with open(CLASSES_PATH, "r") as f:
    CLASS_NAMES = [line.strip() for line in f.readlines()]


# --------------------------------------------------------------
# LOAD MODELS
# --------------------------------------------------------------
def load_resnet():
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
    model.fc = nn.Linear(model.fc.in_features, len(CLASS_NAMES))
    model.load_state_dict(torch.load(BEST_MODEL_RESNET, map_location=device))
    model.to(device)
    model.eval()
    print("ResNet50 Loaded")
    return model


def load_efficientnet():
    model = efficientnet_b3(weights=EfficientNet_B3_Weights.IMAGENET1K_V1)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(CLASS_NAMES))
    model.load_state_dict(torch.load(BEST_MODEL_EFFNET, map_location=device))
    model.to(device)
    model.eval()
    print("EfficientNet-B3 Loaded")
    return model


resnet_model = load_resnet()
efficient_model = load_efficientnet()

# --------------------------------------------------------------
# PREDICT USING A MODEL
# --------------------------------------------------------------
def run_prediction(model, img_bytes):
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_tensor = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probs, dim=1)

    return CLASS_NAMES[predicted.item()], float(confidence.item())


# --------------------------------------------------------------
# API ENDPOINT
# --------------------------------------------------------------
@app.post("/predict_dual")
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()

    res1_class, res1_conf = run_prediction(resnet_model, img_bytes)
    res2_class, res2_conf = run_prediction(efficient_model, img_bytes)

    return {
        "results": [
            {
                "model": "resnet50",
                "predicted_class": res1_class,
                "confidence": res1_conf
            },
            {
                "model": "efficientnet_b3",
                "predicted_class": res2_class,
                "confidence": res2_conf
            }
        ]
    }


# --------------------------------------------------------------
# RUN SERVER
# --------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("predict_dual_api:app", host="0.0.0.0", port=8000, reload=True)
