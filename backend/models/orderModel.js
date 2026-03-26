import mongoose from "mongoose";

const orderItemImageSchema = new mongoose.Schema(
  {
    filename: { type: String, default: null },
    url: { type: String, default: null },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
      default: null,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    size: { type: String, default: null },
    color: { type: String, default: null },
    image: {
      type: orderItemImageSchema,
      default: () => ({
        filename: null,
        url: null,
      }),
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (value) => Array.isArray(value) && value.length > 0,
        "Order must contain at least one item",
      ],
    },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    paymentMethod: { type: String, default: "stripe" },
    paymentIntentId: { type: String, required: true, unique: true },
    paymentStatus: {
      type: String,
      enum: ["paid", "failed"],
      default: "paid",
    },
    orderStatus: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    trackingNumber: { type: String, default: null },
    placedAt: { type: Date, default: Date.now },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
