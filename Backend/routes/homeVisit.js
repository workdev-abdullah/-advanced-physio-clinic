import express from "express";
import ClinicConfig from "../models/ClinicConfig.js";
import { calculateFinalDistance } from "../utlis/distance.js";
import { calculateHomeVisitPrice } from "../utlis/homeVisitPrice.js";
import { getRazorpay } from "../config/razorpay.js";
import Payment from "../models/Payment.js";

const router = express.Router();

const BASE_HOME_VISIT_CHARGE = 500; // ₹500 for first 4 km
const MAX_HOME_VISIT_KM = 300;

/**
 * POST /api/home-visit/preview
 * Calculate distance & price preview (before payment)
 */
router.post("/preview", async (req, res) => {
  try {
    const { location } = req.body;

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ message: "GPS location required" });
    }

    const { lat, lng, accuracy } = location;

    if (!accuracy || accuracy > 100) {
      return res.status(400).json({ message: "Location accuracy must be ≤100m" });
    }

    const config = await ClinicConfig.findOne();
    if (!config) {
      return res.status(500).json({ message: "Clinic config not found" });
    }

    const distanceData = calculateFinalDistance({
      clinicLat: config.clinicLat,
      clinicLng: config.clinicLng,
      userLat: lat,
      userLng: lng,
      accuracy,
    });

    if (distanceData.finalDistance > MAX_HOME_VISIT_KM) {
      return res.status(400).json({ message: `Home visit available within ${MAX_HOME_VISIT_KM} km only` });
    }

    const totalAmount = calculateHomeVisitPrice(distanceData.finalDistance);

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount calculated" });
    }

    res.json({
      distanceKm: distanceData.finalDistance,
      totalAmount,
      baseCharge: BASE_HOME_VISIT_CHARGE,
      extraCharge: totalAmount - BASE_HOME_VISIT_CHARGE,
    });
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).json({ message: "Calculation failed" });
  }
});

/**
 * POST /api/home-visit/create-order
 */
router.post("/create-order", async (req, res) => {
  try {
    const { patient, address, location } = req.body;

    /* ================= HARD VALIDATION ================= */

    if (!patient) {
      return res.status(400).json({ message: "Patient details are required" });
    }

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ message: "GPS location is required for home visit" });
    }

    const { lat, lng, accuracy } = location;

    if (!accuracy || accuracy > 100) {
      return res.status(400).json({
        message: "Location accuracy is low. Please turn ON GPS, go outdoors, and try again.",
      });
    }

    /* ================= CLINIC CONFIG ================= */

    const config = await ClinicConfig.findOne();
    if (!config) {
      return res.status(500).json({ message: "Clinic configuration not found" });
    }

    /* ================= DISTANCE ================= */

    const distanceData = calculateFinalDistance({
      clinicLat: config.clinicLat,
      clinicLng: config.clinicLng,
      userLat: lat,
      userLng: lng,
      accuracy,
    });

    if (distanceData.finalDistance > MAX_HOME_VISIT_KM) {
      return res.status(400).json({ message: `Home visit available within ${MAX_HOME_VISIT_KM} km only` });
    }

    /* ================= PRICE ================= */

    const amount = calculateHomeVisitPrice(distanceData.finalDistance);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid home visit amount" });
    }

    /* ================= RAZORPAY ================= */

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `home_${Date.now()}`,
      notes: {
        visitType: "HOME",
          slotId: req.body.slotId,
        patientName: patient.name,
        patientPhone: patient.phone,
        painArea: patient.painArea,
        painDuration: patient.painDuration,
        address: address ? JSON.stringify(address) : "NA",
        baseDistanceKm: distanceData.baseDistance,
        accuracyKm: distanceData.accuracyKm,
        finalDistanceKm: distanceData.finalDistance,
        userId: req.user?.id || "NA",
      },
    });

    /* ================= SAVE PAYMENT ================= */

    await Payment.create({
      orderId: order.id,
      amount,
      status: "CREATED",
      visitType: "HOME",
    });

    /* ================= RESPONSE ================= */

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: "INR",
      distanceKm: distanceData.finalDistance,
      totalAmount: amount,
    });
  } catch (err) {
    console.error("❌ Home visit error:", err);
    res.status(400).json({ message: err.message || "Home visit payment initiation failed" });
  }
});

export default router;