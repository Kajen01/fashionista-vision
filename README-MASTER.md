# #################### #
#  FASHIONISTA-VISION  #
# #################### #

# GitGub Link,
    https://github.com/Kajen01/fashionista-vision

# AWS Link,
    >>> prof.kajen01@ Account
    >>> IAM: datamanagementproject
    >>> Region: eu-north-1

# Activate env
    Path,
        D:\dm-project-mid-review>
    Command,
        & D:/dm-project-mid-review/.venv/Scripts/Activate.ps1

# Frontend
    Path,
        D:\dm-project-mid-review\frontend>
    Command,
        npm start => react-scripts start
    UI URL link,
        http://localhost:3000/

# Backend
    1. Batch upload in mongoDB (mongodb_batch_upload.js),
        Setup,
            Update the main image folder (const IMAGE_BASE_PATH = "./uploads/mongodb_dataset";)
        Path,
            D:\dm-project-mid-review\backend>
        Command,
            node mongodb_batch_upload.js > mongodb_batch_upload_logs.log 2>&1

    2. Start Backend,
        Path,
            D:\dm-project-mid-review\backend>
        Command,
            npm run start => node server.js
            npm run dev => nodemon server.js
        Backend URL link,
            http://localhost:5000/api/products

# Run predict_multi_model API
    Setup,
        Update the path configurations of the "classes.txt" file, "styles.csv" file and Selected all 3 Model paths
    Path,
        D:\dm-project-mid-review>
    Command,
        python predict_multi_api.py
    API UI Test,
        http://127.0.0.1:8000/docs#/default/predict_predict_multi_post

# Model (Run in AWS EC2)
    1. Activate Conda Env,
        Path,
            D:\dm-project-mid-review\model>
        Command,
            conda activate dm-project-env

    2. Run pipeline (nohup),
        Setup,
            Update the pipeline configurations in the "pipeline_runner.sh" file and "xxx_config.py" files
        Path,
            D:\dm-project-mid-review\model>
        Command,
            chmod +x pipeline_runner.sh => Set the pipeline_runner.sh as executable
            ./pipeline_runner.sh => Start the pipeline process

    3. Kill PID,
        Path,
            D:\dm-project-mid-review\model>
        Command,
            ps aux | grep "python"
            kill 401024

    4. Run model_tester_x.ipynb,
            Setup,
                1. Select Conda Env: "dm-project-sample-env"
                2. Update the code blocks: "Load Class Labels", "Model Setup" and "Test Images Directory"
