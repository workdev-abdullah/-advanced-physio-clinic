import Slot from "../models/Slot.js";

export const unlockExpiredSlots = async () => {
  try {
    await Slot.updateMany(
      {
        status: "LOCKED",
        lockedUntil: { $lt: new Date() },
      },
      {
        $set: {
          status: "AVAILABLE",
          lockedUntil: null,
        },
      }
    );
  } catch (err) {
    console.error("Auto unlock error:", err);
  }
};
