import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import productReviewRoutes from "./routes/productReviewRoutes.js";
import featureRatingRoutes from "./routes/featureRatingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import trialRoomRoutes from "./routes/trialRoomRoutes.js";
import connectDB from "./config/db.js"

const app = express();
const PORT = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

// Middleware
app.use(express.json());

// If you also accept URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Enable CORS (replace with your React frontend URL)
app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));

// Serve uploaded images
// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// // Define absolute path for the folder
// const IMAGE_BASE_PATH = path.join(__dirname, "./mongodb_dataset");

// // Serve the folder at /uploads
// app.use("/uploads", express.static(IMAGE_BASE_PATH));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads/trialroom", express.static(path.join(__dirname, "uploads/trialroom")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-reviews", productReviewRoutes);
app.use("/api/feature-ratings", featureRatingRoutes);
app.use("/api/checkout", paymentRoutes);
app.use("/api/trialroom", trialRoomRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

// Database
await connectDB()
// Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
