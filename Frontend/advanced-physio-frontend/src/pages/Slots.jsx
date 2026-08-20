import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { getAuth } from "firebase/auth";

/* ================= DATE HELPERS ================= */

const getLocalDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isToday = (dateStr) => {
  const now = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return (
    now.getFullYear() === y &&
    now.getMonth() + 1 === m &&
    now.getDate() === d
  );
};

const isFriday = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getDay() === 5; // 5 = Friday
};

/* ================= CLINIC RULES ================= */

const OPEN = 9 * 60;
const BREAK_START = 14 * 60;
const BREAK_END = 16 * 60;
const CLOSE = 19 * 60;

const SESSION_DURATION = 45;
const BUFFER_TIME = 10;

const toMinutes = (date) =>
  date.getHours() * 60 + date.getMinutes();

const isClinicOpenForSlot = (start, end) => {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);

  if (startMin < OPEN) return false;
  if (endMin > CLOSE) return false;
  if (startMin < BREAK_END && endMin > BREAK_START) return false;

  return true;
};

/* ================= OVERLAP SANITIZER ================= */

const sanitizeSlots = (slots) => {
  const sorted = [...slots].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime)
  );

  const cleaned = [];
  let lastEnd = null;

  for (const slot of sorted) {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);

    if (
      lastEnd &&
      start < new Date(lastEnd.getTime() + BUFFER_TIME * 60000)
    ) {
      continue;
    }

    cleaned.push(slot);
    lastEnd = end;
  }

  return cleaned;
};

export default function Slots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [params] = useSearchParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const visitType = params.get("visitType")?.toUpperCase();
  const [date, setDate] = useState(getLocalDate());

  /* ================= FETCH (FIXED FOR MOBILE) ================= */
  useEffect(() => {
    if (!visitType || !date) return;

    api
      .get(`/slots?date=${date}&visitType=${visitType}&_=${Date.now()}`)
      .then((res) => {
        setSlots(sanitizeSlots(res.data || []));
        setLoading(false);
      })
      .catch(() => {
        setSlots([]);
        setLoading(false);
      });
  }, [visitType, date]);

  /* ================= LOCK ================= */
  const lockSlot = async (slot) => {
    if (slot.status !== "AVAILABLE") return;

    const user = auth.currentUser;
    if (!user) {
      navigate(
        `/login?redirect=/slots?visitType=${visitType}&date=${date}&slotId=${slot._id}`
      );
      return;
    }

    try {
      await api.post(`/slots/${slot._id}/lock`);

      if (visitType === "HOME") {
        // For HOME: Go to HomeVisit page with selected slot
        navigate("/home-visit", {
          state: { selectedSlot: slot },
        });
      } else {
        // For CLINIC: Old flow
        navigate(
          `/patient-details?slotId=${slot._id}&visitType=${visitType}`
        );
      }
    } catch {
      alert("Slot no longer available");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-6 py-10">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Available Slots
          <span className="ml-2 text-green-600 dark:text-green-400">
            ({visitType})
          </span>
        </h2>

        {/* DATE PICKER */}
        <input
          type="date"
          value={date}
          min={getLocalDate()}
          inputMode="numeric"
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700
                     bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto">
        {loading && <p className="text-center text-gray-600 dark:text-gray-400">Loading slots…</p>}

        {/* Friday Off Message */}
        {!loading && isFriday(date) && (
          <div className="text-center py-20">
            <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
              Clinic is closed on Fridays
            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Please select another date
            </p>
          </div>
        )}

        {!loading && !isFriday(date) && slots.length === 0 && (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No slots available for this date
          </p>
        )}

        {!loading && !isFriday(date) && slots.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => {
              const start = new Date(Date.parse(slot.startTime));
              const end = new Date(Date.parse(slot.endTime));

              if (!isClinicOpenForSlot(start, end)) return null;

              const isPast = (() => {
                if (!isToday(date)) return false;

                const now = new Date();
                const slotDate = new Date(start);

                return slotDate.getTime() <= now.getTime();
              })();

              const isAvailable =
                slot.status === "AVAILABLE" && !isPast;

              let statusText = "";
              let statusClass = "";

              if (isPast) {
                statusText = "Time Passed";
                statusClass = "bg-gray-200 text-gray-700";
              } else if (slot.status === "BOOKED") {
                statusText = "Booked";
                statusClass = "bg-red-100 text-red-600";
              } else if (slot.status === "LOCKED") {
                statusText = "In Progress";
                statusClass = "bg-yellow-100 text-yellow-700";
              }

              return (
                <div
                  key={slot._id}
                  className={`rounded-2xl p-6 bg-white dark:bg-slate-800 border shadow
                    transition-all duration-200 ease-out
                    hover:-translate-y-[2px] hover:shadow-lg
                    ${!isAvailable && "opacity-70"}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {start.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}{" "}
                      –{" "}
                      {end.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>

                    {statusText && (
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${statusClass}`}
                      >
                        {statusText}
                      </span>
                    )}
                  </div>

                  <button
                    disabled={!isAvailable}
                    onClick={() => lockSlot(slot)}
                    className={`mt-6 w-full py-3 rounded-xl font-semibold ${
                      isAvailable
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {isAvailable ? "Book Slot" : "Unavailable"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}