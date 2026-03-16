import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TRIALROOM_DIR = path.join(__dirname, '../uploads/trialroom');
const GARMENT_RAW_DIR = path.join(TRIALROOM_DIR, 'garments/raw');
const GARMENT_PROCESSED_DIR = path.join(TRIALROOM_DIR, 'garments/processed');
const RESULTS_DIR = path.join(TRIALROOM_DIR, 'results');
const GARMENTS_PATH = path.join(__dirname, '../data/garments.json');
const UPLOADED_GARMENTS_PATH = path.join(__dirname, '../data/uploadedGarments.json');
const FRONTEND_PUBLIC_DIR = path.join(__dirname, '../../frontend/public');

const ML_SERVICE_URL = 'http://127.0.0.1:8002';

const DEFAULT_DRESS_ANALYSIS = {
  garmentType: 'dress',
  sourceSize: { width: 640, height: 640 },
  cropBox: { x: 64, y: 42, width: 512, height: 556 },
  keypoints: {
    leftShoulder: { x: 0.16, y: 0.1, confidence: 0.95 },
    rightShoulder: { x: 0.84, y: 0.1, confidence: 0.95 },
    leftWaist: { x: 0.29, y: 0.42, confidence: 0.93 },
    rightWaist: { x: 0.71, y: 0.42, confidence: 0.93 },
    hemLeft: { x: 0.24, y: 0.96, confidence: 0.91 },
    hemRight: { x: 0.76, y: 0.96, confidence: 0.91 },
    hemCenter: { x: 0.5, y: 0.98, confidence: 0.91 },
  },
  skeletonSegments: [
    ['leftShoulder', 'rightShoulder'],
    ['leftShoulder', 'leftWaist'],
    ['rightShoulder', 'rightWaist'],
    ['leftWaist', 'hemLeft'],
    ['rightWaist', 'hemRight'],
    ['hemLeft', 'hemCenter'],
    ['hemCenter', 'hemRight'],
  ],
};

const DEFAULT_TOP_ANALYSIS = {
  garmentType: 'top',
  sourceSize: { width: 640, height: 640 },
  cropBox: { x: 70, y: 46, width: 500, height: 520 },
  keypoints: {
    leftShoulder: { x: 0.18, y: 0.1, confidence: 0.97 },
    rightShoulder: { x: 0.82, y: 0.1, confidence: 0.97 },
    leftWaist: { x: 0.31, y: 0.56, confidence: 0.94 },
    rightWaist: { x: 0.69, y: 0.56, confidence: 0.94 },
    hemLeft: { x: 0.28, y: 0.93, confidence: 0.92 },
    hemRight: { x: 0.72, y: 0.93, confidence: 0.92 },
    hemCenter: { x: 0.5, y: 0.95, confidence: 0.92 },
  },
  skeletonSegments: [
    ['leftShoulder', 'rightShoulder'],
    ['leftShoulder', 'leftWaist'],
    ['rightShoulder', 'rightWaist'],
    ['leftWaist', 'hemLeft'],
    ['rightWaist', 'hemRight'],
    ['hemLeft', 'hemCenter'],
    ['hemCenter', 'hemRight'],
  ],
};

function ensureDir(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function ensureJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
}

[TRIALROOM_DIR, GARMENT_RAW_DIR, GARMENT_PROCESSED_DIR, RESULTS_DIR].forEach(ensureDir);
ensureJsonFile(UPLOADED_GARMENTS_PATH);

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function createStorage(destinationDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      ensureDir(destinationDir);
      cb(null, destinationDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${sanitizeFileName(file.originalname)}`);
    },
  });
}

const upload = multer({ storage: createStorage(TRIALROOM_DIR) });
const garmentUpload = multer({ storage: createStorage(GARMENT_RAW_DIR) });

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDefaultAnalysis(garmentType = 'dress') {
  return deepClone(garmentType === 'top' ? DEFAULT_TOP_ANALYSIS : DEFAULT_DRESS_ANALYSIS);
}

function readJsonArray(filePath) {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(fileContents);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeJsonArray(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readCatalogGarments() {
  return readJsonArray(GARMENTS_PATH);
}

function readUploadedGarments() {
  return readJsonArray(UPLOADED_GARMENTS_PATH);
}

function normalizeGarmentRecord(record) {
  const hasAnalysis = Boolean(record.analysis?.keypoints);
  const source = record.source || 'catalog';
  const garmentType = record.analysis?.garmentType || record.garmentType || (record.fit === 'tight' ? 'top' : 'dress');
  const defaults = createDefaultAnalysis(garmentType);
  const previewUrl = record.previewUrl || record.thumbnail || record.pngUrl;
  const processedImageUrl = record.processedImageUrl || previewUrl;

  return {
    id: record.id,
    name: record.name,
    source,
    fit: record.fit || (garmentType === 'top' ? 'tight' : 'relaxed'),
    thumbnail: record.thumbnail || previewUrl,
    pngUrl: record.pngUrl || previewUrl,
    previewUrl,
    processedImageUrl,
    analysisStatus: record.analysisStatus || (hasAnalysis ? 'ml' : 'client-fallback'),
    analysisError: record.analysisError || null,
    analysis: hasAnalysis
      ? {
        ...defaults,
        ...record.analysis,
        garmentType,
        sourceSize: record.analysis?.sourceSize || defaults.sourceSize,
        cropBox: record.analysis?.cropBox || defaults.cropBox,
        keypoints: {
          ...defaults.keypoints,
          ...(record.analysis?.keypoints || {}),
        },
        skeletonSegments: record.analysis?.skeletonSegments || defaults.skeletonSegments,
      }
      : (source === 'upload' ? null : defaults),
  };
}

function readAllGarments() {
  return [
    ...readCatalogGarments().map(normalizeGarmentRecord),
    ...readUploadedGarments().map(normalizeGarmentRecord),
  ];
}

function buildUploadedGarmentRecord({ id, name, imageUrl, analysis, fit, analysisStatus = 'ml', analysisError = null }) {
  return {
    id,
    name,
    source: 'upload',
    fit,
    thumbnail: imageUrl,
    pngUrl: imageUrl,
    previewUrl: imageUrl,
    processedImageUrl: imageUrl,
    analysis,
    analysisStatus,
    analysisError,
    createdAt: new Date().toISOString(),
  };
}

function appendUploadedGarment(record) {
  const currentGarments = readUploadedGarments();
  currentGarments.unshift(record);
  writeJsonArray(UPLOADED_GARMENTS_PATH, currentGarments);
}

function formatGarmentName(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferFitFromFileName(fileName) {
  return /(shirt|tshirt|t-shirt|tee|top|blouse)/i.test(fileName) ? 'tight' : 'relaxed';
}

function resolveLocalAssetPath(assetUrl) {
  if (!assetUrl) {
    return null;
  }

  if (assetUrl.startsWith('/assets/')) {
    return path.join(FRONTEND_PUBLIC_DIR, assetUrl.replace(/^\//, ''));
  }

  if (assetUrl.startsWith('/uploads/')) {
    return path.join(__dirname, '..', assetUrl.replace(/^\/uploads\//, 'uploads/'));
  }

  return null;
}

async function analyzeGarmentFile(filePath, fileName, fileType) {
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: fileType || 'application/octet-stream' });

  formData.append('garment_image', blob, fileName);

  const response = await fetch(`${ML_SERVICE_URL}/garment/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ML Service Error: ${errorText}`);
  }

  const analysis = await response.json();

  if (!analysis?.cropped_image || !analysis?.keypoints) {
    throw new Error('Garment analysis response was incomplete.');
  }

  return analysis;
}

function persistProcessedGarmentImage(garmentId, base64Image) {
  const outputName = `${garmentId}.png`;
  const outputPath = path.join(GARMENT_PROCESSED_DIR, outputName);
  const cleanBase64 = base64Image.replace(/^data:image\/png;base64,/, '');

  fs.writeFileSync(outputPath, cleanBase64, 'base64');

  return `/uploads/trialroom/garments/processed/${outputName}`;
}

function findGarmentById(garmentId) {
  return readAllGarments().find((garment) => garment.id === garmentId);
}

router.get('/garments', (req, res) => {
  res.json(readAllGarments());
});

router.post('/garments/upload', garmentUpload.single('garment'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No garment uploaded' });
  }

  try {
    const garmentId = `upload-${Date.now()}`;
    const rawImageUrl = `/uploads/trialroom/garments/raw/${path.basename(req.file.path)}`;
    const fallbackFit = inferFitFromFileName(req.file.originalname);
    let garmentRecord;

    try {
      const analysis = await analyzeGarmentFile(req.file.path, req.file.originalname, req.file.mimetype);
      const processedImageUrl = persistProcessedGarmentImage(garmentId, analysis.cropped_image);
      const fit = analysis.garmentType === 'top' ? 'tight' : 'relaxed';

      garmentRecord = buildUploadedGarmentRecord({
        id: garmentId,
        name: formatGarmentName(req.file.originalname),
        imageUrl: processedImageUrl,
        fit,
        analysisStatus: 'ml',
        analysis: {
          garmentType: analysis.garmentType,
          sourceSize: analysis.sourceSize,
          cropBox: analysis.cropBox,
          keypoints: analysis.keypoints,
          skeletonSegments: analysis.skeletonSegments,
        },
      });
    } catch (analysisError) {
      console.warn('Garment upload falling back to client-side analysis:', analysisError.message);

      garmentRecord = buildUploadedGarmentRecord({
        id: garmentId,
        name: formatGarmentName(req.file.originalname),
        imageUrl: rawImageUrl,
        fit: fallbackFit,
        analysis: null,
        analysisStatus: 'client-fallback',
        analysisError: analysisError.message,
      });
    }

    appendUploadedGarment(garmentRecord);
    res.json(normalizeGarmentRecord(garmentRecord));
  } catch (error) {
    console.error('Garment upload analysis failed:', error);
    res.status(500).json({ message: error.message || 'Failed to analyze garment upload.' });
  }
});

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const imageUrl = `/uploads/trialroom/${req.file.filename}`;
  res.json({ imageId: req.file.filename, imageUrl });
});

router.post('/pose', async (req, res) => {
  const { imageId } = req.body;
  if (!imageId) {
    return res.status(400).json({ message: 'Missing imageId' });
  }

  try {
    const imagePath = path.join(TRIALROOM_DIR, imageId);
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
      return res.status(response.status).json({ message: `ML Service Error: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Backend Proxy Error (Pose):', error);
    res.status(500).json({ message: `Backend Proxy Error: ${error.message}` });
  }
});

router.post('/tryon', async (req, res) => {
  const { imageId, garmentId, params } = req.body;

  try {
    const imagePath = path.join(TRIALROOM_DIR, imageId);
    const garmentRecord = findGarmentById(garmentId);
    const garmentAssetUrl = garmentRecord?.processedImageUrl || garmentRecord?.previewUrl;
    const garmentPath = resolveLocalAssetPath(garmentAssetUrl);

    if (!fs.existsSync(imagePath) || !garmentPath || !fs.existsSync(garmentPath)) {
      return res.status(404).json({ message: 'Files not found' });
    }

    const formData = new FormData();
    formData.append('user_image', new Blob([fs.readFileSync(imagePath)], { type: 'image/png' }), imageId);
    formData.append('garment_image', new Blob([fs.readFileSync(garmentPath)], { type: 'image/png' }), path.basename(garmentPath));
    formData.append('params', typeof params === 'string' ? params : JSON.stringify(params));

    const response = await fetch(`${ML_SERVICE_URL}/tryon`, { method: 'POST', body: formData });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: `ML Service Error: ${errorText}` });
    }

    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ message: data.error });
    }

    const resultId = `result-${Date.now()}.png`;
    const base64Data = data.tryon_image.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(RESULTS_DIR, resultId), base64Data, 'base64');

    res.json({
      tryon_image: `/uploads/trialroom/results/${resultId}`,
      status: 'success',
    });
  } catch (error) {
    console.error('TryOn Exception:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/health', async (req, res) => {
  try {
    const mlResponse = await fetch(`${ML_SERVICE_URL}/health`).catch(() => null);
    const mlStatus = mlResponse && mlResponse.ok ? 'online' : 'offline';

    res.json({
      status: 'ok',
      backend: 'online',
      ml_service: mlStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
