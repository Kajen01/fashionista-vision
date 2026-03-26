import mongoose from "mongoose";
import Product from "../models/productModel.js";
import ProductReview from "../models/productReviewModel.js";
import {
  buildProductRatingSummary,
  calculateOverallRating,
} from "../utils/ratingUtils.js";

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function normalizeComment(comment = "") {
  return String(comment || "").trim();
}

function parseRating(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    const error = new Error(`${fieldName} must be an integer between 1 and 5.`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function mapReview(review) {
  return {
    _id: review._id,
    id: review._id,
    user: review.user?._id
      ? {
          _id: review.user._id,
          id: review.user._id,
          name: review.user.name,
          email: review.user.email,
        }
      : review.user,
    product: review.product?._id
      ? {
          _id: review.product._id,
          id: review.product._id,
          name: review.product.name,
          image: review.product.image,
          styleMatchRatingAvg: review.product.styleMatchRatingAvg,
          qualityRatingAvg: review.product.qualityRatingAvg,
          overallRatingAvg: review.product.overallRatingAvg,
          reviewCount: review.product.reviewCount,
        }
      : review.product,
    styleMatchRating: review.styleMatchRating,
    qualityRating: review.qualityRating,
    overallRating: calculateOverallRating(review.styleMatchRating, review.qualityRating),
    comment: review.comment || "",
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

async function loadProductOrThrow(productId) {
  if (!isValidObjectId(productId)) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  return product;
}

async function recalculateProductRating(productId) {
  const reviews = await ProductReview.find({ product: productId });
  const reviewCount = reviews.length;

  let styleMatchRatingAvg = 0;
  let qualityRatingAvg = 0;
  let overallRatingAvg = 0;

  if (reviewCount > 0) {
    const totalStyleMatch = reviews.reduce((sum, review) => sum + review.styleMatchRating, 0);
    const totalQuality = reviews.reduce((sum, review) => sum + review.qualityRating, 0);

    styleMatchRatingAvg = Number((totalStyleMatch / reviewCount).toFixed(2));
    qualityRatingAvg = Number((totalQuality / reviewCount).toFixed(2));
    overallRatingAvg = calculateOverallRating(styleMatchRatingAvg, qualityRatingAvg);
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      styleMatchRatingAvg,
      qualityRatingAvg,
      overallRatingAvg,
      reviewCount,
    },
    { new: true }
  );

  return buildProductRatingSummary(updatedProduct || {
    styleMatchRatingAvg,
    qualityRatingAvg,
    overallRatingAvg,
    reviewCount,
  });
}

export const getProductReviews = async (req, res) => {
  try {
    await loadProductOrThrow(req.params.productId);

    const reviews = await ProductReview.find({ product: req.params.productId })
      .populate("user", "name email")
      .sort({ updatedAt: -1 });

    res.json({
      reviews: reviews.map(mapReview),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getProductReviewSummary = async (req, res) => {
  try {
    const product = await loadProductOrThrow(req.params.productId);
    res.json(buildProductRatingSummary(product));
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getMyProductReview = async (req, res) => {
  try {
    await loadProductOrThrow(req.params.productId);

    const review = await ProductReview.findOne({
      product: req.params.productId,
      user: req.user._id,
    }).populate("user", "name email");

    res.json({
      review: review ? mapReview(review) : null,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const upsertProductReview = async (req, res) => {
  try {
    const product = await loadProductOrThrow(req.params.productId);
    const styleMatchRating = parseRating(req.body.styleMatchRating, "Style match rating");
    const qualityRating = parseRating(req.body.qualityRating, "Quality rating");
    const comment = normalizeComment(req.body.comment);

    let review = await ProductReview.findOne({
      product: product._id,
      user: req.user._id,
    });

    const isUpdate = Boolean(review);

    if (review) {
      review.styleMatchRating = styleMatchRating;
      review.qualityRating = qualityRating;
      review.comment = comment;
    } else {
      review = await ProductReview.create({
        product: product._id,
        user: req.user._id,
        styleMatchRating,
        qualityRating,
        comment,
      });
    }

    if (!isUpdate) {
      review = await ProductReview.findById(review._id).populate("user", "name email");
    } else {
      await review.save();
      review = await ProductReview.findById(review._id).populate("user", "name email");
    }

    const summary = await recalculateProductRating(product._id);

    res.status(isUpdate ? 200 : 201).json({
      message: isUpdate ? "Review updated successfully." : "Review submitted successfully.",
      review: mapReview(review),
      summary,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getMyProductReviews = async (req, res) => {
  try {
    const reviews = await ProductReview.find({ user: req.user._id })
      .populate("product", "name image overallRatingAvg reviewCount styleMatchRatingAvg qualityRatingAvg")
      .sort({ updatedAt: -1 });

    res.json({
      reviews: reviews.map(mapReview),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
