import { useEffect, useState, useCallback } from "react";
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

  return date.getDay() === 5; // Friday
};

/* ================= CLINIC RULES ================= */

const OPEN = 9 * 60;
const BREAK_START = 14 * 60;
const BREAK_END = 16 * 60;
const CLOSE = 19 * 60;

const SESSION_DURATION = 45;
const BUFFER_TIME = 10;

const toMinutes = (date) => {
  return date.getHours() * 60 + date.getMinutes();
};

const isClinicOpenForSlot = (start, end) => {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);

  if (startMin < OPEN) return false;

  if (endMin > CLOSE) return false;

  // Break: 2 PM - 4 PM
  if (
    startMin < BREAK_END &&
    endMin > BREAK_START
  ) {
    return false;
  }

  return true;
};

/* ================= OVERLAP SANITIZER ================= */

const sanitizeSlots = (slots) => {
  const sorted = [...slots].sort(
    (a, b) =>
      new Date(a.startTime) -
      new Date(b.startTime)
  );

  const cleaned = [];

  let lastEnd = null;

  for (const slot of sorted) {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);

    if (
      lastEnd &&
      start <
        new Date(
          lastEnd.getTime() +
            BUFFER_TIME * 60 * 1000
        )
    ) {
      continue;
    }

    cleaned.push(slot);

    lastEnd = end;
  }

  return cleaned;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Slots() {
  const [slots, setSlots] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [retrying, setRetrying] = useState(false);

  const [params] = useSearchParams();

  const navigate = useNavigate();

  const auth = getAuth();

  const visitType = params
    .get("visitType")
    ?.toUpperCase();

  const [date, setDate] =
    useState(getLocalDate());

  /* =======================================================
     FETCH SLOTS
  ======================================================= */

  const fetchSlots = useCallback(
    async (attempt = 1) => {
      // -----------------------------------------------
      // Basic validation
      // -----------------------------------------------

      if (!visitType || !date) {
        setSlots([]);

        setError(
          "Invalid slot request."
        );

        setLoading(false);

        setRetrying(false);

        return;
      }

      // -----------------------------------------------
      // Friday is completely closed
      // No backend request required
      // -----------------------------------------------

      if (isFriday(date)) {
        setSlots([]);

        setError("");

        setLoading(false);

        setRetrying(false);

        return;
      }

      try {
        setLoading(true);

        setError("");

        if (attempt > 1) {
          setRetrying(true);
        }

        console.log(
          `🔄 Fetching slots - attempt ${attempt}/3`
        );

        const response = await api.get(
          `/slots?date=${date}&visitType=${visitType}&_=${Date.now()}`
        );

        const receivedSlots =
          Array.isArray(response.data)
            ? response.data
            : [];

        const cleanedSlots =
          sanitizeSlots(receivedSlots);

        setSlots(cleanedSlots);

        setLoading(false);

        setRetrying(false);

        setError("");

        console.log(
          `✅ Slots loaded: ${cleanedSlots.length}`
        );
      } catch (err) {
        console.error(
          `❌ Failed to load slots - attempt ${attempt}:`,
          err
        );

        // ---------------------------------------------
        // Automatic retry
        // ---------------------------------------------

        if (attempt < 3) {
          setRetrying(true);

          setTimeout(() => {
            fetchSlots(attempt + 1);
          }, 3000);

          return;
        }

        // ---------------------------------------------
        // All retries failed
        // ---------------------------------------------

        setSlots([]);

        setLoading(false);

        setRetrying(false);

        if (
          err?.code ===
          "ECONNABORTED"
        ) {
          setError(
            "The server is taking too long to respond. Please try again."
          );
        } else if (
          err?.code === "ERR_NETWORK"
        ) {
          setError(
            "Unable to connect to the server. Please try again."
          );
        } else if (
          err?.response?.status >= 500
        ) {
          setError(
            "The server is temporarily unavailable. Please try again."
          );
        } else {
          setError(
            "Unable to load slots. Please try again."
          );
        }
      }
    },
    [visitType, date]
  );

  /* =======================================================
     FETCH WHEN DATE / VISIT TYPE CHANGES
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;

      await fetchSlots();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchSlots]);

  /* =======================================================
     LOCK SLOT
  ======================================================= */

  const lockSlot = async (slot) => {
    if (
      slot.status !== "AVAILABLE"
    ) {
      return;
    }

    const user = auth.currentUser;

    // -----------------------------------------------
    // User not logged in
    // -----------------------------------------------

    if (!user) {
      navigate(
        `/login?redirect=/slots?visitType=${encodeURIComponent(
          visitType
        )}&date=${encodeURIComponent(
          date
        )}&slotId=${encodeURIComponent(
          slot._id
        )}`
      );

      return;
    }

    try {
      // ---------------------------------------------
      // Lock slot
      // ---------------------------------------------

      await api.post(
        `/slots/${slot._id}/lock`
      );

      // ---------------------------------------------
      // HOME VISIT
      // ---------------------------------------------

      if (visitType === "HOME") {
        navigate("/home-visit", {
          state: {
            selectedSlot: slot,
          },
        });

        return;
      }

      // ---------------------------------------------
      // CLINIC
      // ---------------------------------------------

      navigate(
        `/patient-details?slotId=${encodeURIComponent(
          slot._id
        )}&visitType=${encodeURIComponent(
          visitType
        )}`
      );
    } catch (err) {
      console.error(
        "❌ Slot lock failed:",
        err
      );

      alert(
        err?.response?.data?.message ||
          "Slot is no longer available."
      );

      // Refresh slot status
      fetchSlots();
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-6 py-10">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Available Slots

          <span className="ml-2 text-green-600 dark:text-green-400">
            ({visitType || "UNKNOWN"})
          </span>
        </h2>

        {/* DATE PICKER */}

        <input
          type="date"
          value={date}
          min={getLocalDate()}
          inputMode="numeric"
          onChange={(e) =>
            setDate(e.target.value)
          }
          className="
            px-4 py-2 rounded-lg
            border border-gray-300
            dark:border-slate-700
            bg-white dark:bg-slate-800
            text-gray-800 dark:text-gray-200
            focus:outline-none
            focus:ring-2
            focus:ring-green-500
          "
        />
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="max-w-7xl mx-auto">

        {/* -----------------------------------------------
            LOADING
        ----------------------------------------------- */}

        {loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3">

              <div
                className="
                  w-6 h-6
                  border-4
                  border-green-500
                  border-t-transparent
                  rounded-full
                  animate-spin
                "
              />

              <p className="text-gray-600 dark:text-gray-400">
                {retrying
                  ? "Server is waking up, retrying..."
                  : "Loading slots..."}
              </p>
            </div>

            {retrying && (
              <p className="text-xs text-gray-400 mt-3">
                Please wait a moment...
              </p>
            )}
          </div>
        )}

        {/* -----------------------------------------------
            ERROR
        ----------------------------------------------- */}

        {!loading && error && (
          <div className="text-center py-20">

            <div
              className="
                inline-flex items-center
                justify-center
                w-16 h-16
                rounded-full
                bg-red-100
                dark:bg-red-900/30
                text-red-600
                dark:text-red-400
                text-2xl
                mb-5
              "
            >
              ⚠️
            </div>

            <p className="text-xl font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>

            <button
              onClick={() =>
                fetchSlots()
              }
              className="
                mt-5
                px-6 py-3
                rounded-xl
                bg-green-600
                text-white
                font-semibold
                hover:bg-green-700
                transition
              "
            >
              Try Again
            </button>
          </div>
        )}

        {/* -----------------------------------------------
            FRIDAY CLOSED
        ----------------------------------------------- */}

        {!loading &&
          !error &&
          isFriday(date) && (
            <div className="text-center py-20">

              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                Clinic is closed on Fridays
              </p>

              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Please select another date
              </p>
            </div>
          )}

        {/* -----------------------------------------------
            NO SLOTS
        ----------------------------------------------- */}

        {!loading &&
          !error &&
          !isFriday(date) &&
          slots.length === 0 && (
            <div className="text-center py-20">

              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                No slots available for this date
              </p>

              <button
                onClick={() =>
                  fetchSlots()
                }
                className="
                  mt-5
                  px-6 py-3
                  rounded-xl
                  bg-green-600
                  text-white
                  font-semibold
                  hover:bg-green-700
                  transition
                "
              >
                Refresh Slots
              </button>
            </div>
          )}

        {/* -----------------------------------------------
            SLOTS
        ----------------------------------------------- */}

        {!loading &&
          !error &&
          !isFriday(date) &&
          slots.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {slots.map((slot) => {
                const start = new Date(
                  Date.parse(
                    slot.startTime
                  )
                );

                const end = new Date(
                  Date.parse(
                    slot.endTime
                  )
                );

                // -----------------------------------------
                // Clinic opening / closing rules
                // -----------------------------------------

                if (
                  !isClinicOpenForSlot(
                    start,
                    end
                  )
                ) {
                  return null;
                }

                // -----------------------------------------
                // Past slot
                // -----------------------------------------

                const isPast = (() => {
                  if (!isToday(date)) {
                    return false;
                  }

                  const now =
                    new Date();

                  return (
                    start.getTime() <=
                    now.getTime()
                  );
                })();

                // -----------------------------------------
                // Availability
                // -----------------------------------------

                const isAvailable =
                  slot.status ===
                    "AVAILABLE" &&
                  !isPast;

                // -----------------------------------------
                // Status
                // -----------------------------------------

                let statusText = "";

                let statusClass = "";

                if (isPast) {
                  statusText =
                    "Time Passed";

                  statusClass =
                    "bg-gray-200 text-gray-700";
                } else if (
                  slot.status ===
                  "BOOKED"
                ) {
                  statusText =
                    "Booked";

                  statusClass =
                    "bg-red-100 text-red-600";
                } else if (
                  slot.status ===
                  "LOCKED"
                ) {
                  statusText =
                    "In Progress";

                  statusClass =
                    "bg-yellow-100 text-yellow-700";
                }

                return (
                  <div
                    key={slot._id}
                    className={`
                      rounded-2xl
                      p-6
                      bg-white
                      dark:bg-slate-800
                      border
                      shadow
                      transition-all
                      duration-200
                      ease-out
                      hover:-translate-y-[2px]
                      hover:shadow-lg
                      ${
                        !isAvailable
                          ? "opacity-70"
                          : ""
                      }
                    `}
                  >
                    {/* TIME + STATUS */}

                    <div className="flex items-center justify-between gap-3">

                      <p className="text-lg font-semibold text-gray-900 dark:text-white">

                        {start.toLocaleTimeString(
                          "en-IN",
                          {
                            timeZone:
                              "Asia/Kolkata",
                            hour: "2-digit",
                            minute:
                              "2-digit",
                            hour12: true,
                          }
                        )}

                        {" – "}

                        {end.toLocaleTimeString(
                          "en-IN",
                          {
                            timeZone:
                              "Asia/Kolkata",
                            hour: "2-digit",
                            minute:
                              "2-digit",
                            hour12: true,
                          }
                        )}

                      </p>

                      {statusText && (
                        <span
                          className={`
                            text-xs
                            font-semibold
                            px-3 py-1
                            rounded-full
                            ${statusClass}
                          `}
                        >
                          {statusText}
                        </span>
                      )}
                    </div>

                    {/* BOOK BUTTON */}

                    <button
                      disabled={
                        !isAvailable
                      }
                      onClick={() =>
                        lockSlot(slot)
                      }
                      className={`
                        mt-6
                        w-full
                        py-3
                        rounded-xl
                        font-semibold
                        transition
                        ${
                          isAvailable
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }
                      `}
                    >
                      {isAvailable
                        ? "Book Slot"
                        : "Unavailable"}
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