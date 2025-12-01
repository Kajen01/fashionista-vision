& D:/dm-project-mid-review/.venv/Scripts/Activate.ps1

uvicorn inference_api:app --host 0.0.0.0 --port 8000 > logfile.log 2>&1



python predict_api.py
    > http://127.0.0.1:8000/docs#/default/predict_predict_post

python predict_dual_api.py
    > http://127.0.0.1:8000/docs#/default/predict_predict_dual_post
    > http://127.0.0.1:8000/redoc#operation/predict_predict_dual_post

python predict_multi_api.py
    > http://127.0.0.1:8000/docs#/default/predict_predict_multi_post