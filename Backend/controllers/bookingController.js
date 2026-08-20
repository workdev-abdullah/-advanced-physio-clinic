import Payment from "../models/Payment.js";

export const getReceiptStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId }).populate("bookingId");

    if (!payment || !payment.bookingId) {
      return res.json({ ready: false });
    }

    if (!payment.bookingId.pdfUrl) {
      return res.json({ ready: false });
    }

    return res.json({
      ready: true,
      pdfUrl: payment.bookingId.pdfUrl,
    });
  } catch (err) {
    console.error("Receipt status error:", err);
    res.status(500).json({ ready: false });
  }
};
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("slotId");

    res.json(bookings);
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};