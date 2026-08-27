// src/pages/Profile.js (Updated: Home Visits Show Receipt Download + Enhanced Details)
import { useEffect, useState } from "react";
import api from "../api/api";

export default function Profile() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/bookings/my")
      .then((res) => setBookings(res.data))
      .catch((err) => {
        console.error("Failed to fetch bookings:", err);
        alert("Failed to load appointments");
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper to normalize pdfUrl → root-relative path
 const getPdfUrl = (pdfUrlFromServer) => {
  if (!pdfUrlFromServer) return null;

  // Already an absolute URL
  if (
    pdfUrlFromServer.startsWith("http://") ||
    pdfUrlFromServer.startsWith("https://")
  ) {
    return pdfUrlFromServer;
  }

  let normalized = pdfUrlFromServer.replace(/^\/+/, "");

  if (!normalized.startsWith("uploads/receipts/")) {
    normalized = `uploads/receipts/${normalized}`;
  }

  const backendUrl =
    import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

  return `${backendUrl}/${normalized}`;
};

  // Helper to extract filename
  const getPdfFilename = (pdfUrlFromServer) => {
    if (!pdfUrlFromServer) return "receipt.pdf";
    const parts = pdfUrlFromServer.split("/");
    let filename = parts[parts.length - 1];
    if (!filename.endsWith(".pdf")) {
      filename += ".pdf";
    }
    return filename;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-gray-600 dark:text-gray-400 text-lg animate-pulse">
          Loading appointments…
        </p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            No bookings yet
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Your appointments will appear here once booked.
          </p>
        </div>
      </div>
    );
  }

  // Sort: upcoming first, then past
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = a.slotId?.startTime ? new Date(a.slotId.startTime) : new Date(a.createdAt || 0);
    const dateB = b.slotId?.startTime ? new Date(b.slotId.startTime) : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-4 sm:px-6 py-8">
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          My Appointments
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View your past and upcoming appointments
        </p>
      </div>

      {/* BOOKINGS LIST */}
      <div className="max-w-5xl mx-auto space-y-6">
        {sortedBookings.map((b) => {
          const pdfUrl = getPdfUrl(b.pdfUrl);
          const pdfFilename = getPdfFilename(b.pdfUrl);

          const appointmentDate = b.slotId?.startTime ? new Date(b.slotId.startTime) : null;
          const isUpcoming = appointmentDate ? appointmentDate > new Date() : false;

          const isHomeVisit = b.visitType === "HOME";

          return (
            <div
              key={b._id}
              className={`
                rounded-2xl bg-white dark:bg-slate-800
                border ${isUpcoming ? "border-green-500" : "border-gray-200 dark:border-slate-700"}
                shadow-lg p-6 transition-all hover:shadow-xl
              `}
            >
              {/* STATUS BADGE */}
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`
                    inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold
                    ${isUpcoming 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" 
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300"}
                  `}
                >
                  {isUpcoming ? "Upcoming" : "Completed"} • {b.bookingStatus}
                </span>
              </div>

              {/* PATIENT INFO */}
              <div className="mb-4">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {b.patientName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {b.phone}
                </p>
              </div>

              {/* HOME VISIT EXTRA DETAILS (Enhanced) */}
              {isHomeVisit && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-5 mb-5 border border-purple-200 dark:border-purple-700">
                  <p className="font-bold text-purple-800 dark:text-purple-200 mb-3 text-lg">
                    Home Visit Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <p><span className="font-medium">Distance:</span> {b.distanceKm?.toFixed(1) || "N/A"} km</p>
                    <p><span className="font-medium">Total Paid:</span> ₹{b.totalAmount || b.amount || "N/A"}</p>
                    <p><span className="font-medium">Base Charge (first 4 km):</span> ₹500</p>
                    <p><span className="font-medium">Extra Charge:</span> ₹{b.totalAmount ? (b.totalAmount - 500) : "N/A"}</p>
                  </div>
                  {b.address && (
                    <p className="mt-4 text-sm">
                      <span className="font-medium">Address:</span> 
                      {b.address.house}, {b.address.area}, {b.address.city} - {b.address.pincode}
                    </p>
                  )}
                </div>
              )}

              {/* DETAILS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300 mb-6">
                <p>
                  <span className="font-medium">Visit Type:</span> {b.visitType || "CLINIC"}
                </p>
                <p>
                  <span className="font-medium">Pain Area:</span> {b.painArea} ({b.painDuration})
                </p>
                <p>
                  <span className="font-medium">Appointment Date:</span>{" "}
                  {appointmentDate
                    ? appointmentDate.toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Flexible (Home Visit)"}
                </p>
                <p>
                  <span className="font-medium">Time:</span>{" "}
                  {b.slotId
                    ? `${new Date(b.slotId.startTime).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }).toLowerCase()} – ${new Date(b.slotId.endTime).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }).toLowerCase()}`
                    : "Flexible (Home Visit)"}
                </p>
              </div>

              {/* RECEIPT DOWNLOAD BUTTON (Now Guaranteed for Home Visits Too) */}
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  download={pdfFilename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold
                    bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-md
                  "
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Receipt ({pdfFilename})
                </a>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Receipt will be available shortly after booking confirmation
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
