import os
import shutil
import random
from tqdm import tqdm
from pipeline_config import LOCAL_DATASET_DIR, LOCAL_TRAIN_DIR, LOCAL_VAL_DIR
from logger import setup_logger

logger = setup_logger()

def split_dataset():
    logger.info("Splitting dataset.")
    os.makedirs(LOCAL_TRAIN_DIR, exist_ok=True)
    os.makedirs(LOCAL_VAL_DIR, exist_ok=True)

    for cls in tqdm(os.listdir(LOCAL_DATASET_DIR)):
        cls_path = os.path.join(LOCAL_DATASET_DIR, cls)
        if not os.path.isdir(cls_path):
            continue

        images = [f for f in os.listdir(cls_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if not images:
            continue

        random.shuffle(images)
        split_idx = int(len(images) * 0.9)
        train_imgs, val_imgs = images[:split_idx], images[split_idx:]

        os.makedirs(os.path.join(LOCAL_TRAIN_DIR, cls), exist_ok=True)
        os.makedirs(os.path.join(LOCAL_VAL_DIR, cls), exist_ok=True)

        for img in train_imgs:
            shutil.copy2(os.path.join(cls_path, img), os.path.join(LOCAL_TRAIN_DIR, cls, img))
        for img in val_imgs:
            shutil.copy2(os.path.join(cls_path, img), os.path.join(LOCAL_VAL_DIR, cls, img))

    logger.info("Dataset split complete!")

if __name__ == "__main__":
    split_dataset()
