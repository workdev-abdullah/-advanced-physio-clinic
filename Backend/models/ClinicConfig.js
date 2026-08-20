// models/ClinicConfig.js
import mongoose from "mongoose";

const clinicConfigSchema = new mongoose.Schema(
  {
    // ===== EXISTING FIELDS (DO NOT TOUCH) =====
    morningStart: String, // "09:30"
    morningEnd: String,   // "13:30"

    eveningStart: String, // "16:00"
    eveningEnd: String,   // "19:00"

    sundayEveningClosed: {
      type: Boolean,
      default: true,
    },

    clinicName: String,
    doctorName: String,
    registrationNo: String,

    // ===== NEW FIELDS (HOME VISIT ONLY) =====
    clinicLat: {
      type: Number,
      required: true,
    },

    clinicLng: {
      type: Number,
      required: true,
    },

    homeVisitBasePrice: {
      type: Number,
      default: 500,
    },

    freeKm: {
      type: Number,
      default: 4,
    },

    perKmRate: {
      type: Number,
      default: 20,
    },

    maxHomeVisitKm: {
      type: Number,
      default: 300,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ClinicConfig", clinicConfigSchema);
