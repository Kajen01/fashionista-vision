#!/bin/bash

# -----------------------------
# Set environment variables
# -----------------------------
export DOWNLOAD_DATASET=false                                   ### true | false
export SPLIT_DATASET=false
export UPLOAD_SPLIT=false
export TRAIN_MODEL=true
export TRAIN_MODEL_TYPE=resnet50                                ### resnet50 || efficientnet_b3 || MultiHeadResNet50

# Ensure environment
export PIPELINE_ENV=dress_pattern_color_model                                   ### main || prototype || dress_pattern_color_model

# -----------------------------
# Prepare log file
# -----------------------------
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="full_pipelinelog_${PIPELINE_ENV}_${TIMESTAMP}.log"

mkdir -p full_pipeline_logs
LOG_PATH="full_pipeline_logs/$LOG_FILE"

# -----------------------------
# Run the pipeline
# -----------------------------
echo "Running pipeline in $PIPELINE_ENV mode..."
echo "Logging to: $LOG_PATH"

# nohup python3 source_codes/main.py > "$LOG_PATH" 2>&1 &
nohup python3 dress_pattern_color_model/source_codes/main.py > "$LOG_PATH" 2>&1 &