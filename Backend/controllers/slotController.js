import Slot from "../models/Slot.js";
import moment from "moment-timezone";

const TZ = "Asia/Kolkata";

/**
 * GET /api/slots
 * Query params:
 *  - date=YYYY-MM-DD
 *  - visitType=CLINIC | HOME
 */
export const getAvailableSlots = async (req, res) => {
  try {
       console.log("🔥 BACKEND HIT /api/slots");
    console.log("QUERY =", req.query);
    console.log("HEADERS =", req.headers["user-agent"]);
    let { date, visitType } = req.query;

    if (!date || !visitType) {
        console.log("❌ Missing params");
      return res.status(400).json({
        message: "date and visitType required",
      });
    }

    // ✅ normalize date (mobile safe)
    date = date.split("T")[0];
    console.log("📅 Parsed date =", date);
    // 🔥🔥🔥 CRITICAL FIX — DISABLE CACHE
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    const dayStart = moment
      .tz(date, "YYYY-MM-DD", TZ)
      .startOf("day")
      .toDate();

    const dayEnd = moment
      .tz(date, "YYYY-MM-DD", TZ)
      .endOf("day")
      .toDate();

    const slots = await Slot.find({
      visitType,
      startTime: { $gte: dayStart, $lte: dayEnd },
    }).sort({ startTime: 1 });

    res.json(slots);
  } catch (err) {
    console.error("Get slots error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * POST /api/slots/:slotId/lock
 */
export const lockSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);

    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        status: "AVAILABLE",
      },
      {
        status: "LOCKED",
        lockedUntil,
      },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({
        message: "Slot already locked or booked",
      });
    }

    res.json({
      message: "Slot locked for 5 minutes",
      lockedUntil: slot.lockedUntil,
    });
  } catch (err) {
    console.error("Slot lock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
