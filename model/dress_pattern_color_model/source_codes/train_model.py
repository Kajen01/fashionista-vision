import os
import csv
import shutil
import html
import boto3
from tqdm import tqdm
from datetime import datetime

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image

from config import *
from logger import setup_logger
from graphs_generator import generate_all_graphs

logger = setup_logger()

# Initialize S3 client
s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=REGION_NAME
)

# ---------------------------
# Utilities
# ---------------------------
def safe_open_image(path):
    try:
        with Image.open(path) as img:
            if img.mode != "RGB":
                img = img.convert("RGB")
            return img.copy()
    except Exception as e:
        logger.warning(f"Failed to open image {path}: {e}")
        return None

def rewrite_path_for_modal(img_path):
    # ORIGINAL path in CSV: /home/ec2-user/.../dataset/images/123.jpg
    # NEW modal mounted path: /root/modal/data/images/123.jpg
    img_name = os.path.basename(img_path)
    return f"/mnt/vol/dataset/images/{img_name}"

def read_csv_labels(csv_path, image_key="image_path", label_keys=None):
    if label_keys is None:
        label_keys = ["gender", "articleType", "baseColour"]

    rows = []
    with open(csv_path, newline='') as f:
        reader = csv.DictReader(f)
        # check headers
        for key in [image_key]+label_keys:
            if key not in reader.fieldnames:
                raise ValueError(f"CSV {csv_path} missing header: {key}")

        for row in reader:
            img = row[image_key].strip()
            labels = [row[k].strip() for k in label_keys]
            if img:
                img = rewrite_path_for_modal(img)   # <-- ADD THIS
                rows.append((img, labels))
    return rows

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

# ---------------------------
# Dataset
# ---------------------------
class CSVDataset(Dataset):
    def __init__(self, rows, label_to_idx_dict, transform=None):
        self.rows = rows
        self.label_to_idx_dict = label_to_idx_dict
        self.transform = transform
        self.num_heads = len(label_to_idx_dict)

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, idx):
        img_path, label_list = self.rows[idx]
        img = safe_open_image(img_path)
        if img is None:
            img = Image.new("RGB", (224, 224), (0, 0, 0))
            logger.warning(f"Using dummy image for {img_path}")

        if self.transform:
            img = self.transform(img)

        labels_idx = [self.label_to_idx_dict[h].get(lbl, 0) for h, lbl in zip(self.label_to_idx_dict.keys(), label_list)]
        return img, torch.tensor(labels_idx, dtype=torch.long)

# ---------------------------
# Clean CSV folders
# ---------------------------
def clean_dataset_folders_from_csv(rows, valid_exts=None):
    if valid_exts is None:
        valid_exts = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp')

    checked_dirs = set()
    for img_path, _ in rows:
        parent = os.path.dirname(img_path)
        if parent and parent not in checked_dirs:
            checked_dirs.add(parent)
            parts = parent.split(os.sep)
            new_parts = [html.unescape(p) for p in parts]
            if new_parts != parts:
                new_parent = os.sep.join(new_parts)
                try:
                    os.makedirs(os.path.dirname(new_parent), exist_ok=True)
                    if os.path.exists(parent) and not os.path.exists(new_parent):
                        os.rename(parent, new_parent)
                        logger.info(f"Renamed folder: {parent} -> {new_parent}")
                except Exception as e:
                    logger.warning(f"Failed rename {parent} -> {new_parent}: {e}")

    # check files existence
    missing = 0
    for img_path, _ in rows:
        if not os.path.exists(img_path) or not img_path.lower().endswith(valid_exts):
            missing += 1
    if missing:
        logger.warning(f"{missing} referenced files missing or wrong extension in CSV.")

# ---------------------------
# Multi-head Model
# ---------------------------
class MultiHeadResNet50(nn.Module):
    def __init__(self, num_classes_dict):
        super().__init__()
        self.base_model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
        in_features = self.base_model.fc.in_features
        self.base_model.fc = nn.Identity()  # remove original fc

        # heads
        self.heads = nn.ModuleDict({h: nn.Linear(in_features, n) for h, n in num_classes_dict.items()})

    def forward(self, x):
        features = self.base_model(x)
        out = [self.heads[h](features) for h in self.heads]
        return out

# ---------------------------
# Training function
# ---------------------------
def train_model(
    train_csv=LOCAL_TRAIN_DIR,
    val_csv=LOCAL_VAL_DIR,
    model_save_dir=LOCAL_MODEL_DIR,
    resume_from_dir=None,
    bucket=BUCKET,
    s3_prefix=TRAINED_MODEL_PREFIX,
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    num_workers=NUM_WORKERS,
    lr=LEARNING_RATE,
    device=None
):
    logger.info("Starting multi-head CSV training.")

    device = device or (torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu"))
    logger.info(f"Using device: {device}")

    # --- Read CSVs ---
    train_rows = read_csv_labels(train_csv)
    val_rows = read_csv_labels(val_csv)
    if len(train_rows) == 0:
        raise RuntimeError("Train CSV empty")
    clean_dataset_folders_from_csv(train_rows + val_rows)

    # --- Build label mapping ---
    heads = ["gender", "articleType", "baseColour"]
    label_to_idx_dict = {}
    idx_to_label_dict = {}
    for i, head in enumerate(heads):
        labels = sorted(list({row[1][i] for row in train_rows}))
        label_to_idx_dict[head] = {lbl: idx for idx, lbl in enumerate(labels)}
        idx_to_label_dict[head] = {idx: lbl for lbl, idx in label_to_idx_dict[head].items()}

    # --- Datasets & loaders ---
    train_transform = transforms.Compose([
        transforms.Resize((224,224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(0.2,0.2,0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
    ])
    val_transform = transforms.Compose([
        transforms.Resize((224,224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
    ])

    train_dataset = CSVDataset(train_rows, label_to_idx_dict, transform=train_transform)
    val_dataset = CSVDataset(val_rows, label_to_idx_dict, transform=val_transform) if len(val_rows)>0 else None

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers) if val_dataset else None

    # --- Model, criterion, optimizer ---
    model = MultiHeadResNet50({h: len(label_to_idx_dict[h]) for h in heads}).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    ensure_dir(model_save_dir)
    use_resume_dir = resume_from_dir if resume_from_dir else model_save_dir
    last_checkpoint_path = os.path.join(use_resume_dir, "last_checkpoint.pth")
    best_model_path_local = os.path.join(model_save_dir, "best_model.pth")

    start_epoch = 0
    best_val_acc = -1.0
    train_acc_list = []
    val_acc_list = []
    train_loss_list = []
    val_loss_list = []

    # --- Resume ---
    if os.path.exists(last_checkpoint_path):
        ckpt = torch.load(last_checkpoint_path, map_location=device)
        model.load_state_dict(ckpt["model_state"])
        optimizer.load_state_dict(ckpt["optimizer_state"])
        start_epoch = ckpt.get("epoch",0)+1
        best_val_acc = ckpt.get("best_acc", best_val_acc)
        train_acc_list = ckpt.get("train_acc_list", train_acc_list)
        val_acc_list = ckpt.get("val_acc_list", val_acc_list)
        train_loss_list = ckpt.get("train_loss_list", train_loss_list)
        val_loss_list = ckpt.get("val_loss_list", val_loss_list)
        logger.info(f"Resuming from epoch {start_epoch}")

    # --- Training loop ---
    total_epochs = start_epoch + epochs
    for epoch in range(start_epoch, total_epochs):
        model.train()
        running_loss_per_head = {h: 0.0 for h in heads}
        correct_per_head = {h: 0 for h in heads}
        total_per_head = {h: 0 for h in heads}

        pbar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{total_epochs}", leave=False)
        for imgs, labels in pbar:
            imgs = imgs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(imgs)

            loss = 0.0
            for i, head in enumerate(heads):
                out = outputs[i]
                lbl = labels[:,i]
                head_loss = criterion(out, lbl)
                loss += head_loss

                _, preds = out.max(1)
                correct_per_head[head] += preds.eq(lbl).sum().item()
                total_per_head[head] += lbl.size(0)
                running_loss_per_head[head] += head_loss.item() * lbl.size(0)

            loss.backward()
            optimizer.step()

        # Epoch metrics
        epoch_train_loss = {h: running_loss_per_head[h]/total_per_head[h] if total_per_head[h]>0 else 0.0 for h in heads}
        epoch_train_acc = {h: 100.0*correct_per_head[h]/total_per_head[h] if total_per_head[h]>0 else 0.0 for h in heads}

        # Validation
        epoch_val_loss = {h: 0.0 for h in heads}
        epoch_val_acc = {h: 0.0 for h in heads}
        if val_loader:
            model.eval()
            val_running_loss_per_head = {h:0.0 for h in heads}
            val_correct_per_head = {h:0 for h in heads}
            val_total_per_head = {h:0 for h in heads}

            with torch.no_grad():
                for imgs, labels in val_loader:
                    imgs = imgs.to(device)
                    labels = labels.to(device)
                    outputs = model(imgs)
                    for i, head in enumerate(heads):
                        out = outputs[i]
                        lbl = labels[:,i]
                        head_loss = criterion(out,lbl)
                        val_running_loss_per_head[head] += head_loss.item() * lbl.size(0)
                        _, preds = out.max(1)
                        val_correct_per_head[head] += preds.eq(lbl).sum().item()
                        val_total_per_head[head] += lbl.size(0)

            epoch_val_loss = {h: val_running_loss_per_head[h]/val_total_per_head[h] if val_total_per_head[h]>0 else 0.0 for h in heads}
            epoch_val_acc = {h: 100.0*val_correct_per_head[h]/val_total_per_head[h] if val_total_per_head[h]>0 else 0.0 for h in heads}

        train_acc_list.append(epoch_train_acc)
        val_acc_list.append(epoch_val_acc)
        train_loss_list.append(sum(epoch_train_loss.values())/len(heads))
        val_loss_list.append(sum(epoch_val_loss.values())/len(heads))

        logger.info(
            f"Epoch {epoch+1}/{total_epochs}: " +
            " | ".join([f"{h} Train Acc={epoch_train_acc[h]:.2f}% Val Acc={epoch_val_acc[h]:.2f}%" for h in heads]) +
            f" | Total Loss: {train_loss_list[-1]:.4f}"
        )

        # Save last checkpoint
        last_ckpt = {
            "epoch": epoch,
            "model_state": model.state_dict(),
            "optimizer_state": optimizer.state_dict(),
            "best_acc": best_val_acc,
            "train_acc_list": train_acc_list,
            "val_acc_list": val_acc_list,
            "train_loss_list": train_loss_list,
            "val_loss_list": val_loss_list
        }
        torch.save(last_ckpt, last_checkpoint_path)

        if sum(epoch_val_acc.values())/len(heads) >= best_val_acc:
            best_val_acc = sum(epoch_val_acc.values())/len(heads)
            torch.save(model.state_dict(), best_model_path_local)

        # Upload checkpoint & best model to S3 (optional)
        try:
            s3.upload_file(last_checkpoint_path, bucket, f"{s3_prefix}/last_checkpoint_{epoch+1}.pth")
            s3.upload_file(best_model_path_local, bucket, f"{s3_prefix}/best_model_{epoch+1}.pth")
        except Exception as e:
            logger.warning(f"S3 upload failed: {e}")

    # --- Generate graphs ---
    try:
        classes_dict = {h: list(idx_to_label_dict[h].values()) for h in heads}
        generate_all_graphs(
            model=model,
            train_loader=train_loader,
            val_loader=val_loader,
            train_acc=train_acc_list,
            val_acc=val_acc_list,
            train_loss=train_loss_list,
            val_loss=val_loss_list,
            classes=classes_dict,
            epoch=total_epochs,
            device=device,
            upload_to_s3=True,
            s3=s3,
            BUCKET=bucket
        )
    except Exception as e:
        logger.warning(f"Graph generation failed: {e}")


# ---------------------------
# Run as script
# ---------------------------
if __name__ == "__main__":
    required = ["LOCAL_TRAIN_DIR", "LOCAL_VAL_DIR", "LOCAL_MODEL_DIR", "BUCKET", "TRAINED_MODEL_PREFIX"]
    missing = [name for name in required if name not in globals()]
    if missing:
        logger.error(f"Missing required config vars: {missing}")
        raise SystemExit(1)

    train_model(
        train_csv=LOCAL_TRAIN_DIR,
        val_csv=LOCAL_VAL_DIR,
        model_save_dir=LOCAL_MODEL_DIR,
        resume_from_dir=LOCAL_MODEL_DIR_OF_LAST_RUN if "LOCAL_MODEL_DIR_OF_LAST_RUN" in globals() else None,
        bucket=BUCKET,
        s3_prefix=TRAINED_MODEL_PREFIX,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        num_workers=NUM_WORKERS,
        lr=LEARNING_RATE,
        device=None
    )
