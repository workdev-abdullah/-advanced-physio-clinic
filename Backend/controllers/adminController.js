import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";
/**
 * TODAY'S SCHEDULE (ADMIN / PHYSIO)
 * Shows real booked patients
 */
export const todaySchedule = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
    
      bookingStatus: "CONFIRMED",
      paymentStatus: "PAID",
      
    })
      .populate("slotId")
      .sort({ "slotId.startTime": 1 });

    res.json(bookings);
  } catch (err) {
    console.error("Today schedule error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/**
 * BLOCK SLOT (ADMIN)
 * Blocks slot without payment
 */
export const blockSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, status: "AVAILABLE" },
      { status: "BLOCKED" },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({
        message: "Slot cannot be blocked",
      });
    }

    res.json({ message: "Slot blocked successfully" });
  } catch (err) {
    console.error("Block slot error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UNBLOCK SLOT (ADMIN)
 */
export const unblockSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    await Slot.findByIdAndUpdate(slotId, {
      status: "AVAILABLE",
      lockedUntil: null,
    });

    res.json({ message: "Slot unblocked" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * MONTHLY SUMMARY (ADMIN)
 */
export const monthlySummary = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const bookings = await Booking.find({
      createdAt: { $gte: start },
      paymentStatus: "PAID",
    });

    const totalIncome = bookings.reduce(
      (sum, b) => sum + b.amount,
      0
    );

    res.json({
      totalVisits: bookings.length,
      totalIncome,
    });
  } catch (err) {
    console.error("Monthly summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * ADMIN – TODAY SUMMARY
 */
export const getTodaySummary = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Use APPOINTMENT DATE (slot.startTime), not createdAt
  const bookings = await Booking.find({
  $or: [
    { "slotId.startTime": { $gte: start, $lte: end } },
    { appointmentDate: { $gte: start, $lte: end } }
  ],
}).populate("slotId");


    const todayBookings = bookings.filter(
      (b) => b.slotId !== null
    );

    const totalIncome = todayBookings.reduce(
      (sum, b) => sum + (b.amount || 0),
      0
    );

    res.json({
      totalAppointments: todayBookings.length,
      totalIncome,
      bookings: todayBookings,
    });
  } catch (err) {
    console.error("Today summary error:", err);
    res.status(500).json({ message: "Failed to load today summary" });
  }
};

