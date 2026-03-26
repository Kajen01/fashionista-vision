import express from "express";
import { getUsers, getUserById, updateUser, deleteUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes protected & admin-only
router.use(protect);
router.use(requireAdmin);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
