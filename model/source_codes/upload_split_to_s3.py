import os
import boto3
from tqdm import tqdm
from pipeline_config import BUCKET, LOCAL_SPLITTED_DIR, SPLITTED_PREFIX, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION_NAME
from logger import setup_logger

logger = setup_logger()

# s3 = boto3.client("s3")
s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=REGION_NAME
)

def upload_folder_to_s3(local_dir, bucket, prefix):
    logger.info(f"Uploading from {local_dir} to s3://{bucket}/{prefix}/ ...")

    for root, _, files in os.walk(local_dir):
        for file in tqdm(files, desc="Uploading"):
            local_path = os.path.join(root, file)
            relative_path = os.path.relpath(local_path, local_dir)
            s3_key = os.path.join(prefix, relative_path).replace("\\", "/")
            s3.upload_file(local_path, bucket, s3_key)

    logger.info(f"Upload complete at s3://{bucket}/{prefix}/")

if __name__ == "__main__":
    upload_folder_to_s3(LOCAL_SPLITTED_DIR, BUCKET, SPLITTED_PREFIX)
