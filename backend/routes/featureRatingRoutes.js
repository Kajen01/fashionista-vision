import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getFeatureRatingSummary,
  getMyFeatureRatings,
  upsertFeatureRating,
} from "../controllers/featureRatingController.js";

const router = express.Router();

router.get("/me", protect, getMyFeatureRatings);
router.get("/:targetType/summary", getFeatureRatingSummary);
router.post("/:targetType", protect, upsertFeatureRating);

export default router;
