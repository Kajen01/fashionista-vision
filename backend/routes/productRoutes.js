import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadImages
} from "../controllers/productController.js";

const router = express.Router();

// Multer setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

const upload = multer({ storage, fileFilter });

// Product routes
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", protect, requireAdmin, upload.single("image"), createProduct);
router.put("/:id", protect, requireAdmin, upload.single("image"), updateProduct);
router.delete("/:id", protect, requireAdmin, deleteProduct);

// Upload images (multiple)
// router.post("/:id/images", protect, upload.array("images", 6), uploadImages);

export default router;
