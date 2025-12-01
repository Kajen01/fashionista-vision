import os
import datetime

# -----------------------------
# GLOBAL CONFIGURATION
# -----------------------------
TIMESTAMP = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
TRAIN_MODEL_TYPE = os.getenv("TRAIN_MODEL_TYPE", "efficientnet_b3")

# S3 SETTINGS
BUCKET = "data-management-dataset-2"
DATASET_PREFIX = "prototype-dataset/"
SPLITTED_PREFIX = f"prototype_dataset_splitted/prototype_dataset_splitted_{TIMESTAMP}"
TRAINED_MODEL_PREFIX = f"prototype_trained_models/{TRAIN_MODEL_TYPE}_{TIMESTAMP}"
TRAINED_GRAPH_PREFIX = f"prototype_training_graphs/prototype_training_graphs_{TIMESTAMP}"
PIPELINE_LOGS_PREFIX = "prototype_pipeline_logs"

# LOCAL PATHS
LOCAL_BASE_DIR = "/home/ec2-user/dm-project/prototype_model"
LOCAL_DATASET_DIR = f"{LOCAL_BASE_DIR}/prototype_dataset"
LOCAL_SPLITTED_DIR = f"{LOCAL_BASE_DIR}/prototype_dataset_splitted"
LOCAL_TRAIN_DIR = f"{LOCAL_SPLITTED_DIR}/train"
LOCAL_VAL_DIR = f"{LOCAL_SPLITTED_DIR}/val"
LOCAL_MODEL_DIR = f"{LOCAL_BASE_DIR}/prototype_trained_models/{TRAIN_MODEL_TYPE}_{TIMESTAMP}"
LOCAL_GRAPH_DIR = f"{LOCAL_BASE_DIR}/prototype_training_graphs/prototype_training_graphs_{TIMESTAMP}"

### Resume Run
# LOCAL_MODEL_DIR_OF_LAST_RUN = None
LOCAL_MODEL_DIR_OF_LAST_RUN = "/home/ec2-user/dm-project/prototype_model/prototype_trained_models/resnet50_20251119_132951"

# TRAINING PARAMETERS
EPOCHS = 16
BATCH_SIZE = 64
LEARNING_RATE = 5e-5
NUM_WORKERS = 8

# AWS
AWS_ACCESS_KEY_ID="AKIAR6EY2VWPSTSYT6U5"
AWS_SECRET_ACCESS_KEY="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"
REGION_NAME="eu-north-1"

LOG_DIR = os.path.join(LOCAL_BASE_DIR, "prototype_pipeline_logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, f"prototype_pipeline_{TIMESTAMP}.log")