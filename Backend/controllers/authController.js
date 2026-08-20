import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";

export const firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Token required" });
    }

    // 🔐 Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);

    const phone = decoded.phone_number;

    if (!phone) {
      return res.status(400).json({ message: "Phone not found in token" });
    }

    // 🔎 Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        otpVerified: true,
        lastLogin: new Date(),
      });
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Firebase login error:", err);
    res.status(401).json({ message: "Invalid Firebase token" });
  }
};
