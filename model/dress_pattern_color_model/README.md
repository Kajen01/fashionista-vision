pip install modal
modal setup

modal deploy modal_app.py.

modal run modal_app.train_on_modal

modal volume put dm_project_model_vol /home/ec2-user/dm-project/dataset

modal secret create dm_aws_creds AWS_ACCESS_KEY_ID=AKIAR6EY2VWPSTSYT6U5 AWS_SECRET_ACCESS_KEY=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 REGION_NAME=eu-north-1