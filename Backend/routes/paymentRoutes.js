import express from "express";

import {
  createOrder,
  razorpayWebhook,
  getReceiptStatus,
} from "../controllers/paymentController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 LOGIN REQUIRED
router.post(
  "/create-order",
  authMiddleware,
  createOrder
);

// ✅ CHECK RECEIPT STATUS
router.get(
  "/receipt-status/:orderId",
  authMiddleware,
  getReceiptStatus
);

// ❌ WEBHOOK NEVER NEEDS AUTH
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

export default router;