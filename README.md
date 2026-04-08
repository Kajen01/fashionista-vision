# 👗 Fashionista-Vision

## AI-Powered Dress Pattern Prediction & Virtual Dressing Room

**Fashionista-Vision** is an AI-driven fashion e-commerce platform that enhances online shopping with **deep learning–based dress recognition**, **personalized outfit recommendations**, and a **digital mirror virtual dressing room**. Users can upload images to automatically identify **dress type, color, pattern, and gender**, get visually similar outfit suggestions, and purchase items securely through an intuitive workflow.

---

## 📌 Project Highlights

* 📸 Image-based fashion analysis using CNN models
* 🧠 Automatic recognition of dress type, pattern, color & gender
* 🛍️ Personalized outfit recommendations
* 🪞 Virtual dressing room with digital mirror experience
* 🧾 Secure cart, checkout, and payment workflow
* 🧑‍💼 Admin panel for product and order management

---

## 🧠 Core Technologies

### Frontend

* React.js, HTML5, CSS3, JavaScript
* Tailwind CSS / Bootstrap

### Backend

* Node.js, Express.js
* MongoDB

### Machine Learning

* PyTorch / TensorFlow
* CNN models: ResNet, VGG, EfficientNet
* OpenCV

### Virtual Try-On

* Three.js
* Blender

### Security & Payments

* JWT Authentication
* Stripe Payment Gateway

---

## 📂 Repository Structure

```
fashionista-vision/
├── frontend/             # React frontend
├── backend/              # Node.js + Express backend
├── model/                # ML training pipelines & scripts
├── ml_service/           # Model inference logic
├── model-extra-1/        # Additional trained models
├── model-extra-2/        # Additional trained models
├── test_images_folder/   # Sample test images
├── classes.txt           # Class labels
├── styles.csv            # Style metadata
├── predict_api.py        # Single-image prediction API
├── predict_dual_api.py   # Dual-image prediction API
├── predict_multi_api.py  # Multi-image prediction API
├── generate_garments.py  # Dataset utility script
└── README.md
```

---

## 🧩 System Architecture (High-Level)

1. User uploads an image via the frontend.
2. Backend forwards the image to the ML inference service.
3. CNN models extract features:

   * Dress type
   * Color
   * Pattern
   * Gender
4. Features are matched against the MongoDB product catalog.
5. Matching products are ranked by similarity and reviews.
6. Recommended outfits are returned to the frontend.
7. Users can:

   * View recommendations
   * Try on outfits using the digital mirror virtual dressing room
   * Add products to cart
   * Complete checkout securely

---

## ⚙️ Environment Setup

### 🔹 Python Virtual Environment

```powershell
& .venv/Scripts/Activate.ps1
```

### 🌐 Frontend

```bash
npm start
```

* Runs React development server at [http://localhost:3000/](http://localhost:3000/)

### 🖥️ Backend

**1️⃣ Batch Upload Products to MongoDB**

```bash
node mongodb_batch_upload.js > mongodb_batch_upload_logs.log 2>&1
```

> Update dataset path inside `mongodb_batch_upload.js`:

```javascript
const IMAGE_BASE_PATH = "./uploads/mongodb_dataset";
```

**2️⃣ Start Backend Server**

```bash
npm run start   # Production
npm run dev     # Development (nodemon)
```

* API endpoint: [http://localhost:5000/api/products](http://localhost:5000/api/products)

### 🤖 Machine Learning Inference APIs

```bash
python predict_multi_api.py
```

> Ensure `classes.txt`, `styles.csv`, and trained model paths are correctly configured.
> Swagger UI: [http://127.0.0.1:8000/docs#/default/predict_predict_multi_post](http://127.0.0.1:8000/docs#/default/predict_predict_multi_post)

### ☁️ Model Training (Cloud / EC2)

1️⃣ Activate Conda Environment:

```bash
conda activate dm-project-env
```

2️⃣ Run Training Pipeline (nohup):

```bash
chmod +x pipeline_runner.sh
./pipeline_runner.sh
```

> Update `pipeline_runner.sh` and corresponding `xxx_config.py` files before execution.

3️⃣ Stop Training Process:

```bash
ps aux | grep python
kill <PID>
```

4️⃣ Model Testing Notebook:

* File: `model_tester_x.ipynb`
* Setup: Select conda environment `dm-project-sample-env`, update class labels, model setup, and test image directory.

### 🧪 Datasets Used

* DeepFashion2 – large-scale fashion dataset
* Fashion-MNIST – baseline clothing categories

### 📜 License

Developed for academic and research purposes. All third-party libraries follow their respective licenses.

### 🙌 Acknowledgements

Inspired by advancements in computer vision, deep learning, and AI-driven fashion e-commerce systems.
