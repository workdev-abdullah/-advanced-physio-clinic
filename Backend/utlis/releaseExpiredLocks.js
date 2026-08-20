import Slot from "../models/Slot.js";

const LOCK_EXPIRY_MINUTES = 5;

export async function releaseExpiredLocks() {
  const expiryTime = new Date(
    Date.now() - LOCK_EXPIRY_MINUTES * 60 * 1000
  );

  await Slot.updateMany(
    {
      status: "LOCKED",
      lockedAt: { $lt: expiryTime },
    },
    {
      $set: {
        status: "AVAILABLE",
        lockedAt: null,
      },
    }
  );
}
