import express from "express";
import {
  createOrder,
  razorpayWebhook,
} from "../controllers/paymentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 LOGIN REQUIRED
router.post("/create-order", authMiddleware, createOrder);

// ❌ webhook NEVER needs auth
router.post("/webhook", express.raw({ type: "application/json" }),
  razorpayWebhook);

export default router;
