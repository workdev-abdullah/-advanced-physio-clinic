import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function PatientDetails() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const slotId = params.get("slotId");

  // ✅ unchanged
  const visitType = params.get("visitType") || "CLINIC";

  const auth = getAuth();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    painArea: "",
    painDuration: "",
  });

  const [address, setAddress] = useState({
    house: "",
    area: "",
    city: "",
    pincode: "",
  });

  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    accuracy: null,
  });

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false); // NEW: for home preview
  const isDesktop = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  /* ================= LOGIN CHECK ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
    });
    return () => unsub();
  }, [auth, navigate]);

  if (!slotId && visitType === "CLINIC") { // Home may not have slotId
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="text-center text-red-600 dark:text-red-400 font-semibold">
          Invalid slot. Please book again.
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= GPS HANDLER ================= */
  const captureLocation = () => {
    // ✅ ADDED: block desktop early
    if (isDesktop) {
      alert(
        "Home visit booking requires mobile GPS.\nPlease open this page on your mobile phone."
      );
      return;
    }

    if (!navigator.geolocation) {
      alert("Location not supported on this device");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // 🚫 Reject IP / WiFi based location
        if (accuracy > 100) {
          alert(
            "Location accuracy is low. Please turn ON GPS, go outside, and try again."
          );
          return;
        }

        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
        });
      },
      () => {
        alert("Unable to fetch GPS location. Please allow location access.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /* ================= NEW: Calculate Preview for Home Visit ================= */
  const goToPreview = async () => {
    const { name, phone, painArea, painDuration } = form;

    if (!name || !phone || !painArea || !painDuration) {
      alert("Please fill all patient details");
      return;
    }

    if (!address.house || !address.area || !address.city || !address.pincode) {
      alert("Please fill complete home address");
      return;
    }

    if (!location.lat || !location.lng) {
      alert("Please capture your current GPS location");
      return;
    }

    setPreviewLoading(true);

    try {
      const res = await api.post("/home-visit/preview", { location });
      const previewData = res.data;

      // Navigate to your existing preview page with all data
      navigate("/home-visit-preview", { // Change to your actual preview page path
        state: {
          patient: form,
          address,
          location,
          preview: previewData,
          slotId: visitType === "CLINIC" ? slotId : null, // If preview handles clinic too
        },
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to calculate charges");
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ================= SUBMIT (CLINIC ONLY – UNCHANGED) ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (visitType === "HOME") {
      // For home: go to preview instead of direct payment
      goToPreview();
      return;
    }

    // Clinic flow unchanged
    const { name, phone, painArea, painDuration } = form;

    if (!name || !phone || !painArea || !painDuration) {
      alert("Please fill all details");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/payment/create-order", {
        slotId,
        patient: form,
      });

      const { orderId, key, amount, currency } = res.data;

      const options = {
        key,
        amount,
        currency,
        order_id: orderId,
        name: "Advance Physiotherapy Clinic",
        description: "Physiotherapy Appointment",
        handler: () => {
          window.location.href = `/success?orderId=${orderId}`;
        },
        prefill: {
          name,
          contact: phone,
        },
        theme: { color: "#16a34a" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-slate-100 dark:bg-slate-900 px-3 sm:px-4 py-4 sm:py-10">
      <form
        onSubmit={handleSubmit}
        className="
          w-full max-w-full sm:max-w-md
          bg-white dark:bg-slate-800
          border border-gray-200 dark:border-slate-700
          rounded-2xl shadow-xl
          p-4 sm:p-6
        "
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
          Patient Details
        </h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          Please provide details for the appointment
        </p>

        {/* PATIENT NAME */}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Patient Name
        </label>
        <input
          name="name"
          placeholder="Enter patient name"
          className="
            w-full px-4 py-3 sm:py-2 rounded-xl mb-4
            border border-gray-300 dark:border-slate-600
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-green-500
          "
          value={form.name}
          onChange={handleChange}
        />

        {/* PHONE */}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Patient Phone Number
        </label>
        <input
          name="phone"
          placeholder="Enter phone number"
          className="
            w-full px-4 py-2 rounded-xl mb-4
            border border-gray-300 dark:border-slate-600
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-green-500
          "
          value={form.phone}
          onChange={handleChange}
        />

        {/* PAIN AREA */}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pain Area
        </label>
        <input
          name="painArea"
          placeholder="e.g. Lower back, knee, shoulder"
          className="
            w-full px-4 py-2 rounded-xl mb-4
            border border-gray-300 dark:border-slate-600
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-green-500
          "
          value={form.painArea}
          onChange={handleChange}
        />

        {/* PAIN DURATION */}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pain Duration
        </label>
        <select
          name="painDuration"
          className="
            w-full px-4 py-2 rounded-xl mb-6
            border border-gray-300 dark:border-slate-600
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-green-500
          "
          value={form.painDuration}
          onChange={handleChange}
        >
          <option value="">Select duration</option>
          <option value="1-7 days">1–7 days</option>
          <option value="1-4 weeks">1–4 weeks</option>
          <option value="1-6 months">1–6 months</option>
          <option value="6+ months">6+ months</option>
        </select>

        {/* HOME ADDRESS */}
        {visitType === "HOME" && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Home Address
            </label>

            <button
              type="button"
              onClick={captureLocation}
              className="
                w-full mb-3 py-3 sm:py-2 rounded-xl
                bg-blue-600 text-white
                hover:bg-blue-700 transition
              "
            >
              📍 Use My Current Location
            </button>

            {location.lat && (
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mb-2">
                Location captured (accuracy ~{Math.round(location.accuracy)} m)
              </p>
            )}

            <input
              placeholder="House / Street"
              value={address.house}
              className="
                w-full px-4 py-2 rounded-xl mb-2
                border border-gray-300 dark:border-slate-600
                bg-white dark:bg-slate-800
                text-gray-900 dark:text-gray-100
              "
              onChange={(e) =>
                setAddress({ ...address, house: e.target.value })
              }
            />

            <input
              placeholder="Area"
              value={address.area}
              className="
                w-full px-4 py-2 rounded-xl mb-2
                border border-gray-300 dark:border-slate-600
                bg-white dark:bg-slate-800
                text-gray-900 dark:text-gray-100
              "
              onChange={(e) =>
                setAddress({ ...address, area: e.target.value })
              }
            />

            <input
              placeholder="City"
              value={address.city}
              className="
                w-full px-4 py-2 rounded-xl mb-2
                border border-gray-300 dark:border-slate-600
                bg-white dark:bg-slate-800
                text-gray-900 dark:text-gray-100
              "
              onChange={(e) =>
                setAddress({ ...address, city: e.target.value })
              }
            />

            <input
              placeholder="Pincode"
              value={address.pincode}
              className="
                w-full px-4 py-2 rounded-xl mb-4
                border border-gray-300 dark:border-slate-600
                bg-white dark:bg-slate-800
                text-gray-900 dark:text-gray-100
              "
              onChange={(e) =>
                setAddress({ ...address, pincode: e.target.value })
              }
            />
          </>
        )}

        <button
          type={visitType === "HOME" ? "button" : "submit"} // Home: button to preview, Clinic: submit
          onClick={visitType === "HOME" ? goToPreview : undefined}
          disabled={loading || previewLoading}
          className="
            w-full py-3 rounded-xl font-semibold
            bg-green-600 text-white
            hover:bg-green-700 transition
            disabled:opacity-60
          "
        >
          {loading || previewLoading
            ? "Processing..."
            : visitType === "HOME"
            ? "View Preview & Charges"
            : "Proceed to Payment"}
        </button>
      </form>
    </div>
  );
}