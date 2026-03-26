import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true }
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    description: { type: String, required: true },

    price: { type: Number, required: true },

    discount: { type: Number, required: true },

    image: {
      type: imageSchema, // ONE image per document
      required: true
    },
    
    availableSizes: {
      type: [String],
      default: ["Free Size", "XS", "S", "M", "L", "XL"],
      required: true
    },

    availableColors: {
      type: [String],
      default: ["Black", "White", "Navy", "Beige"],
      required: true
    },

    gender: { type: String, enum: ["Girls", "Boys", "Men", "Women", "Unisex"], required: true },

    styleMatchRatingAvg: {
      type: Number,
      default: 0,
      min: 0,
    },

    qualityRatingAvg: {
      type: Number,
      default: 0,
      min: 0,
    },

    overallRatingAvg: {
      type: Number,
      default: 0,
      min: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

productSchema.index({ name: 1, "image.filename": 1 }, { unique: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
