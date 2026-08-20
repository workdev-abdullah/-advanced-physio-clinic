import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({
    totalBookings: 0,
    totalIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  // 🔍 Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [visitTypeFilter, setVisitTypeFilter] = useState("ALL"); // ALL | CLINIC | HOME
const formatHomeVisitTime = (visitTime) => {
  if (!visitTime || !visitTime.includes("|")) {
    return {
      date: "Flexible",
      time: "Flexible (Home Visit)",
    };
  }

  const [startISO, endISO] = visitTime.split("|");

  const start = new Date(startISO);
  const end = new Date(endISO);

  // ✅ Force IST
  const date = start.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = `${start.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })} – ${end.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;

  return { date, time };
};


  const loadData = async () => {
    try {
      const [summaryRes, bookingsRes] = await Promise.all([
        api.get("/admin/summary"),
        api.get("/admin/bookings"),
      ]);

      setSummary(summaryRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error("Load data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= NORMALIZATION HELPER ================= */
  const normalizeVisitType = (type) => {
    if (!type) return "";
    return type
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ")
      .replace("VISIT", "")
      .trim();
  };

  /* ================= CLIENT-SIDE SUMMARY STATS (Clinic vs Home) ================= */
  const stats = useMemo(() => {
    const clinicBookings = bookings.filter(
      (b) => normalizeVisitType(b.visitType) === "CLINIC"
    );
    const homeBookings = bookings.filter(
      (b) => normalizeVisitType(b.visitType) === "HOME"
    );

    const clinicIncome = clinicBookings.reduce(
      (sum, b) => sum + (b.totalAmount || b.amount || 0),
      0
    );
    const homeIncome = homeBookings.reduce(
      (sum, b) => sum + (b.totalAmount || b.amount || 0),
      0
    );

    return {
      clinicCount: clinicBookings.length,
      homeCount: homeBookings.length,
      clinicIncome,
      homeIncome,
    };
  }, [bookings]);

  /* ================= FILTER LOGIC ================= */
  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter((b) => {
      const matchesSearch =
        (b.patientName || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.phone || "").includes(search);

      const normalizedType = normalizeVisitType(b.visitType);
      const matchesVisitType =
        visitTypeFilter === "ALL" ||
        normalizedType === visitTypeFilter;

      // Use slot time if available (clinic), fallback to createdAt (home)
     const dateSource =
  b.slotId?.startTime ||
  b.appointmentDate ||
  b.createdAt;

      if (!dateSource) return false;

      const bookingDate = new Date(dateSource);

      const afterFrom = !fromDate || bookingDate >= new Date(fromDate);
      const beforeTo =
        !toDate ||
        bookingDate <= new Date(new Date(toDate).setHours(23, 59, 59));

      return matchesSearch && matchesVisitType && afterFrom && beforeTo;
    });

    // Sort newest first
    filtered.sort((a, b) => {
      const dateA = a.slotId?.startTime ? a.slotId.startTime : a.createdAt;
      const dateB = b.slotId?.startTime ? b.slotId.startTime : b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return filtered;
  }, [bookings, search, fromDate, toDate, visitTypeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Loading admin dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-4 sm:px-6 py-8">
      {/* ================= HEADER ================= */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Bookings, revenue & appointment management
        </p>
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Bookings
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {summary.totalBookings}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Income
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            ₹{summary.totalIncome}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-blue-400 dark:border-blue-600 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Clinic Bookings
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.clinicCount}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ₹{stats.clinicIncome}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-orange-400 dark:border-orange-600 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Home Visit Bookings
          </p>
          <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
            {stats.homeCount}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ₹{stats.homeIncome}
          </p>
        </div>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search by patient or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />

          <select
            value={visitTypeFilter}
            onChange={(e) => setVisitTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="ALL">All Visits</option>
            <option value="CLINIC">Clinic Only</option>
            <option value="HOME">Home Visit Only</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />

          <button
            onClick={() => {
              setSearch("");
              setFromDate("");
              setToDate("");
              setVisitTypeFilter("ALL");
            }}
            className="px-4 py-2 rounded-xl font-semibold bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* ================= BOOKINGS LIST ================= */}
      <div className="max-w-7xl mx-auto space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            No bookings match your filters.
          </div>
        ) : (
          filteredBookings.map((b) => {
            const hasSlot = !!b.slotId;
            const startTime = hasSlot && b.slotId?.startTime ? new Date(b.slotId.startTime) : null;
            const endTime = hasSlot && b.slotId?.endTime ? new Date(b.slotId.endTime) : null;

            const addressSummary = b.address
              ? [b.address.house, b.address.area, b.address.city, b.address.pincode]
                  .filter(Boolean)
                  .join(", ")
              : null;

            const normalizedType = normalizeVisitType(b.visitType);
            const isHomeVisit = normalizedType === "HOME";

            // Fallback date from createdAt if no slot
            const displayDate =  startTime ||
  (b.appointmentDate ? new Date(b.appointmentDate) : new Date(b.createdAt));

            return (
              <div
                key={b._id}
                className={`rounded-2xl bg-white dark:bg-slate-800 border ${
                  isHomeVisit
                    ? "border-orange-400 dark:border-orange-600"
                    : "border-gray-200 dark:border-slate-700"
                } shadow-sm p-5`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {b.patientName || "Unknown Patient"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {b.phone || "No phone"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        isHomeVisit
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      }`}
                    >
                      {b.visitType || "Unknown"} VISIT
                    </span>

                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                      {b.bookingStatus || "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <b>Pain Area:</b>{" "}
                    {b.painArea
                      ? `${b.painArea}${b.painDuration ? ` - ${b.painDuration}` : ""}`
                      : "Not specified"}
                  </p>
                  <p>
                    <b>Amount:</b> ₹{(b.totalAmount || b.amount || 0).toLocaleString("en-IN")}
                  </p>
                  <p>
                   <b>Date:</b>{" "}
{isHomeVisit && b.visitTime
  ? formatHomeVisitTime(b.visitTime).date
  : displayDate.toLocaleDateString("en-IN")}

                  </p>
                  <p>
                  <b>Time:</b>{" "}
{hasSlot && startTime && endTime
  ? `${startTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })} – ${endTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`
  : isHomeVisit && b.visitTime
  ? formatHomeVisitTime(b.visitTime).time
  : "Flexible (Home Visit)"}

                  </p>
                </div>

                {isHomeVisit && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-slate-700 pt-3">
                    <p>
                      <b>Address:</b> {addressSummary || "Not specified"}
                    </p>
                    {b.distanceKm && (
                      <p>
                        <b>Distance:</b> {b.distanceKm.toFixed(1)} km
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}