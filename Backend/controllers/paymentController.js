import Slot from "../models/Slot.js";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import crypto from "crypto";
import { getRazorpay } from "../config/razorpay.js";
import generateBookingPDF from "../utlis/generateBookingPDF.js";

/* ======================
   CREATE PAYMENT ORDER
====================== */
export const createOrder = async (req, res) => {
  try {
    const { slotId, patient } = req.body;

    console.log("PATIENT DATA RECEIVED:", patient);

    if (!slotId || !patient) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const razorpay = getRazorpay();

    const slot = await Slot.findOne({
      _id: slotId,
      status: "LOCKED",
      lockedUntil: { $gt: new Date() },
    });

    if (!slot) {
      return res.status(400).json({
        message: "Slot lock expired. Please book again.",
      });
    }

    const amount = 400; // INR (backend controlled)

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `slot_${slotId}`,
      notes: {
        slotId,
        userId: req.user.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        painArea: patient.painArea,
        painDuration: patient.painDuration,
        visitType: slot.visitType,
      },
    });

    await Payment.create({
      slotId,
      orderId: order.id,
      amount,
      status: "CREATED",
      visitType: slot.visitType,
      userId: req.user.id,
    });



    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("❌ Create order error:", err);
    res.status(500).json({ message: "Payment initiation failed" });
  }
};

/* ======================
   RAZORPAY WEBHOOK
====================== */
export const razorpayWebhook = async (req, res) => {
  try {
    console.log("✅ WEBHOOK HIT");

    const signature = req.headers["x-razorpay-signature"];

    const rawBody =
      req.rawBody || (Buffer.isBuffer(req.body) ? req.body : null);

    if (!rawBody) {
      console.error("❌ RAW BODY MISSING");
      return res.status(400).send("Raw body missing");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ SIGNATURE MISMATCH");
      return res.status(400).send("Invalid signature");
    }

    const payload = JSON.parse(rawBody.toString());

    if (payload.event !== "payment.captured") {
      return res.json({ received: true });
    }

    const entity = payload.payload.payment.entity;
    console.log("💰 PAYMENT CAPTURED:", entity.order_id);

    const payment = await Payment.findOne({ orderId: entity.order_id });
    if (!payment) {
      console.error("❌ PAYMENT RECORD NOT FOUND");
      return res.json({ received: true });
    }

    payment.status = "SUCCESS";
    payment.paymentId = entity.id;
    await payment.save();

    const notes = entity.notes || {};
    const visitType = notes.visitType || "CLINIC";

    let slot = null;
    let bookingData = {
      // FIXED: Use payment.userId if available, fallback to notes, allow null
      userId: payment.userId || (notes.userId && notes.userId !== "NA" ? notes.userId : null),
      bookingId: `APC-${Date.now()}`,
      patientName: notes.patientName || "Patient",
      phone: notes.patientPhone || "NA",
      painArea: notes.painArea || "NA",
      painDuration: notes.painDuration || "NA",
      visitType: visitType,
      amount: payment.amount,
      bookingStatus: "CONFIRMED",
      paymentStatus: "PAID",
    };

    if (visitType === "CLINIC") {
      // CLINIC LOGIC (UNCHANGED)
      slot = await Slot.findOneAndUpdate(
        { _id: payment.slotId, status: "LOCKED" },
        { status: "BOOKED", lockedUntil: null },
        { new: true }
      );

      if (!slot) {
        console.error("❌ SLOT NOT FOUND OR ALREADY BOOKED");
        return res.json({ received: true });
      }

      bookingData.slotId = slot._id;

      // Block home visit at same time
      await Slot.findOneAndUpdate(
        {
          startTime: slot.startTime,
          endTime: slot.endTime,
          visitType: "HOME",
        },
        {
          $setOnInsert: { startTime: slot.startTime, endTime: slot.endTime, visitType: "HOME" },
          status: "BLOCKED",
          blockedReason: "Doctor busy with clinic appointment",
        },
        { upsert: true, new: true }
      );
    } else {
      // HOME VISIT LOGIC
      bookingData.slotId = null;
      // Add home specific fields from notes
        if (notes.slotId) {
    const slot = await Slot.findById(notes.slotId);
    if (slot) {
      bookingData.visitTime = `${slot.startTime.toISOString()}|${slot.endTime.toISOString()}`;
    }
  }
      if (notes.address) {
        bookingData.address = JSON.parse(notes.address);
      }
      if (notes.finalDistanceKm) {
        bookingData.distanceKm = parseFloat(notes.finalDistanceKm);
      }
      bookingData.totalAmount = payment.amount;
    }

    // REMOVED: Strict check for userId – allow null (schema is optional)
    // REMOVED: Custom log for missing userId

    const booking = await Booking.create(bookingData);

    console.log("📄 GENERATING PDF FOR BOOKING:", booking._id.toString());

    const pdfPath = await generateBookingPDF(booking);

    booking.pdfUrl = pdfPath;
    await booking.save();

    payment.bookingId = booking._id;
    await payment.save();

    console.log("✅ PDF SAVED AT:", pdfPath);

    res.json({ received: true });
  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
    res.status(500).send("Webhook error");
  }
};

export const getReceiptStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        ready: false,
        message: "Order ID is required",
      });
    }

    const payment = await Payment.findOne({
      orderId,
    }).populate("bookingId");

    if (!payment) {
      return res.json({
        ready: false,
      });
    }

    if (!payment.bookingId) {
      return res.json({
        ready: false,
      });
    }

    if (!payment.bookingId.pdfUrl) {
      return res.json({
        ready: false,
      });
    }

    return res.json({
      ready: true,
      pdfUrl: payment.bookingId.pdfUrl,
    });
  } catch (err) {
    console.error("❌ Receipt status error:", err);

    return res.status(500).json({
      ready: false,
      message: "Failed to check receipt status",
    });
  }
};