import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/trialroom');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// ML Service URL (Python FastAPI) - Changed to 8002 to avoid conflicts
const ML_SERVICE_URL = 'http://127.0.0.1:8002';

// GET /api/garments - Return garment catalog
router.get('/garments', (req, res) => {
    try {
        const garmentsPath = path.join(__dirname, '../data/garments.json');
        const garmentsData = fs.readFileSync(garmentsPath, 'utf8');
        res.json(JSON.parse(garmentsData));
    } catch (error) {
        // Fallback if file doesn't exist
        res.json([
            { id: 'dress1', name: 'Floral Maxi Dress', thumbnail: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&h=200&fit=crop', pngUrl: '/assets/garments/dress1.png' },
            { id: 'dress2', name: 'Summer Sundress', thumbnail: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200&h=200&fit=crop', pngUrl: '/assets/garments/dress2.png' },
        ]);
    }
});

// POST /api/upload - Handle user photo upload
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = `/uploads/trialroom/${req.file.filename}`;
    res.json({ imageId: req.file.filename, imageUrl });
});

// POST /api/pose - Get skeleton from ML service
router.post('/pose', async (req, res) => {
    const { imageId } = req.body;
    if (!imageId) return res.status(400).json({ message: 'Missing imageId' });

    try {
        const imagePath = path.join(__dirname, `../uploads/trialroom/${imageId}`);
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(imagePath);
        const blob = new Blob([fileBuffer], { type: 'image/png' });
        formData.append('file', blob, imageId);

        const response = await fetch(`${ML_SERVICE_URL}/pose`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ML Service Error (Pose) Response:', response.status, errorText);
            return res.status(response.status).json({ message: `ML Service Error: ${errorText}` });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Backend Proxy Error (Pose):', error);
        res.status(500).json({ message: `Backend Proxy Error: ${error.message}` });
    }
});

// POST /api/tryon - Get final try-on result from ML service
router.post('/tryon', async (req, res) => {
    const { imageId, garmentId, params } = req.body;

    try {
        const imagePath = path.join(__dirname, `../uploads/trialroom/${imageId}`);
        const garmentPath = path.join(__dirname, `../../assets/garments/${garmentId}.png`);

        if (!fs.existsSync(imagePath) || !fs.existsSync(garmentPath)) {
            return res.status(404).json({ message: 'Files not found' });
        }

        const formData = new FormData();
        formData.append('user_image', new Blob([fs.readFileSync(imagePath)], { type: 'image/png' }), imageId);
        formData.append('garment_image', new Blob([fs.readFileSync(garmentPath)], { type: 'image/png' }), `${garmentId}.png`);
        formData.append('params', typeof params === 'string' ? params : JSON.stringify(params));

        const response = await fetch(`${ML_SERVICE_URL}/tryon`, { method: 'POST', body: formData });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ message: `ML Service Error: ${errorText}` });
        }

        const data = await response.json();
        if (data.error) return res.status(400).json({ message: data.error });

        // Save result image to disk
        const resultId = `result-${Date.now()}.png`;
        const resultsDir = path.join(__dirname, '../uploads/trialroom/results');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        const base64Data = data.tryon_image.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(path.join(resultsDir, resultId), base64Data, 'base64');

        res.json({
            tryon_image: `/uploads/trialroom/results/${resultId}`,
            status: 'success'
        });
    } catch (error) {
        console.error('TryOn Exception:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/health - Check health of backend and ML service
router.get('/health', async (req, res) => {
    try {
        const mlResponse = await fetch(`${ML_SERVICE_URL}/health`).catch(() => null);
        const mlStatus = mlResponse && mlResponse.ok ? 'online' : 'offline';

        res.json({
            status: 'ok',
            backend: 'online',
            ml_service: mlStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default router;
