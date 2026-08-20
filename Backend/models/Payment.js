import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // Which slot this payment is for (CRITICAL for clinic, optional for home)
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: false, // Already changed – safe for home visits
    },


      userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
       required: false,
    },
    // Booking will be created AFTER payment success
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    gateway: {
      type: String,
      default: "RAZORPAY",
    },

    orderId: {
      type: String,
      required: true,
    },

    paymentId: {
      type: String,
      default: null,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["CREATED", "SUCCESS", "FAILED"],
      default: "CREATED",
    },

    // NEW: Distinguish clinic vs home (with default for backward compatibility)
    visitType: {
      type: String,
      enum: ["CLINIC", "HOME"],
      required: true,
      default: "CLINIC", // ← ADDED default "CLINIC" – fixes clinic bookings automatically
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);