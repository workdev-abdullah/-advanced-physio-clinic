import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const MAX_ATTEMPTS = 30;
const POLL_INTERVAL = 1500;

export default function Success() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const orderId = params.get("orderId");

  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState(
    "Payment successful. Preparing your receipt..."
  );

  const attemptsRef = useRef(0);
  const downloadedRef = useRef(false);

  // ==================================================
  // BUILD BACKEND PDF URL
  // ==================================================

  const getPdfUrl = (pdfUrl) => {
    if (!pdfUrl) return null;

    // Already absolute
    if (
      pdfUrl.startsWith("http://") ||
      pdfUrl.startsWith("https://")
    ) {
      return pdfUrl;
    }

    const normalized = pdfUrl.replace(/^\/+/, "");

    const backendBaseUrl =
      import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:5000";

    return `${backendBaseUrl}/${normalized}`;
  };

  // ==================================================
  // DOWNLOAD PDF
  // ==================================================

  const downloadReceipt = async (pdfUrl) => {
    if (downloadedRef.current) return;

    try {
      downloadedRef.current = true;

      setStatus("downloading");
      setMessage("Receipt is ready. Downloading...");

      const finalUrl = getPdfUrl(pdfUrl);

      if (!finalUrl) {
        throw new Error("Receipt URL missing");
      }

      console.log("📄 Receipt URL:", finalUrl);

      // Fetch PDF as blob so cross-origin download works reliably
      const response = await fetch(finalUrl);

      if (!response.ok) {
        throw new Error(
          `Receipt download failed: ${response.status}`
        );
      }

      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const filename = `receipt-${orderId || Date.now()}.pdf`;

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 3000);

      console.log("✅ Receipt downloaded");

      setStatus("success");
      setMessage("Receipt downloaded successfully.");
    } catch (error) {
      console.error("❌ Receipt download error:", error);

      downloadedRef.current = false;

      setStatus("error");
      setMessage(
        "Receipt is ready, but automatic download failed. Please open it below."
      );
    }
  };

  // ==================================================
  // CHECK RECEIPT STATUS
  // ==================================================

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setMessage("Order ID is missing.");
      return;
    }

    let cancelled = false;
    let timer = null;

    const checkReceipt = async () => {
      try {
        console.log(
          `🔎 Checking receipt (${attemptsRef.current + 1}/${MAX_ATTEMPTS})`
        );

        const response = await api.get(
          `/payment/receipt-status/${orderId}`
        );

        if (cancelled) return;

        const data = response.data;

        console.log("📄 Receipt status:", data);

        if (data?.ready && data?.pdfUrl) {
          await downloadReceipt(data.pdfUrl);
          return;
        }

        attemptsRef.current += 1;

        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setStatus("timeout");
          setMessage(
            "Your booking is confirmed, but the receipt is taking longer than expected."
          );
          return;
        }

        timer = setTimeout(checkReceipt, POLL_INTERVAL);
      } catch (error) {
        console.error(
          "Receipt status check failed:",
          error
        );

        attemptsRef.current += 1;

        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setStatus("error");
          setMessage(
            "Booking is successful, but we could not retrieve the receipt yet."
          );
          return;
        }

        timer = setTimeout(checkReceipt, POLL_INTERVAL);
      }
    };

    checkReceipt();

    return () => {
      cancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [orderId]);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">

        {status === "checking" && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Successful
            </h1>

            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>

            <p className="text-xs text-gray-400 mt-4">
              Please wait while we generate your receipt...
            </p>
          </>
        )}

        {status === "downloading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Receipt Ready
            </h1>

            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-3xl">
              ✅
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Booking Confirmed
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            <button
              onClick={() => navigate("/profile")}
              className="
                w-full py-3 rounded-xl
                bg-green-600 text-white font-semibold
                hover:bg-green-700 transition
              "
            >
              Go to My Profile
            </button>
          </>
        )}

        {status === "timeout" && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-3xl">
              ⏳
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Booking Confirmed
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            <button
              onClick={() => navigate("/profile")}
              className="
                w-full py-3 rounded-xl
                bg-blue-600 text-white font-semibold
                hover:bg-blue-700 transition
              "
            >
              View My Booking & Receipt
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-3xl">
              ⚠️
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Booking Completed
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            <button
              onClick={() => navigate("/profile")}
              className="
                w-full py-3 rounded-xl
                bg-blue-600 text-white font-semibold
                hover:bg-blue-700 transition
              "
            >
              Go to My Profile
            </button>
          </>
        )}

        <p className="text-xs text-gray-400 mt-6 break-all">
          Order ID: {orderId || "N/A"}
        </p>
      </div>
    </div>
  );
}