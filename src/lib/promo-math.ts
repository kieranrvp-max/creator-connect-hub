/** Standard platform commission before any promo discount. */
export const STANDARD_FEE_PCT = 15;

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Admin enters a discount off the standard 15% fee; e.g. 5 → 10% charged. */
export function feeRateFromDiscount(discountPct: number) {
  if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > STANDARD_FEE_PCT) {
    throw new Error(`Discount must be between 0% and ${STANDARD_FEE_PCT}%`);
  }
  return r2(STANDARD_FEE_PCT - discountPct) / 100;
}

/** Reverse of feeRateFromDiscount, for editing a saved code. */
export function discountFromFeeRate(feeRate: number) {
  return r2(STANDARD_FEE_PCT - feeRate * 100);
}

/** Percentage split of one booking for a promo code. */
export function promoSplit(discountPct: number, referralPct: number) {
  const charged = r2(STANDARD_FEE_PCT - discountPct);
  if (!(referralPct >= 0 && referralPct <= charged)) throw new Error("Referrer share can't exceed the fee charged");
  return { charged, referrer: r2(referralPct), platform: r2(charged - referralPct), creator: r2(100 - charged) };
}
