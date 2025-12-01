import os
import html
import torch
import torch.nn as nn
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader
from tqdm import tqdm
import boto3
from pipeline_config import *
from logger import setup_logger
from graphs_generator import generate_all_graphs
import shutil
from torchvision.models import efficientnet_b3, EfficientNet_B3_Weights

logger = setup_logger()

# Initialize S3 client
s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=REGION_NAME
)

def clean_dataset_folder(base_dir, valid_exts=None):
    # Fix HTML-encoded class names and remove empty folders.
    if valid_exts is None:
        valid_exts = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp')

    for cls in os.listdir(base_dir):
        cls_path = os.path.join(base_dir, cls)
        if not os.path.isdir(cls_path):
            continue

        # Decode HTML entities in folder names
        decoded_cls = html.unescape(cls)
        if decoded_cls != cls:
            decoded_path = os.path.join(base_dir, decoded_cls)
            os.rename(cls_path, decoded_path)
            cls_path = decoded_path
            logger.info(f"Renamed folder: {cls} => {decoded_cls}")

        # Check if folder contains valid images
        valid_files = [f for f in os.listdir(cls_path) if f.lower().endswith(valid_exts)]
        if not valid_files:
            logger.warning(f"No valid images in folder {cls_path}. Removing folder.")
            os.rmdir(cls_path)


def train_model():
    logger.info("Starting model training.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")

    # Metric tracking lists
    train_acc_list = []
    val_acc_list = []
    train_loss_list = []
    val_loss_list = []

    # ---------------------------
    # Data transforms
    # ---------------------------
    data_transforms = {
        "train": transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(10),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ]),
        "val": transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ]),
    }

    # ---------------------------
    # Fix folders before ImageFolder
    # ---------------------------
    clean_dataset_folder(LOCAL_TRAIN_DIR)
    clean_dataset_folder(LOCAL_VAL_DIR)

    # ---------------------------
    # Dataset & DataLoader
    # ---------------------------
    train_data = datasets.ImageFolder(LOCAL_TRAIN_DIR, transform=data_transforms["train"])
    val_data = datasets.ImageFolder(LOCAL_VAL_DIR, transform=data_transforms["val"])

    train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS)
    val_loader = DataLoader(val_data, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)

    # ---------------------------
    # Model setup
    # ---------------------------
    if TRAIN_MODEL_TYPE == "efficientnet_b3":
        model = efficientnet_b3(weights=EfficientNet_B3_Weights.IMAGENET1K_V1)
        # EfficientNet uses model.classifier[1]
        num_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_features, len(train_data.classes))

    elif TRAIN_MODEL_TYPE == "resnet50":
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
        # ResNet uses model.fc
        num_features = model.fc.in_features
        model.fc = nn.Linear(num_features, len(train_data.classes))

    else:
        raise ValueError(f"Unknown model type: {TRAIN_MODEL_TYPE}")

    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # ---------------------------
    # AUTO RESUME CHECKPOINT
    # ---------------------------
    os.makedirs(LOCAL_MODEL_DIR, exist_ok=True)

    local_model_dir_of_last_run =  LOCAL_MODEL_DIR_OF_LAST_RUN

    if local_model_dir_of_last_run is None:
        # New Training Run
        local_model_dir_of_last_run = LOCAL_MODEL_DIR
        logger.info(f"Starting NEW training run => Saving models in {local_model_dir_of_last_run}")
    else:
        # Resume Run
        if not os.path.exists(local_model_dir_of_last_run):
            raise ValueError(f"LOCAL_MODEL_DIR_OF_LAST_RUN path does not exist: {local_model_dir_of_last_run}")
        logger.info(f"Resuming training from directory => {local_model_dir_of_last_run}")

    LAST_CHECKPOINT = os.path.join(local_model_dir_of_last_run, "last_checkpoint.pth")
    BEST_MODEL_PATH = os.path.join(local_model_dir_of_last_run, "best_model.pth")

    start_epoch = 0
    best_acc = -1.0
    best_model_temp_path = None
    last_epoch_completed = 0

    if os.path.exists(LAST_CHECKPOINT):
        checkpoint = torch.load(LAST_CHECKPOINT, map_location=device)
        
        model.load_state_dict(checkpoint["model_state"])
        optimizer.load_state_dict(checkpoint["optimizer_state"])
        start_epoch = checkpoint["epoch"] + 1
        best_acc = checkpoint["best_acc"]

        train_acc_list = checkpoint["train_acc_list"]
        val_acc_list = checkpoint["val_acc_list"]
        train_loss_list = checkpoint["train_loss_list"]
        val_loss_list = checkpoint["val_loss_list"]

        logger.info(f"Auto-resume enabled => Resuming from epoch: {start_epoch} with best accuracy: {best_acc}")
    else:
        logger.info("No previous checkpoint found => Starting fresh!")
    
    # ---------------------------
    # Training loop
    # ---------------------------
    TOTAL_EPOCHS = start_epoch + EPOCHS
    for epoch in range(start_epoch, TOTAL_EPOCHS):
        model.train()
        correct, total = 0, 0
        running_loss = 0

        for imgs, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{TOTAL_EPOCHS}"):
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()

            outputs = model(imgs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

            _, preds = outputs.max(1)
            correct += preds.eq(labels).sum().item()
            total += labels.size(0)

        train_acc = 100 * correct / total if total > 0 else 0.0
        train_loss = running_loss / len(train_loader) if len(train_loader) > 0 else 0.0

        # Validation
        model.eval()
        val_correct, val_total = 0, 0
        val_running_loss = 0

        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                outputs = model(imgs)

                val_loss = criterion(outputs, labels)
                val_running_loss += val_loss.item()

                _, preds = outputs.max(1)
                val_correct += preds.eq(labels).sum().item()
                val_total += labels.size(0)

        val_acc = 100 * val_correct / val_total if val_total > 0 else 0.0
        val_loss = val_running_loss / len(val_loader) if len(val_loader) > 0 else 0.0

        # store metrics
        train_acc_list.append(train_acc)
        val_acc_list.append(val_acc)
        train_loss_list.append(train_loss)
        val_loss_list.append(val_loss)

        logger.info(f"Epoch {epoch+1}: Train {train_acc:.2f}%, Val {val_acc:.2f}%")
            
        # Save model for every epoch
        model_path = os.path.join(
            LOCAL_MODEL_DIR,
            f"dress_type_model_epoch_{epoch+1}_acc_{val_acc:.2f}.pth"
        )
        torch.save(model.state_dict(), model_path)
        logger.info(f"Saved model => {model_path}")

        # Upload to S3 also for every epoch
        s3_key = f"{TRAINED_MODEL_PREFIX}/dress_type_model_epoch_{epoch+1}_acc_{val_acc:.2f}.pth"
        try:
            s3.upload_file(model_path, BUCKET, s3_key)
            logger.info(f"Uploaded to S3 => s3://{BUCKET}/{s3_key}")
        except Exception as e:
            logger.warning(f"Failed to upload epoch model to S3 ({s3_key}): {e}")

        if val_acc >= best_acc:
            best_acc = val_acc
            best_model_temp_path = model_path
            logger.info(f"New BEST MODEL found at epoch {epoch+1} with Acc {best_acc:.2f}%")

        last_epoch_completed = epoch
    # ---------------------------
    # SAVE LAST CHECKPOINT
    # ---------------------------
    last_checkpoint_data = {
        "epoch": last_epoch_completed,
        "model_state": model.state_dict(),
        "optimizer_state": optimizer.state_dict(),
        "best_acc": best_acc,
        "train_acc_list": train_acc_list,
        "val_acc_list": val_acc_list,
        "train_loss_list": train_loss_list,
        "val_loss_list": val_loss_list
    }

    last_checkpoint_path = os.path.join(LOCAL_MODEL_DIR, "last_checkpoint.pth")
    torch.save(last_checkpoint_data, last_checkpoint_path)
    logger.info(f"Saved LAST CHECKPOINT epoch: {last_epoch_completed+1} => {last_checkpoint_path}")

    try:
        s3.upload_file(last_checkpoint_path, BUCKET, f"{TRAINED_MODEL_PREFIX}/last_checkpoint.pth")
        logger.info(f"Uploaded LAST CHECKPOINT => s3://{BUCKET}/{TRAINED_MODEL_PREFIX}/last_checkpoint.pth")
    except Exception as e:
        logger.error(f"Failed to upload last checkpoint to S3: {e}")

    # ---------------------------
    # SAVE BEST MODEL
    # ---------------------------
    if best_model_temp_path is None:
        # no improvement recorded: try to pick the last epoch file
        if val_acc_list:
            fallback_epoch = last_epoch_completed + 1
            fallback_acc = val_acc_list[-1]
            best_model_temp_path = os.path.join(
                LOCAL_MODEL_DIR,
                f"dress_type_model_epoch_{fallback_epoch}_acc_{fallback_acc:.2f}.pth"
            )
        else:
            best_model_temp_path = None

    best_model_path = os.path.join(LOCAL_MODEL_DIR, "best_model.pth")
    if best_model_temp_path and os.path.exists(best_model_temp_path):
        shutil.copy(best_model_temp_path, best_model_path)
        logger.info(f"Copied best epoch file to BEST_MODEL {best_model_temp_path} => {best_model_path}")
    else:
        # final fallback: save current model dict as best
        torch.save(model.state_dict(), best_model_path)
        logger.info(f"No epoch-model file found to copy; saved current model as BEST_MODEL => {best_model_path}")

    try:
        s3.upload_file(best_model_path, BUCKET, f"{TRAINED_MODEL_PREFIX}/best_model.pth")
        logger.info(f"Uploaded BEST MODEL => s3://{BUCKET}/{TRAINED_MODEL_PREFIX}/best_model.pth")
    except Exception as e:
        logger.error(f"Failed to upload best model to S3: {e}")
    
    logger.info(f"Training complete! Best Val Acc: {best_acc:.2f}%")

    generate_all_graphs(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        train_acc=train_acc_list,
        val_acc=val_acc_list,
        train_loss=train_loss_list,
        val_loss=val_loss_list,
        classes=train_data.classes,
        epoch=TOTAL_EPOCHS,
        device=device,
        upload_to_s3=True,
        s3=s3,
        BUCKET=BUCKET
    )

if __name__ == "__main__":
    train_model()