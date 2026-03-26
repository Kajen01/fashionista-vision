import FeatureRating from "../models/featureRatingModel.js";
import { buildFeatureRatingSummary } from "../utils/ratingUtils.js";

const TARGET_TYPES = ["model", "digital_mirror"];

function normalizeComment(comment = "") {
  return String(comment || "").trim();
}

function parseRating(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    const error = new Error("Rating must be an integer between 1 and 5.");
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function normalizeTargetType(targetType = "") {
  return String(targetType || "").trim().toLowerCase();
}

function validateTargetType(targetType) {
  const normalized = normalizeTargetType(targetType);

  if (!TARGET_TYPES.includes(normalized)) {
    const error = new Error("Target type must be either model or digital_mirror.");
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function mapFeatureRating(rating) {
  return {
    _id: rating._id,
    id: rating._id,
    targetType: rating.targetType,
    rating: rating.rating,
    comment: rating.comment || "",
    createdAt: rating.createdAt,
    updatedAt: rating.updatedAt,
  };
}

async function getSummaryForTarget(targetType) {
  const ratings = await FeatureRating.find({ targetType });
  return buildFeatureRatingSummary(ratings);
}

export const getFeatureRatingSummary = async (req, res) => {
  try {
    const targetType = validateTargetType(req.params.targetType);
    const summary = await getSummaryForTarget(targetType);

    res.json({
      targetType,
      ...summary,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const upsertFeatureRating = async (req, res) => {
  try {
    const targetType = validateTargetType(req.params.targetType);
    const ratingValue = parseRating(req.body.rating);
    const comment = normalizeComment(req.body.comment);

    let featureRating = await FeatureRating.findOne({
      targetType,
      user: req.user._id,
    });

    const isUpdate = Boolean(featureRating);

    if (featureRating) {
      featureRating.rating = ratingValue;
      featureRating.comment = comment;
      await featureRating.save();
    } else {
      featureRating = await FeatureRating.create({
        targetType,
        user: req.user._id,
        rating: ratingValue,
        comment,
      });
    }

    const summary = await getSummaryForTarget(targetType);

    res.status(isUpdate ? 200 : 201).json({
      message: isUpdate ? "Feature rating updated successfully." : "Feature rating submitted successfully.",
      targetType,
      summary,
      rating: mapFeatureRating(featureRating),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getMyFeatureRatings = async (req, res) => {
  try {
    const [ratings, modelSummary, digitalMirrorSummary] = await Promise.all([
      FeatureRating.find({ user: req.user._id }),
      getSummaryForTarget("model"),
      getSummaryForTarget("digital_mirror"),
    ]);

    const byTarget = ratings.reduce((accumulator, rating) => {
      accumulator[rating.targetType] = mapFeatureRating(rating);
      return accumulator;
    }, {});

    res.json({
      model: {
        summary: {
          targetType: "model",
          ...modelSummary,
        },
        myRating: byTarget.model || null,
      },
      digitalMirror: {
        summary: {
          targetType: "digital_mirror",
          ...digitalMirrorSummary,
        },
        myRating: byTarget.digital_mirror || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
