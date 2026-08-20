import Razorpay from "razorpay";

let razorpayInstance = null;

export const initRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys not loaded from .env");
  }

  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log("✅ Razorpay initialized");
};

export const getRazorpay = () => {
  if (!razorpayInstance) {
    throw new Error("Razorpay not initialized");
  }
  return razorpayInstance;
};
