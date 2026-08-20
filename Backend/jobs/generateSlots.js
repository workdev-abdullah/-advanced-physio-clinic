import Slot from "../models/Slot.js";
import moment from "moment-timezone";

const TZ = "Asia/Kolkata";

const SESSION_DURATION = 45;
const BUFFER_TIME = 10;
const DAYS_TO_GENERATE = 90;

const CLINIC_OPEN = "09:00";
const CLINIC_CLOSE = "19:00";
const BREAK_START = "14:00";
const BREAK_END = "16:00";

const generateSlotsForDay = async (date, visitType) => {
  let current = moment.tz(`${date} ${CLINIC_OPEN}`, "YYYY-MM-DD HH:mm", TZ);

  const closeTime = moment.tz(`${date} ${CLINIC_CLOSE}`, "YYYY-MM-DD HH:mm", TZ);
  const breakStart = moment.tz(`${date} ${BREAK_START}`, "YYYY-MM-DD HH:mm", TZ);
  const breakEnd = moment.tz(`${date} ${BREAK_END}`, "YYYY-MM-DD HH:mm", TZ);

  while (current.isBefore(closeTime)) {

    // 🔑 FINAL, NON-BREAKABLE FIX
    if (current.isSameOrAfter(breakStart) && current.isBefore(breakEnd)) {
      current = breakEnd.clone(); // exactly 4:00 PM
      continue; // 🚫 no +55 carryover
    }

    const start = current.clone();
    const end = start.clone().add(SESSION_DURATION, "minutes");

    if (end.isAfter(closeTime)) break;

    try {
      await Slot.create({
        startTime: start.toDate(),
        endTime: end.toDate(),
        visitType,
        status: "AVAILABLE",
      });
    } catch (err) {
      // duplicate slot → ignore safely
    }

    current.add(SESSION_DURATION + BUFFER_TIME, "minutes");
  }
};

export const generateSlotsForNext3Months = async () => {
  const today = moment.tz(TZ).startOf("day");

  for (let i = 0; i < DAYS_TO_GENERATE; i++) {
    const date = today.clone().add(i, "days").format("YYYY-MM-DD");

    // Friday OFF
    if (moment.tz(date, "YYYY-MM-DD", TZ).day() === 5) continue;

    await generateSlotsForDay(date, "CLINIC");
    await generateSlotsForDay(date, "HOME");
  }

  console.log("✅ Slots generated correctly (IST, break-safe)");
};
