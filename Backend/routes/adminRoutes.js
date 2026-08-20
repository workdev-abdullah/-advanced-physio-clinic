import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import Booking from "../models/Booking.js";
import { getTodaySummary } from "../controllers/adminController.js";

const router = express.Router();

/**
 * GET today's appointments
 */
router.get("/today", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
  $or: [
    { "slotId.startTime": { $gte: start, $lte: end } }, // CLINIC
    { appointmentDate: { $gte: start, $lte: end } }     // HOME
  ],
})
      .sort({ createdAt: 1 })
      .populate("slotId");

    res.json(bookings);
  } catch (err) {
    console.error("Admin today error:", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

/**
 * MARK appointment as COMPLETED
 */
router.patch(
  "/complete/:bookingId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const booking = await Booking.findByIdAndUpdate(
        req.params.bookingId,
        { bookingStatus: "COMPLETED" },
        { new: true }
      );

      res.json(booking);
    } catch (err) {
      console.error("Complete booking error:", err);
      res.status(500).json({ message: "Update failed" });
    }
  }
);
/**
 * GET admin dashboard summary
 * URL: /api/admin/summary
 */
router.get(
  "/summary",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const totalBookings = await Booking.countDocuments();

      const totalIncomeAgg = await Booking.aggregate([
        { $match: { paymentStatus: "PAID" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      const totalIncome =
        totalIncomeAgg.length > 0
          ? totalIncomeAgg[0].total
          : 0;

      res.json({
        totalBookings,
        totalIncome,
      });
    } catch (err) {
      console.error("Admin summary error:", err);
      res.status(500).json({ message: "Failed to load summary" });
    }
  }
);
/**
 * GET all bookings (past + future)
 * URL: /api/admin/bookings
 */
router.get(
  "/bookings",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const bookings = await Booking.find()
        .populate("slotId")
        .sort({ "slotId.startTime": -1 });

      res.json(bookings);
    } catch (err) {
      console.error("Admin all bookings error:", err);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  }
);
/**
 * CHECK admin access (for frontend header)
 * URL: /api/admin/check
 */
router.get(
  "/check",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    res.json({ isAdmin: true });
  }
);

router.get(
  "/today-summary",
  authMiddleware,
  adminMiddleware,
  getTodaySummary
);

export default router;
