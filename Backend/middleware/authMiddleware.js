import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    // 🔐 Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    const phone = decoded.phone_number;
    if (!phone) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // ✅ FIND OR CREATE USER
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        role: "PATIENT",
      });
    }

    // ✅ Attach minimal safe data
    req.user = {
      id: user._id,
      phone: user.phone,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default authMiddleware;
