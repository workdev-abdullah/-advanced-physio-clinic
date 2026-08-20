// src/pages/HomeVisitPreview.js (Fully Fixed: Shows Selected Appointment Date/Time + Passes slotId to Payment)
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function HomeVisitPreview() {
  const location = useLocation();
  const navigate = useNavigate();

  // Destructure all state including selectedSlot
  const { patient, address, location: gpsLocation, preview, selectedSlot } = location.state || {};

  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Format selected slot time with AM/PM
  const formatSlotTime = () => {
    if (!selectedSlot) return null;

    const start = new Date(selectedSlot.startTime);
    const end = new Date(selectedSlot.endTime);

    return {
      date: start.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: `${start.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).toLowerCase()} – ${end.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).toLowerCase()}`,
    };
  };

  const slotInfo = formatSlotTime();

  // Load Razorpay SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const proceedToPayment = async () => {
    if (!detailsConfirmed) {
      alert("Please confirm the details and charges");
      return;
    }

    if (!selectedSlot) {
      alert("No time slot selected. Please go back and select a slot.");
      return;
    }

    setPaymentLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Razorpay SDK failed to load");

      // ← PASS slotId to create-order
      const res = await api.post("/home-visit/create-order", {
        patient,
        address,
        location: gpsLocation,
        slotId: selectedSlot._id,
      });

      const { orderId, key, amount, currency } = res.data;

      const options = {
        key,
        amount,
        currency,
        name: "Advance Physiotherapy Clinic",
        description: "Home Visit Booking",
        order_id: orderId,
        handler: () => {
          alert("Payment successful! Booking confirmed.");
          navigate("/success?orderId=" + orderId);
        },
        prefill: {
          name: patient.name,
          contact: patient.phone,
        },
        notes: { address: JSON.stringify(address) },
        theme: { color: "#339955" },
        modal: { ondismiss: () => alert("Payment cancelled") },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", (response) => {
        alert("Payment failed: " + response.error.description);
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!preview || !patient || !address || !gpsLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-xl">Invalid preview data. Go back and try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-10">
          Booking Preview & Charges
        </h2>

        {/* Selected Appointment Card */}
        {slotInfo ? (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-3xl shadow-2xl p-8 mb-10 text-center">
            <p className="text-xl font-semibold mb-2">Your Selected Appointment</p>
            <p className="text-3xl font-bold">{slotInfo.date}</p>
            <p className="text-2xl mt-4">{slotInfo.time}</p>
            <p className="mt-4 text-lg opacity-90">This time will be reserved for your home visit</p>
          </div>
        ) : (
          <div className="bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 rounded-3xl shadow-xl p-8 mb-10 text-center">
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">No time slot selected yet</p>
            <p className="mt-4 text-lg">Please go back and select a slot first</p>
          </div>
        )}

        {/* Patient & Address */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8">
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Patient Details</p>
          <p><span className="font-medium">Name:</span> {patient.name}</p>
          <p><span className="font-medium">Phone:</span> {patient.phone}</p>

          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-6">Address</p>
          <p>{address.house}</p>
          <p>{address.area}</p>
          <p>{address.city} - {address.pincode}</p>
        </div>

        {/* Charges */}
        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl shadow-xl p-8 mt-10">
          <h3 className="text-3xl font-bold text-center text-indigo-800 dark:text-indigo-200 mb-8">Charges Summary</h3>

          <div className="space-y-6 text-lg">
            <p>
              <span className="font-medium">Distance from Clinic:</span>{" "}
              <span className="font-bold text-indigo-700 dark:text-indigo-300">
                {preview.distanceKm.toFixed(1)} km
              </span>
            </p>
            <p>
              <span className="font-medium">Base Home Visit Fee (first 4 km):</span> ₹{preview.baseCharge}
            </p>
            <p>
              <span className="font-medium">Extra Distance Fee ({Math.max(0, Math.ceil(preview.distanceKm - 4))} km @ ₹20/km):</span>{" "}
              <span className="font-bold">₹{preview.extraCharge}</span>
            </p>
            <div className="pt-6 border-t-2 border-indigo-300 dark:border-indigo-600">
              <p className="text-4xl font-bold text-green-700 dark:text-green-400 text-center">
                Total Amount: ₹{preview.totalAmount}
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation & Payment */}
        <div className="mt-12 space-y-8">
          <label className="flex items-center space-x-4 cursor-pointer">
            <input
              type="checkbox"
              checked={detailsConfirmed}
              onChange={(e) => setDetailsConfirmed(e.target.checked)}
              className="w-8 h-8 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-xl font-medium text-gray-900 dark:text-white">
              I confirm all details and charges are correct
            </span>
          </label>

          <button
            onClick={proceedToPayment}
            disabled={paymentLoading || !detailsConfirmed || !selectedSlot}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 rounded-3xl font-bold text-2xl shadow-2xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 transition-all duration-300 transform hover:scale-[1.02]"
          >
            {paymentLoading ? "Processing Payment..." : `Pay ₹${preview.totalAmount} & Confirm Booking`}
          </button>
        </div>
      </div>
    </div>
  );
}