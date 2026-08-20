import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // ← FIXED: Optional (home visits have no userId or "NA")
    },

    bookingId: {
      type: String,
      required: true,
      unique: true,
    },

    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: false, // ← FIXED: Optional (home visits have no slot)
    },

    patientName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    painArea: {
      type: String,
      required: true,
    },

    painDuration: {
      type: String,
      required: true,
    },

    visitType: {
      type: String,
      enum: ["CLINIC", "HOME"],
      required: true,
    },
visitTime: {
  type: String,
  required: false,
},

    appointmentDate: {
      type: Date,
      required: false,
    },
    // HOME VISIT FIELDS (OPTIONAL)
    address: {
      house: { type: String },
      area: { type: String },
      city: { type: String },
      pincode: { type: String },
    },

    distanceKm: {
      type: Number,
    },

    totalAmount: {
      type: Number,
    },

    amount: {
      type: Number,
      required: true,
    },

    bookingStatus: {
      type: String,
      default: "CONFIRMED",
    },

    paymentStatus: {
      type: String,
      default: "PAID",
    },

    pdfUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);