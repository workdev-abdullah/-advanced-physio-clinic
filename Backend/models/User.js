// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
    },
      otpVerified: { type: Boolean, default: false },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
