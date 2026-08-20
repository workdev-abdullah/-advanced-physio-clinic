export function calculateHomeVisitPrice(distanceKm) {
  const BASE_PRICE = 500;
  const FREE_KM = 4;
  const EXTRA_RATE = 20;

  if (distanceKm <= FREE_KM) return BASE_PRICE;

  const extraKm = Math.ceil(distanceKm - FREE_KM);
  return BASE_PRICE + extraKm * EXTRA_RATE;
}
