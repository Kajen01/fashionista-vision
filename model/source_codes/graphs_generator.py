import os
import numpy as np
import torch
import torch.nn.functional as F
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import confusion_matrix, roc_curve, auc
from torchvision.utils import make_grid
from pipeline_config import *

# ================================================================
# Helper function for saving plots
# ================================================================
def save_plot(path):
    fig = plt.gcf()

    # Apply tight layout safely
    try:
        fig.tight_layout()
    except:
        pass

    # Base filename without extension
    base = os.path.splitext(path)[0]

    # Save PNG
    fig.savefig(base + ".png", dpi=300, bbox_inches="tight")

    # Save vector versions to avoid overlap and allow zoom
    # fig.savefig(base + ".pdf", bbox_inches="tight")   # Best for printing / viewing
    # fig.savefig(base + ".svg", bbox_inches="tight")   # Best for browser viewing

    plt.close(fig)


# ================================================================
# 1. Accuracy Graph
# ================================================================
def plot_accuracy(train_acc, val_acc, output_dir):
    plt.figure(figsize=(10, 6))
    plt.plot(train_acc, label="Train Accuracy")
    plt.plot(val_acc, label="Validation Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy (%)")
    plt.title("Training vs Validation Accuracy")
    plt.legend()
    plt.grid()
    save_plot(os.path.join(output_dir, "accuracy_curve.png"))


# ================================================================
# 2. Loss Graph
# ================================================================
def plot_loss(train_loss, val_loss, output_dir):
    plt.figure(figsize=(10, 6))
    plt.plot(train_loss, label="Train Loss")
    plt.plot(val_loss, label="Validation Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.title("Training vs Validation Loss")
    plt.legend()
    plt.grid()
    save_plot(os.path.join(output_dir, "loss_curve.png"))


# ================================================================
# Collect Predictions (shared for multiple graphs)
# ================================================================
def collect_predictions(model, dataloader, device):
    model.eval()
    all_labels = []
    all_preds = []
    all_probs = []

    with torch.no_grad():
        for imgs, labels in dataloader:
            imgs = imgs.to(device)

            outputs = model(imgs)
            probs = F.softmax(outputs, dim=1).cpu().numpy()
            preds = outputs.argmax(1).cpu().numpy()

            all_probs.extend(probs)
            all_preds.extend(preds)
            all_labels.extend(labels.numpy())

    return np.array(all_labels), np.array(all_preds), np.array(all_probs)


# ================================================================
# 3. Confusion Matrix
# ================================================================
def plot_confusion_matrix(all_labels, all_preds, classes, output_dir):
    cm = confusion_matrix(all_labels, all_preds)

    plt.figure(figsize=(12, 9))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=classes, yticklabels=classes
    )
    plt.title("Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    save_plot(os.path.join(output_dir, "confusion_matrix.png"))


# ================================================================
# 4. Per-Class Accuracy
# ================================================================
def plot_per_class_accuracy(all_labels, all_preds, classes, output_dir):
    num_classes = len(classes)
    correct = [0] * num_classes
    total = [0] * num_classes

    for label, pred in zip(all_labels, all_preds):
        total[label] += 1
        if label == pred:
            correct[label] += 1

    acc = [100 * (correct[i] / total[i] if total[i] > 0 else 0)
           for i in range(num_classes)]

    plt.figure(figsize=(10, 6))
    plt.bar(classes, acc)
    plt.xticks(rotation=45)
    plt.ylabel("Accuracy (%)")
    plt.title("Per-Class Accuracy")
    save_plot(os.path.join(output_dir, "per_class_accuracy.png"))


# ================================================================
# 5. ROC Curves (One-vs-Rest)
# ================================================================
def plot_roc_curves(all_labels, all_probs, classes, output_dir):
    num_classes = len(classes)
    labels_onehot = np.eye(num_classes)[all_labels]

    plt.figure(figsize=(10, 7))
    for i in range(num_classes):
        fpr, tpr, _ = roc_curve(labels_onehot[:, i], all_probs[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, label=f"{classes[i]} (AUC={roc_auc:.2f})")

    plt.plot([0, 1], [0, 1], "k--")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve (One-vs-Rest)")
    plt.legend(loc="center left", bbox_to_anchor=(1, 0.5))
    plt.grid()
    save_plot(os.path.join(output_dir, "roc_curves.png"))


# ================================================================
# 6. Misclassified Images (Gallery)
# ================================================================
def plot_wrong_predictions(model, dataloader, classes, device, output_dir, max_images=16):
    wrong_imgs = []
    wrong_labels = []
    wrong_preds = []

    model.eval()
    with torch.no_grad():
        for imgs, labels in dataloader:
            imgs = imgs.to(device)
            outputs = model(imgs)
            preds = outputs.argmax(1)

            for img, label, pred in zip(imgs, labels, preds):
                if len(wrong_imgs) >= max_images:
                    break
                if label != pred:
                    wrong_imgs.append(img.cpu())
                    wrong_labels.append(classes[label])
                    wrong_preds.append(classes[pred])
            if len(wrong_imgs) >= max_images:
                break

    if len(wrong_imgs) == 0:
        print("No misclassified images found.")
        return

    # Create grid
    grid = make_grid(wrong_imgs, nrow=4, normalize=True)
    grid_np = grid.permute(1, 2, 0).numpy()

    plt.figure(figsize=(12, 8))
    plt.imshow(grid_np)
    plt.axis("off")
    plt.title("Misclassified Images")
    save_plot(os.path.join(output_dir, "misclassified_images.png"))


# ================================================================
# MASTER FUNCTION — CALL THIS AFTER TRAINING IS DONE
# ================================================================
def generate_all_graphs(model, train_loader, val_loader,
                        train_acc, val_acc, train_loss, val_loss,
                        classes, epoch, device="cpu", upload_to_s3=True, s3=None, BUCKET=None):

    output_dir = LOCAL_GRAPH_DIR
    os.makedirs(output_dir, exist_ok=True)

    print("Generating all training graphs.")

    # --- Basic graphs ---
    plot_accuracy(train_acc, val_acc, output_dir)
    plot_loss(train_loss, val_loss, output_dir)

    # --- Get predictions ---
    all_labels, all_preds, all_probs = collect_predictions(model, val_loader, device)

    # --- Advanced graphs ---
    plot_confusion_matrix(all_labels, all_preds, classes, output_dir)
    plot_per_class_accuracy(all_labels, all_preds, classes, output_dir)
    plot_roc_curves(all_labels, all_probs, classes, output_dir)
    plot_wrong_predictions(model, val_loader, classes, device, output_dir)

    print("All graphs saved under:", output_dir)

    # ============================================================
    # S3 UPLOAD
    # ============================================================
    if upload_to_s3 and s3 is not None and BUCKET is not None:

        for file in os.listdir(output_dir):
            local_path = os.path.join(output_dir, file)
            s3_key = f"{TRAINED_GRAPH_PREFIX}/{file}"

            s3.upload_file(local_path, BUCKET, s3_key)
            print(f"Uploaded to S3 => s3://{BUCKET}/{s3_key}")

        print("All graphs uploaded to S3.")
