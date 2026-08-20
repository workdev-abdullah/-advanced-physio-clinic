import moment from "moment-timezone";

const TZ = "Asia/Kolkata";

export const generateSlotsForDate = (date) => {
  const slots = [];

  // ❌ Friday off
  const dayOfWeek = moment.tz(date, "YYYY-MM-DD", TZ).day();
  if (dayOfWeek === 5) return slots;

  const OPEN = "09:00";
  const CLOSE = "19:00";
  const BREAK_START = "14:00";
  const BREAK_END = "16:00";

  let current = moment.tz(`${date} ${OPEN}`, "YYYY-MM-DD HH:mm", TZ);

  const closeTime = moment.tz(`${date} ${CLOSE}`, "YYYY-MM-DD HH:mm", TZ);
  const breakStart = moment.tz(`${date} ${BREAK_START}`, "YYYY-MM-DD HH:mm", TZ);
  const breakEnd = moment.tz(`${date} ${BREAK_END}`, "YYYY-MM-DD HH:mm", TZ);

  while (current.isBefore(closeTime)) {

    // 🔑 HARD BREAK SKIP (THE REAL FIX)
    if (current.isSameOrAfter(breakStart) && current.isBefore(breakEnd)) {
      current = breakEnd.clone(); // exactly 4:00 PM
      continue; // ❗ no slot creation, no +55 carry
    }

    const start = current.clone();
    const end = start.clone().add(45, "minutes");

    // Slot must finish before clinic close
    if (end.isAfter(closeTime)) break;

    slots.push({
      startTime: start.toDate(),
      endTime: end.toDate(),
      status: "AVAILABLE",
    });

    // 45 min treatment + 10 min buffer
    current.add(55, "minutes");
  }

  return slots;
};
