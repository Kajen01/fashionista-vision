import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import {
  createOrderFromSuccessfulPayment,
  deleteOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", protect, createOrderFromSuccessfulPayment);
router.get("/my", protect, getMyOrders);
router.get("/", protect, requireAdmin, getAllOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, requireAdmin, updateOrderStatus);
router.delete("/:id", protect, requireAdmin, deleteOrder);

export default router;
