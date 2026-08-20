// backend/utils/distance.js

const toRad = (value) => (value * Math.PI) / 180;

/**
 * EXISTING FUNCTION (KEEP AS IS IF ALREADY PRESENT)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 🔐 FINAL DISTANCE DECISION (DO NOT CHANGE LATER)
 * Used ONLY for HOME VISIT
 */
export function calculateFinalDistance({
  clinicLat,
  clinicLng,
  userLat,
  userLng,
  accuracy,
}) {
  const baseDistance = calculateDistance(
    clinicLat,
    clinicLng,
    userLat,
    userLng
  );

  // 🚨 Accuracy check (Ola / Blinkit rule)
  if (!accuracy || accuracy > 1000) {
    throw new Error(
      "Location accuracy is low. Please turn on GPS and try again."
    );
  }

  // Accuracy buffer (protect doctor)
  const accuracyKm = Math.min(accuracy / 1000, 1.5);

  // 🔐 FINAL DISTANCE (rounded UP)
  const finalDistance = Math.ceil(baseDistance + accuracyKm);

  return {
    baseDistance: Number(baseDistance.toFixed(2)),
    accuracyKm: Number(accuracyKm.toFixed(2)),
    finalDistance,
  };
}
