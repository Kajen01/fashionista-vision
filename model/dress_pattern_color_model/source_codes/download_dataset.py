import os
import boto3
from tqdm import tqdm
from config import BUCKET, DATASET_PREFIX, LOCAL_DATASET_DIR, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION_NAME
from logger import setup_logger

logger = setup_logger()

# s3 = boto3.client("s3")
s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=REGION_NAME
)

def download_dataset():
    logger.info(f"Downloading dataset from s3://{BUCKET}/{DATASET_PREFIX}")
    os.makedirs(LOCAL_DATASET_DIR, exist_ok=True)

    continuation_token = None
    total_downloaded = 0

    while True:
        if continuation_token:
            response = s3.list_objects_v2(
                Bucket=BUCKET,
                Prefix=DATASET_PREFIX,
                ContinuationToken=continuation_token
            )
        else:
            response = s3.list_objects_v2(
                Bucket=BUCKET,
                Prefix=DATASET_PREFIX
            )

        contents = response.get('Contents', [])
        if not contents:
            break

        for obj in tqdm(contents, desc="Downloading files from S3"):
            key = obj['Key']
            if key.endswith('/'):
                continue  # skip folders

            rel_path = os.path.relpath(key, DATASET_PREFIX)
            local_path = os.path.join(LOCAL_DATASET_DIR, rel_path)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)

            try:
                s3.download_file(BUCKET, key, local_path)
                total_downloaded += 1
            except Exception as e:
                logger.error(f"Failed to download {key}: {e}")

        # If there's more data, continue
        if response.get("IsTruncated"):
            continuation_token = response.get("NextContinuationToken")
        else:
            break

    logger.info(f"Dataset download complete! Total files downloaded: {total_downloaded}")

if __name__ == "__main__":
    download_dataset()
