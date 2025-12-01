# data_prep.py
import os
import csv
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
from tqdm import tqdm
from config import LOCAL_DATASET_DIR, LOCAL_TRAIN_DIR, LOCAL_VAL_DIR
from logger import setup_logger

logger = setup_logger()

RAW_IMAGES_DIR = os.path.join(LOCAL_DATASET_DIR, "images")
STYLES_CSV = os.path.join(LOCAL_DATASET_DIR, "styles.csv")

DEFAULT_FIELDNAMES = ['image_path', 'gender', 'articleType', 'baseColour']

def save_csv(rows, path, fieldnames=DEFAULT_FIELDNAMES):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

def _process_row_dict(row, input_folder):
    img_id = row.get("id") or row.get("image_id") or row.get("image")
    if img_id is None:
        return None
    img_name = os.path.join(input_folder, str(img_id) + ".jpg")
    if not os.path.exists(img_name):
        return None
    try:
        with Image.open(img_name) as img:
            # example filter: ensure it's an RGB image and not tiny
            if img.mode != "RGB":
                img = img.convert("RGB")
            # optional resize check: ensure large enough
            if img.size[0] < 20 or img.size[1] < 20:
                return None
    except Exception:
        return None

    return {
        "image_path": img_name,
        "gender": row.get("gender", ""),
        "articleType": row.get("articleType", ""),
        "baseColour": row.get("baseColour", "")
    }

def split_dataset(annotation_csv=STYLES_CSV, input_folder=RAW_IMAGES_DIR,
               train_csv=LOCAL_TRAIN_DIR, val_csv=LOCAL_VAL_DIR,
               sample_limit=40000, train_size=32000, n_threads=8, seed=42):
    """
    Reads styles.csv, filters valid images, samples up to sample_limit, then writes train.csv and val.csv.
    Each CSV contains columns: image_path, gender, articleType, baseColour
    """
    logger.info("Starting split_data")
    rows = []
    with open(annotation_csv) as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)

    results = []
    with ThreadPoolExecutor(max_workers=n_threads) as ex:
        futures = [ex.submit(_process_row_dict, r, input_folder) for r in rows]
        for fut in tqdm(futures, desc="Processing rows"):
            res = fut.result()
            if res:
                results.append(res)

    logger.info(f"Valid images found: {len(results)}")
    if len(results) == 0:
        raise RuntimeError("No valid images found after processing. Check paths and image format.")

    rng = np.random.RandomState(seed)
    take = min(sample_limit, len(results))
    indices = rng.choice(len(results), take, replace=False)
    chosen = [results[i] for i in indices]

    train = chosen[:min(train_size, len(chosen))]
    val = chosen[len(train):min(train_size + (sample_limit - train_size), len(chosen))]

    save_csv(train, train_csv)
    save_csv(val, val_csv)
    logger.info(f"Saved train: {len(train)} -> {train_csv}")
    logger.info(f"Saved val: {len(val)} -> {val_csv}")
    return train_csv, val_csv
