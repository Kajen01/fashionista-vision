import express from "express";
import { executePayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", executePayment);

export default router;
