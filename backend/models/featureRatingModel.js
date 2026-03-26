import mongoose from "mongoose";

const featureRatingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["model", "digital_mirror"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

featureRatingSchema.index({ user: 1, targetType: 1 }, { unique: true });

const FeatureRating = mongoose.model("FeatureRating", featureRatingSchema);
export default FeatureRating;
