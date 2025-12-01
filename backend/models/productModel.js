import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true }
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    description: { type: String, required: true },

    price: { type: Number, required: true }, // e.g., 6500

    discount: { type: Number, required: true }, // 10–20%

    image: {
      type: imageSchema, // ONE image per document
      required: true
    },
    
    availableSizes: {
      type: [String],
      default: ["Free Size", "XS", "S", "M", "L", "XL"]
    },

    availableColors: {
      type: [String],
      default: ["Black", "White", "Navy", "Beige"]
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
