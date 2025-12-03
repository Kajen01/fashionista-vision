import io
import os
import csv
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models
from torchvision.models import efficientnet_b3, EfficientNet_B3_Weights
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# --------------------------------------------------------------
# PATHS
# --------------------------------------------------------------
BEST_MODEL_RESNET = "./model/prototype_model/prototype_trained_models/resnet50_20251120_045757/best_model.pth"
BEST_MODEL_EFFNET = "./model/prototype_model/prototype_trained_models/efficientnet_b3_20251119_081256/best_model.pth"

MULTI_MODEL_PATH = "./model/dress_pattern_color_model/trained_models/dress_pattern_color_model_20251203_153404/best_model_10.pth"

CLASSES_PATH = "./classes.txt"
STYLES_CSV = "./model/dress_pattern_color_model/dataset/styles.csv"

# --------------------------------------------------------------
# FASTAPI
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
# TRANSFORMS
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


# -------------------------------
# DATASET ATTRIBUTES
# -------------------------------
class AttributesDataset():
    def __init__(self, annotation_path):
        color_labels, gender_labels, article_labels = [], [], []

        with open(annotation_path) as f:
            reader = csv.DictReader(f)
            for row in reader:
                color_labels.append(row['baseColour'])
                gender_labels.append(row['gender'])
                article_labels.append(row['articleType'])

        self.color_labels = np.unique(color_labels)
        self.gender_labels = np.unique(gender_labels)
        self.article_labels = np.unique(article_labels)

        self.num_colors = len(self.color_labels)
        self.num_genders = len(self.gender_labels)
        self.num_articles = len(self.article_labels)

        self.color_id_to_name = {i: name for i, name in enumerate(self.color_labels)}
        self.gender_id_to_name = {i: name for i, name in enumerate(self.gender_labels)}
        self.article_id_to_name = {i: name for i, name in enumerate(self.article_labels)}


# --------------------------------------------------------------
# LOAD CLASS NAMES
# --------------------------------------------------------------
with open(CLASSES_PATH, "r") as f:
    CLASS_NAMES = [line.strip() for line in f.readlines()]


# -------------------------------
# MULTI-OUTPUT MODEL
# -------------------------------
class MultiOutputModel(nn.Module):
    def __init__(self, n_color_classes, n_gender_classes, n_article_classes):
        super().__init__()

        resnet = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
        self.base_model = nn.Sequential(*list(resnet.children())[:-2])
        last_channel = resnet.fc.in_features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))

        self.heads = nn.ModuleDict({
            "baseColour": nn.Linear(last_channel, n_color_classes),
            "gender": nn.Linear(last_channel, n_gender_classes),
            "articleType": nn.Linear(last_channel, n_article_classes)
        })

    def forward(self, x):
        x = self.base_model(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)

        return {
            "baseColour": self.heads["baseColour"](x),
            "gender": self.heads["gender"](x),
            "articleType": self.heads["articleType"](x)
        }


# --------------------------------------------------------------
# LOAD RESNET
# --------------------------------------------------------------
def load_resnet():
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
    model.fc = nn.Linear(model.fc.in_features, len(CLASS_NAMES))
    model.load_state_dict(torch.load(BEST_MODEL_RESNET, map_location=device))
    model.to(device)
    model.eval()
    return model


# --------------------------------------------------------------
# LOAD EFFICIENTNET
# --------------------------------------------------------------
def load_efficientnet():
    model = efficientnet_b3(weights=EfficientNet_B3_Weights.IMAGENET1K_V1)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(CLASS_NAMES))
    model.load_state_dict(torch.load(BEST_MODEL_EFFNET, map_location=device))
    model.to(device)
    model.eval()
    return model


# --------------------------------------------------------------
# LOAD MULTI-MODEL
# --------------------------------------------------------------
def load_multi_output_model():
    attrs = AttributesDataset(STYLES_CSV)

    model = MultiOutputModel(
        n_color_classes=47,
        n_gender_classes=5,
        n_article_classes=141
    ).to(device)

    checkpoint = torch.load(MULTI_MODEL_PATH, map_location=device)
    model.load_state_dict(checkpoint, strict=False)
    model.eval()

    return model, attrs


# Load all models
resnet_model = load_resnet()
efficient_model = load_efficientnet()
multi_model, attrs = load_multi_output_model()


# --------------------------------------------------------------
# PREDICT HELPER
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
# MULTI-HEAD PREDICTION
# --------------------------------------------------------------
def run_multi_prediction(model, img_bytes):
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_tensor = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        out = model(img_tensor)

        # print("Raw multi-output:", out)

        color_id = out["baseColour"].argmax(1).item()
        gender_id = out["gender"].argmax(1).item()
        article_id = out["articleType"].argmax(1).item()

    return {
        "baseColour": attrs.color_id_to_name[color_id],
        "gender": attrs.gender_id_to_name[gender_id],
        "articleType": attrs.article_id_to_name[article_id],
    }


# --------------------------------------------------------------
# API ENDPOINT
# --------------------------------------------------------------
@app.post("/predict_multi")
async def predict_multi(file: UploadFile = File(...)):
    img_bytes = await file.read()

    # Single-class models
    res1_class, res1_conf = run_prediction(resnet_model, img_bytes)
    res2_class, res2_conf = run_prediction(efficient_model, img_bytes)

    # Multi-output model
    multi_output = run_multi_prediction(multi_model, img_bytes)

    return {
        "single_models": [
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
        ],
        "multi_model": multi_output
    }


# --------------------------------------------------------------
# RUN SERVER
# --------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("predict_multi_api:app", host="0.0.0.0", port=8000, reload=True)
