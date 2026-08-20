import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    visitType: {
      type: String,
      enum: ["CLINIC", "HOME"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "LOCKED", "BOOKED", "BLOCKED"],
      default: "AVAILABLE",
      index: true,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    blockedReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// 🔑 Prevent duplicate slot creation
slotSchema.index(
  { startTime: 1, visitType: 1 },
  { unique: true }
);

export default mongoose.model("Slot", slotSchema);
