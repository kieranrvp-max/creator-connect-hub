/** Commission rates the database may assign: standard 15%, EARLYBIRD 5%. */
export const ALLOWED_FEE_RATES = [0.15, 0.05] as const;

/** Database-priced bookings are the only source of charge amounts. */
export function bookingCharge(total: number, fee: number, destination: string, bookingId: string, userId: string) {
  const amount = Math.round(total * 100);
  const commission = Math.round(fee * 100);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(commission) || !ALLOWED_FEE_RATES.some((r) => commission === Math.round(amount * r))) {
    throw new Error("Invalid booking commission; expected 15% (or 5% with a promo code) of the sponsorship total");
  }
  if (!destination) throw new Error("Creator payout account is required");
  return {
    application_fee_amount: commission,
    transfer_data: { destination },
    metadata: { bookingId, userId },
  };
}
