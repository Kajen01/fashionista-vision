import os
import datetime
import boto3

# --------------------------------------------------------
# Load the correct configuration (Prototype/Main)
# --------------------------------------------------------
from config import *

# --------------------------------------------------------
# Import Pipeline Stage Functions
# --------------------------------------------------------
from download_dataset import download_dataset
from split_dataset import split_dataset
from upload_split_to_s3 import upload_folder_to_s3
from train_model import train_model

# --------------------------------------------------------
# Logger
# --------------------------------------------------------
from logger import setup_logger
logger = setup_logger()

# --------------------------------------------------------
# Helper
# --------------------------------------------------------
def str_to_bool(value):
    return value.lower() in ("true", "1", "yes")

# --------------------------------------------------------
# Stage Toggles (via ENV variables)
# --------------------------------------------------------
DOWNLOAD = str_to_bool(os.getenv("DOWNLOAD_DATASET", "true"))
SPLIT = str_to_bool(os.getenv("SPLIT_DATASET", "true"))
UPLOAD = str_to_bool(os.getenv("UPLOAD_SPLIT", "true"))
TRAIN = str_to_bool(os.getenv("TRAIN_MODEL", "true"))

ENV = os.getenv("PIPELINE_ENV", "prototype")

logger.info(
    f"Pipeline Mode => {ENV.upper()} | "
    f"DOWNLOAD={DOWNLOAD}, SPLIT={SPLIT}, UPLOAD={UPLOAD}, TRAIN={TRAIN}"
)

# --------------------------------------------------------
# Execute Stages
# --------------------------------------------------------
if DOWNLOAD:
    logger.info("Starting dataset download.")
    download_dataset()

if SPLIT:
    logger.info("Starting dataset split.")
    split_dataset()

if UPLOAD:
    logger.info("Uploading split dataset to S3.")
    upload_folder_to_s3(LOCAL_SPLITTED_DIR, BUCKET, SPLITTED_PREFIX)

if TRAIN:
    logger.info("Starting model training.")
    train_model()

# --------------------------------------------------------
# Upload the log file to S3
# --------------------------------------------------------
s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=REGION_NAME
)

file_path = LOG_FILE
s3_key = f"{PIPELINE_LOGS_PREFIX}/{os.path.basename(LOG_FILE)}"
s3.upload_file(file_path, BUCKET, s3_key)
logger.info(f"Uploaded to S3 => s3://{BUCKET}/{s3_key}")

logger.info("All selected pipeline stages complete. Execution finished.")
