import modal
import os
from train_model import train_model

APP_NAME = "dm_project_pattern_color_model"

# Use a single mount point for the volume
VOLUME_MOUNT = "/mnt/vol"
DATASET_DIR = os.path.join(VOLUME_MOUNT, "dataset")      # dataset/images, dataset/train.csv, dataset/val.csv
MODEL_OUTPUT_DIR = os.path.join(VOLUME_MOUNT, "model_out")  # output models

app = modal.App(APP_NAME)

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git", "wget", "curl", "unzip")
    .pip_install(
        "torch==2.2.2",
        "torchvision==0.17.2",
        "Pillow",
        "numpy<2",
        "tqdm",
        "matplotlib",
        "pandas",
        "scikit-learn",
        "seaborn",
        "boto3"
    )
    .add_local_python_source("train_model", "config", "logger", "graphs_generator")
)

# Create / attach the Modal volume
vol = modal.Volume.from_name("dm_project_model_vol", create_if_missing=True)

@app.function(
    image=image,
    gpu="A100",
    timeout=86400,  # max 24h
    volumes={VOLUME_MOUNT: vol},  # single mount
)
def train_on_modal():
    # Create directories if missing
    os.makedirs(DATASET_DIR, exist_ok=True)
    os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)

    train_csv_path = os.path.join(DATASET_DIR, "train.csv")
    val_csv_path   = os.path.join(DATASET_DIR, "val.csv")
    images_path    = os.path.join(DATASET_DIR, "images")

    # print("Listing files inside Modal volume:")
    # for root, dirs, files in os.walk("/mnt/vol/dataset/images", topdown=True):
    #     for name in files:
    #         print(os.path.join(root, name))
    #     break  # just list top level one time

    # Checks
    if not os.path.exists(train_csv_path):
        raise FileNotFoundError(f"train.csv not found at {train_csv_path}")
    if not os.path.exists(val_csv_path):
        raise FileNotFoundError(f"val.csv not found at {val_csv_path}")
    if not os.path.exists(images_path):
        raise FileNotFoundError(f"images/ folder not found at {images_path}")

    print("Dataset found. Starting training...")

    # Run training
    train_model(
        train_csv=train_csv_path,
        val_csv=val_csv_path,
        # images_dir=images_path,
        model_save_dir=MODEL_OUTPUT_DIR,
        epochs=10,
        batch_size=64,
        num_workers=8,
        lr=5e-5,
    )

    print("Training completed. Models saved in:", MODEL_OUTPUT_DIR)


if __name__ == "__main__":
    print("Use:")
    print("modal deploy modal_app.py")
    print("modal run modal_app.py::train_on_modal")
