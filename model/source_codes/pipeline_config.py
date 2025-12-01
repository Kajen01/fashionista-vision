import os

ENV = os.getenv("PIPELINE_ENV", "prototype").lower()

if ENV == "prototype":
    from config.prototype_config import *
elif ENV == "main":
    from config.main_config import *
else:
    raise ValueError(f"Unknown PIPELINE_ENV: {ENV}")

print(f"[CONFIG] Loaded => {ENV.upper()}")
