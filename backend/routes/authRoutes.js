import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getCurrentUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

export default router;
