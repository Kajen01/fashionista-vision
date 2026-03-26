import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyProductReview,
  getMyProductReviews,
  getProductReviews,
  getProductReviewSummary,
  upsertProductReview,
} from "../controllers/productReviewController.js";

const router = express.Router();

router.get("/me", protect, getMyProductReviews);
router.get("/product/:productId/summary", getProductReviewSummary);
router.get("/product/:productId", getProductReviews);
router.get("/product/:productId/me", protect, getMyProductReview);
router.post("/product/:productId", protect, upsertProductReview);

export default router;
