// =======================
// DIR CREATION FOR RECEIPTS
// =======================
import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads", "receipts");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Created receipts directory:", uploadDir);
}

// =======================
// ENV SETUP (FIRST)
// =======================
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Debug (remove later)
console.log("ENV CHECK:", {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? "Present" : "Missing",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? "Present" : "Missing",
});

// =======================
// CORE IMPORTS
// =======================
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

// =======================
// RAZORPAY INIT
// =======================
import { initRazorpay } from "./config/razorpay.js";
initRazorpay();

// =======================
// ROUTES
// =======================
import slotRoutes from "./routes/slotRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import homeVisitRoutes from "./routes/homeVisit.js";
import debugRoutes from "./routes/debugRoutes.js";

// =======================
// JOBS
// =======================
import { generateSlotsForNext3Months } from "./jobs/generateSlots.js";
import { unlockExpiredSlots } from "./jobs/unlockExpiredSlots.js";

// =======================
// APP SETUP
// =======================
const app = express();


const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://advanced-physio-frontend.onrender.com",
]);
// =======================
// WEBHOOK (RAW BODY ONLY)
// =======================
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  }
);

// =======================
// NORMAL MIDDLEWARE
// =======================
app.use(express.json());
app.use(cookieParser());




app.use(
  cors({
    origin: (origin, callback) => {
      console.log("🌐 CORS request origin:", origin);

      // Allow requests without Origin
      // e.g. server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      console.error("❌ CORS blocked:", origin);

      return callback(null, false);
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
  })
);
// =======================
// STATIC FILES (ROBUST FOR PDF)
// =======================
const uploadsRoot = path.join(process.cwd(), "uploads");

app.use("/uploads", (req, res, next) => {
  // Force correct headers for PDF files
  if (req.path.toLowerCase().endsWith(".pdf")) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
  }
  next();
}, express.static(uploadsRoot));

// =======================
// ROUTES
// =======================
app.get("/", (req, res) => {
  res.send("Advanced Physiotherapy Clinics API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/home-visit", homeVisitRoutes);
app.use("/api/debug", debugRoutes);

// =======================
// SERVER START
// =======================
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    await generateSlotsForNext3Months();
    console.log("Slots generated for next 3 months");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
};

// =======================
// BACKGROUND JOBS
// =======================
setInterval(unlockExpiredSlots, 60 * 1000);

startServer();