import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/api";

export default function Success() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");

  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error" | "timeout"
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [actualPdfFilename, setActualPdfFilename] = useState("receipt.pdf");
  const [bookingDetails, setBookingDetails] = useState(null); // Extra home visit info

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    console.log("SUCCESS PAGE orderId =", orderId);

    let pollCount = 0;
    const maxPolls = 30; // ~60 seconds max wait

    let interval;
    const pollReceipt = async () => {
      pollCount++;
      try {
        const res = await api.get(`/bookings/receipt/${orderId}`);

        if (res.data.ready && res.data.pdfUrl) {
          let serverPdfPath = res.data.pdfUrl;
          serverPdfPath = serverPdfPath.replace(/\.html$/i, "");

          let filename = serverPdfPath.split("/").pop();
          if (!filename.endsWith(".pdf")) {
            filename += ".pdf";
          }

          setActualPdfFilename(filename);

          const fetchPath = serverPdfPath.startsWith("/") ? serverPdfPath : `/${serverPdfPath}`;
          const pdfResponse = await fetch(fetchPath);

          if (pdfResponse.ok) {
            const blob = await pdfResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            setPdfBlobUrl(blobUrl);
          }

          // NEW: Capture extra home visit details if provided by backend
          if (res.data.bookingDetails) {
            setBookingDetails(res.data.bookingDetails);
          }

          setStatus("ready");
          if (interval) clearInterval(interval);
        } else if (pollCount >= maxPolls) {
          setStatus("timeout");
          if (interval) clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling/fetch error:", err);
        if (pollCount >= maxPolls) {
          setStatus("timeout");
          if (interval) clearInterval(interval);
        }
      }
    };

    interval = setInterval(pollReceipt, 2000);
    pollReceipt(); // Immediate first check

    return () => {
      if (interval) clearInterval(interval);
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [orderId, pdfBlobUrl]);

  const handleDownload = () => {
    if (!pdfBlobUrl) return;

    const link = document.createElement("a");
    link.href = pdfBlobUrl;
    link.download = actualPdfFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!orderId || status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-xl font-semibold">
        Order not found or error occurred
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <h2 className="text-3xl font-bold text-green-700 mb-6">
        Appointment Confirmed ✅
      </h2>

      <p className="text-lg text-gray-700 mb-8 text-center">
        Your physiotherapy appointment has been successfully booked.
      </p>

      {status === "loading" && (
        <p className="text-gray-600 animate-pulse text-xl">Preparing your receipt… (this may take 5-10 seconds)</p>
      )}

      {status === "timeout" && (
        <p className="text-orange-600 text-lg text-center max-w-md">
          Receipt is taking longer than expected. Please check your Profile page in a few minutes.
        </p>
      )}

      {status === "ready" && pdfBlobUrl && (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
          {/* NEW: Home Visit Extra Details */}
          {bookingDetails && bookingDetails.visitType === "HOME" && (
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-6 w-full shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-purple-800 dark:text-purple-200">
                Home Visit Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg">
                <p><span className="font-medium">Distance from Clinic:</span> {bookingDetails.distanceKm?.toFixed(1) || "N/A"} km</p>
                <p><span className="font-medium">Base Charge (first 4 km):</span> ₹500</p>
                <p><span className="font-medium">Extra Km Charge:</span> ₹20 per km</p>
                <p><span className="font-medium">Total Amount Paid:</span> ₹{bookingDetails.totalAmount || "N/A"}</p>
              </div>
              {bookingDetails.address && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Address: {bookingDetails.address.house}, {bookingDetails.address.area}, {bookingDetails.address.city} - {bookingDetails.address.pincode}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleDownload}
            className="bg-green-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-green-700 transition text-lg shadow-xl"
          >
            Download Receipt ({actualPdfFilename})
          </button>

          <div className="w-full">
            <p className="text-lg font-semibold text-gray-700 mb-4 text-center">Receipt Preview:</p>
            <embed
              src={pdfBlobUrl}
              type="application/pdf"
              width="100%"
              height="800px"
              className="border-4 border-green-200 rounded-xl shadow-2xl"
            />
            <p className="text-sm text-gray-500 mt-4 text-center">
              Scroll to view full receipt. If preview is blank, try the download button.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}