import argparse, csv, os, warnings
from multiprocessing import Pool, cpu_count
from functools import partial

import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as transforms
from torch.utils.data import Dataset, DataLoader
from torch.utils.tensorboard import SummaryWriter
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, accuracy_score
import numpy as np
from PIL import Image
from tqdm import tqdm
import matplotlib.pyplot as plt

# -------------------------------
# ✅ LOCAL PATHS
# -------------------------------
STYLES_CSV = "./data/styles.csv"
TRAIN_CSV = "./data/train.csv"
VAL_CSV = "./data/val.csv"

mean = [0.485, 0.456, 0.406]
std = [0.229, 0.224, 0.225]

# ✅ Auto-detect CUDA or CPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# -------------------------------
# DATA PREPARATION
# -------------------------------
def save_csv(data, path, fieldnames=['image_path', 'gender', 'articleType', 'baseColour']):
    with open(path, 'w', newline='') as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for row in data:
            writer.writerow(dict(zip(fieldnames, row)))


def process_row(row, input_folder):
    img_id = row['id']
    gender = row['gender']
    articleType = row['articleType']
    baseColour = row['baseColour']
    img_name = os.path.join(input_folder, 'images', str(img_id) + '.jpg')

    if os.path.exists(img_name):
        try:
            with Image.open(img_name) as img:
                if img.size == (60, 80) and img.mode == "RGB":
                    return [img_name, gender, articleType, baseColour]
        except:
            return None
    return None


def split_data():
    input_folder = "./data"
    output_folder = "./data"
    annotation = os.path.join(input_folder, 'styles.csv')

    if os.path.exists(TRAIN_CSV) and os.path.exists(VAL_CSV):
        print("✅ train.csv and val.csv already exist, skipping processing.")
        return

    with open(annotation) as csv_file:
        reader = csv.DictReader(csv_file)
        rows = list(reader)

    process_func = partial(process_row, input_folder=input_folder)
    all_data = []

    with Pool(processes=cpu_count()) as pool:
        results = pool.imap_unordered(process_func, rows, chunksize=100)
        for result in tqdm(results, total=len(rows)):
            if result is not None:
                all_data.append(result)

    np.random.seed(42)
    all_data = np.asarray(all_data)
    sample_size = min(40000, len(all_data))
    inds = np.random.choice(sample_size, sample_size, replace=False)

    save_csv(all_data[inds][:32000], TRAIN_CSV)
    save_csv(all_data[inds][32000:40000], VAL_CSV)


# -------------------------------
# DATASET CLASSES
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

        self.color_name_to_id = {name: i for i, name in enumerate(self.color_labels)}
        self.gender_name_to_id = {name: i for i, name in enumerate(self.gender_labels)}
        self.article_name_to_id = {name: i for i, name in enumerate(self.article_labels)}

        self.color_id_to_name = {i: name for i, name in enumerate(self.color_labels)}
        self.gender_id_to_name = {i: name for i, name in enumerate(self.gender_labels)}
        self.article_id_to_name = {i: name for i, name in enumerate(self.article_labels)}


class FashionDataset(Dataset):
    def __init__(self, annotation_path, attributes, transform=None):
        super().__init__()
        self.transform = transform
        self.attr = attributes

        self.data, self.color_labels, self.gender_labels, self.article_labels = [], [], [], []

        with open(annotation_path) as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.data.append(row['image_path'])
                self.color_labels.append(self.attr.color_name_to_id[row['baseColour']])
                self.gender_labels.append(self.attr.gender_name_to_id[row['gender']])
                self.article_labels.append(self.attr.article_name_to_id[row['articleType']])

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        img_path = self.data[idx]
        img = Image.open(img_path)

        if self.transform:
            img = self.transform(img)

        return {
            'img': img,
            'labels': {
                'color_labels': self.color_labels[idx],
                'gender_labels': self.gender_labels[idx],
                'article_labels': self.article_labels[idx]
            }
        }


# -------------------------------
# MODEL
# -------------------------------
class MultiOutputModel(nn.Module):
    def __init__(self, n_color_classes, n_gender_classes, n_article_classes):
        super().__init__()
        resnet = models.resnet18(pretrained=True)
        self.base_model = nn.Sequential(*list(resnet.children())[:-2])
        last_channel = resnet.fc.in_features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))

        self.color = nn.Linear(last_channel, n_color_classes)
        self.gender = nn.Linear(last_channel, n_gender_classes)
        self.article = nn.Linear(last_channel, n_article_classes)

    def forward(self, x):
        x = self.base_model(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        return {
            'color': self.color(x),
            'gender': self.gender(x),
            'article': self.article(x)
        }

    def get_loss(self, net_output, ground_truth):
        color_loss = F.cross_entropy(net_output['color'], ground_truth['color_labels'])
        gender_loss = F.cross_entropy(net_output['gender'], ground_truth['gender_labels'])
        article_loss = F.cross_entropy(net_output['article'], ground_truth['article_labels'])
        loss = color_loss + gender_loss + article_loss
        return loss, {'color': color_loss, 'gender': gender_loss, 'article': article_loss}


# -------------------------------
# TRAINING AND VALIDATION
# -------------------------------
def calculate_metrics(output, target):
    _, predicted_color = output['color'].cpu().max(1)
    _, predicted_gender = output['gender'].cpu().max(1)
    _, predicted_article = output['article'].cpu().max(1)

    gt_color = target['color_labels'].cpu()
    gt_gender = target['gender_labels'].cpu()
    gt_article = target['article_labels'].cpu()

    accuracy_color = accuracy_score(gt_color, predicted_color)
    accuracy_gender = accuracy_score(gt_gender, predicted_gender)
    accuracy_article = accuracy_score(gt_article, predicted_article)

    return accuracy_color, accuracy_gender, accuracy_article


def validate(model, dataloader, device):
    model.eval()
    avg_loss = 0
    acc_c, acc_g, acc_a = 0, 0, 0

    with torch.no_grad():
        for batch in dataloader:
            img = batch['img'].to(device)
            target_labels = {t: batch['labels'][t].to(device) for t in batch['labels']}
            output = model(img)
            val_loss, _ = model.get_loss(output, target_labels)
            avg_loss += val_loss.item()
            a_c, a_g, a_a = calculate_metrics(output, target_labels)
            acc_c += a_c
            acc_g += a_g
            acc_a += a_a

    avg_loss /= len(dataloader)
    acc_c /= len(dataloader)
    acc_g /= len(dataloader)
    acc_a /= len(dataloader)
    print(f"✅ Validation -> Loss: {avg_loss:.4f}, Color: {acc_c:.4f}, Gender: {acc_g:.4f}, Article: {acc_a:.4f}")


def train(N_epochs=5, batch_size=64, lr=1e-4):
    split_data()
    attributes = AttributesDataset(STYLES_CSV)

    train_transform = transforms.Compose([
        transforms.RandomHorizontalFlip(0.5),
        transforms.ColorJitter(0.3, 0.3, 0.3, 0),
        transforms.RandomAffine(20, translate=(0.1, 0.1), scale=(0.8, 1.2)),
        transforms.ToTensor(),
        transforms.Normalize(mean, std)
    ])
    val_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean, std)
    ])

    train_data = FashionDataset(TRAIN_CSV, attributes, train_transform)
    val_data = FashionDataset(VAL_CSV, attributes, val_transform)

    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_data, batch_size=batch_size, shuffle=False, num_workers=2)

    model = MultiOutputModel(attributes.num_colors, attributes.num_genders, attributes.num_articles).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    os.makedirs("checkpoints", exist_ok=True)

    for epoch in range(1, N_epochs + 1):
        model.train()
        total_loss = 0
        for batch in train_loader:
            img = batch['img'].to(device)
            labels = {t: batch['labels'][t].to(device) for t in batch['labels']}
            optimizer.zero_grad()
            output = model(img)
            loss, _ = model.get_loss(output, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        print(f"Epoch {epoch}/{N_epochs} - Train Loss: {total_loss / len(train_loader):.4f}")
        validate(model, val_loader, device)
        torch.save(model.state_dict(), f"checkpoints/checkpoint-{epoch:03d}.pth")

    print("🎉 Training complete! Models saved in 'checkpoints/' folder.")


if __name__ == "__main__":
    train(N_epochs=5, batch_size=64, lr=1e-4)
