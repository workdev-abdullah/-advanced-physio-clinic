import express from "express";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET receipt by Razorpay orderId
 */
router.get("/receipt/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId }).populate("bookingId");

    if (!payment || !payment.bookingId || !payment.bookingId.pdfUrl) {
      return res.json({ ready: false });
    }

    return res.json({
      ready: true,
      pdfUrl: payment.bookingId.pdfUrl,
    });
  } catch (err) {
    console.error("Receipt fetch error:", err);
    return res.status(500).json({ ready: false });
  }
});

/**
 * ✅ GET MY BOOKINGS (SECURE)
 * URL: /api/bookings/my
 */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("slotId");

    res.json(bookings);
  } catch (err) {
    console.error("My bookings error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

export default router;
