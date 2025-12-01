import os
import numpy as np
import torch
import torch.nn.functional as F
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import confusion_matrix, roc_curve, auc
from torchvision.utils import make_grid
from config import *

# ================================================================
# Helper function for saving plots
# ================================================================
def save_plot(path):
    fig = plt.gcf()
    try:
        fig.tight_layout()
    except:
        pass
    base = os.path.splitext(path)[0]
    fig.savefig(base + ".png", dpi=300, bbox_inches="tight")
    plt.close(fig)

# ================================================================
# Plot accuracy per head
# ================================================================
def plot_accuracy(train_acc_list, val_acc_list, heads, output_dir):
    plt.figure(figsize=(10,6))
    for head in heads:
        train_acc = [x[head] for x in train_acc_list]
        val_acc = [x[head] for x in val_acc_list]
        plt.plot(train_acc, label=f"{head} Train")
        plt.plot(val_acc, label=f"{head} Val")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy (%)")
    plt.title("Training vs Validation Accuracy per Head")
    plt.legend()
    plt.grid()
    save_plot(os.path.join(output_dir, "accuracy_per_head.png"))

# ================================================================
# Plot loss per head
# ================================================================
def plot_loss(train_loss_list, val_loss_list, heads, output_dir):
    plt.figure(figsize=(10,6))
    for i, head in enumerate(heads):
        plt.plot([x for x in train_loss_list], label=f"{head} Train")
        plt.plot([x for x in val_loss_list], label=f"{head} Val")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.title("Training vs Validation Loss per Head")
    plt.legend()
    plt.grid()
    save_plot(os.path.join(output_dir, "loss_per_head.png"))

# ================================================================
# Collect predictions
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
            batch_preds = []
            batch_probs = []

            for out in outputs:
                probs = F.softmax(out, dim=1).cpu().numpy()
                preds = out.argmax(1).cpu().numpy()
                batch_probs.append(probs)
                batch_preds.append(preds)

            all_probs.append(batch_probs)
            all_preds.append(batch_preds)
            all_labels.append(labels.numpy().T)

    # Concatenate
    all_labels = np.concatenate(all_labels, axis=1).T
    all_preds = np.concatenate(all_preds, axis=1).T
    all_probs = np.concatenate(all_probs, axis=1).T
    return all_labels, all_preds, all_probs

# ================================================================
# Plot confusion matrix per head
# ================================================================
def plot_confusion_matrix_per_head(all_labels, all_preds, classes_dict, output_dir):
    for i, head in enumerate(classes_dict):
        cm = confusion_matrix(all_labels[:,i], all_preds[:,i])
        plt.figure(figsize=(10,8))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                    xticklabels=classes_dict[head],
                    yticklabels=classes_dict[head])
        plt.title(f"Confusion Matrix: {head}")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        save_plot(os.path.join(output_dir, f"confusion_matrix_{head}.png"))

# ================================================================
# Plot ROC curves per head
# ================================================================
def plot_roc_curves_per_head(all_labels, all_probs, classes_dict, output_dir):
    for i, head in enumerate(classes_dict):
        num_classes = len(classes_dict[head])
        labels_onehot = np.eye(num_classes)[all_labels[:,i]]
        plt.figure(figsize=(10,7))
        for c in range(num_classes):
            fpr, tpr, _ = roc_curve(labels_onehot[:,c], all_probs[:,i][:,c])
            roc_auc = auc(fpr,tpr)
            plt.plot(fpr, tpr, label=f"{classes_dict[head][c]} (AUC={roc_auc:.2f})")
        plt.plot([0,1],[0,1],"k--")
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title(f"ROC Curve: {head}")
        plt.legend(loc="center left", bbox_to_anchor=(1,0.5))
        plt.grid()
        save_plot(os.path.join(output_dir, f"roc_{head}.png"))

# ================================================================
# Plot misclassified images (first head only for simplicity)
# ================================================================
def plot_wrong_predictions(model, dataloader, classes_dict, device, output_dir, max_images=16):
    wrong_imgs = []
    wrong_labels = []
    wrong_preds = []

    model.eval()
    with torch.no_grad():
        for imgs, labels in dataloader:
            imgs = imgs.to(device)
            outputs = model(imgs)
            preds = [o.argmax(1).cpu() for o in outputs]

            for idx in range(imgs.size(0)):
                if len(wrong_imgs) >= max_images:
                    break
                # check first head only for visualization
                if labels[idx,0] != preds[0][idx]:
                    wrong_imgs.append(imgs[idx].cpu())
                    wrong_labels.append(classes_dict[list(classes_dict.keys())[0]][labels[idx,0]])
                    wrong_preds.append(classes_dict[list(classes_dict.keys())[0]][preds[0][idx]])
            if len(wrong_imgs) >= max_images:
                break

    if not wrong_imgs:
        print("No misclassified images found.")
        return

    grid = make_grid(wrong_imgs, nrow=4, normalize=True)
    grid_np = grid.permute(1,2,0).numpy()
    plt.figure(figsize=(12,8))
    plt.imshow(grid_np)
    plt.axis("off")
    plt.title("Misclassified Images (Head: first)")
    save_plot(os.path.join(output_dir, "misclassified_images.png"))

# ================================================================
# Master function
# ================================================================
def generate_all_graphs(model, train_loader, val_loader,
                        train_acc, val_acc, train_loss, val_loss,
                        classes, epoch, device="cpu", upload_to_s3=True, s3=None, BUCKET=None):

    output_dir = LOCAL_GRAPH_DIR
    os.makedirs(output_dir, exist_ok=True)

    print("Generating all graphs...")

    heads = list(classes.keys())

    # Accuracy & Loss per head
    plot_accuracy(train_acc, val_acc, heads, output_dir)
    plot_loss(train_loss, val_loss, heads, output_dir)

    # Collect predictions
    all_labels, all_preds, all_probs = collect_predictions(model, val_loader, device)

    # Confusion, ROC
    plot_confusion_matrix_per_head(all_labels, all_preds, classes, output_dir)
    plot_roc_curves_per_head(all_labels, all_probs, classes, output_dir)
    plot_wrong_predictions(model, val_loader, classes, device, output_dir)

    print("All graphs saved under:", output_dir)

    # S3 upload
    if upload_to_s3 and s3 is not None and BUCKET is not None:
        for file in os.listdir(output_dir):
            local_path = os.path.join(output_dir, file)
            s3_key = f"{TRAINED_GRAPH_PREFIX}/{file}"
            s3.upload_file(local_path, BUCKET, s3_key)
            print(f"Uploaded to S3 => s3://{BUCKET}/{s3_key}")

        print("All graphs uploaded to S3.")
