// src/pages/HomeVisit.js (Fully Fixed: Modern CSS + Selected Slot with AM/PM + Required Validation)
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AddressForm from "../components/AddressForm";
import api from "../api/api";

export default function HomeVisit() {
  const navigate = useNavigate();
  const location = useLocation();

  // Receive selected slot from Slots page
  const selectedSlot = location.state?.selectedSlot || null;

  const [patient, setPatient] = useState({
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

  // Location state
  const [locationState, setLocationState] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");
  const [watchId, setWatchId] = useState(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Start watching location
  const startLocationWatch = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationStatus("error");
      return;
    }

    setLocationStatus("fetching");
    setLocationError("");
    setLocationState(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLoc = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
        };

        setLocationState(newLoc);

        if (accuracy <= 100) {
          setLocationStatus("good");
          navigator.geolocation.clearWatch(id);
          setWatchId(null);
        } else {
          setLocationStatus("poor");
        }
      },
      (error) => {
        let msg = "Unable to fetch location";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied permanently. Reset in browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location unavailable. Move outdoors.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location timeout. Try again.";
        }
        setLocationError(msg);
        setLocationStatus("error");
        navigator.geolocation.clearWatch(id);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Calculate preview and navigate to preview page
  const goToPreview = async () => {
    if (!locationState || locationState.accuracy > 100) {
      alert("Location accuracy must be 100m or better");
      return;
    }

    if (!patient.name || !patient.phone ||    !patient.painArea ||
  !patient.painDuration || !address.house || !address.area || !address.city || !address.pincode) {
      alert("Please fill all required fields");
      return;
    }

    if (!selectedSlot) {
      alert("Please select a time slot first");
      return;
    }

    setPreviewLoading(true);
    setPreviewError("");

    try {
      const res = await api.post("/home-visit/preview", { location: locationState });

      navigate("/home-visit-preview", {
        state: {
          patient,
          address,
          location: locationState,
          preview: res.data,
          selectedSlot,
        },
      });
    } catch (err) {
      setPreviewError(err.response?.data?.message || "Failed to calculate charges");
    } finally {
      setPreviewLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-10">
          Home Visit Booking
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
            <p className="mt-4 text-lg">Please select a slot first</p>
          </div>
        )}

        {/* Slot Selection Button */}
        <button
          onClick={() => navigate("/slots?visitType=HOME")}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-2xl font-bold text-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] mb-10"
        >
          {selectedSlot ? "Change Time Slot" : "Select Available Slot"}
        </button>

        <div className="space-y-8">
          {/* Patient Details */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Patient Details
            </h3>

            <div className="grid grid-cols-1 gap-6">
              <input
                type="text"
                placeholder="Patient Name *"
                className="px-6 py-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-green-500 focus:border-transparent transition"
                value={patient.name}
                onChange={(e) => setPatient({ ...patient, name: e.target.value })}
              />

              <input
                type="tel"
                placeholder="Phone Number *"
                className="px-6 py-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-green-500 focus:border-transparent transition"
                value={patient.phone}
                onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
              />
                {/* Pain Area */}
  <input
    type="text"
    placeholder="Pain Area (e.g. Back, Knee, Shoulder) *"
    className="px-6 py-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-green-500 focus:border-transparent transition"
    value={patient.painArea}
    onChange={(e) => setPatient({ ...patient, painArea: e.target.value })}
  />

  {/* Pain Duration */}
  <input
    type="text"
    placeholder="Pain Duration (e.g. 2 weeks, 3 months) *"
    className="px-6 py-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-green-500 focus:border-transparent transition"
    value={patient.painDuration}
    onChange={(e) => setPatient({ ...patient, painDuration: e.target.value })}
  />
            </div>
          </div>

          {/* Address Details */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Address Details
            </h3>
            <AddressForm address={address} setAddress={setAddress} />
          </div>

          {/* Location (GPS) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your Location (GPS)
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Go outdoors for accurate GPS detection (≤100 m)
            </p>

            <button
              onClick={startLocationWatch}
              disabled={locationStatus === "fetching"}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-2xl font-bold text-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all duration-300"
            >
              {locationStatus === "fetching" ? "Fetching Location..." : "Start Location Tracking"}
            </button>

            {locationState && (
              <div className={`mt-6 p-6 rounded-2xl shadow-md ${locationState.accuracy <= 100 ? "bg-green-50 dark:bg-green-900/30 border-2 border-green-500" : "bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-500"}`}>
                <p className="text-lg font-bold">
                  {locationState.accuracy <= 100 ? "✅ Excellent Accuracy" : "⚠️ Improve Accuracy"}
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  Accuracy: <span className="font-semibold">{locationState.accuracy}m</span> | 
                  Lat: {locationState.lat.toFixed(6)} | Lng: {locationState.lng.toFixed(6)}
                </p>
                {locationState.accuracy > 100 && (
                  <p className="mt-3 text-sm text-orange-600 dark:text-orange-400">
                    Tip: Go outdoors or near a window for better signal
                  </p>
                )}
              </div>
            )}

            {locationError && (
              <div className="mt-6 p-6 rounded-2xl bg-red-50 dark:bg-red-900/30 border-2 border-red-500 shadow-md">
                <p className="text-lg font-bold text-red-700 dark:text-red-300">❌ {locationError}</p>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-400">
                  Fix: Enable location in browser settings & use High Accuracy mode on phone
                </p>
              </div>
            )}
          </div>

          {/* Preview Button */}
          {locationStatus === "good" && selectedSlot && (
            <button
              onClick={goToPreview}
              disabled={previewLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-6 rounded-2xl font-bold text-2xl shadow-2xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {previewLoading ? "Calculating Charges..." : "View Preview & Charges"}
            </button>
          )}

          {!selectedSlot && locationStatus === "good" && (
            <div className="text-center py-8">
              <p className="text-xl text-orange-600 dark:text-orange-400 font-semibold">
                Please select a time slot before proceeding
              </p>
            </div>
          )}

          {previewError && (
            <div className="mt-8 p-6 rounded-2xl bg-red-50 dark:bg-red-900/30 border-2 border-red-500 text-center shadow-md">
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{previewError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}