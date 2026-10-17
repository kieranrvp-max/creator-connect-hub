/** Standard commission; promo codes (admin-managed) may lower it but never raise it. */
export const MAX_FEE_RATE = 0.15;

/** True when the database-priced commission is between 0% and the standard 15% of the total. */
export function isValidCommission(amountPence: number, commissionPence: number) {
  return Number.isFinite(amountPence) && amountPence > 0 && Number.isFinite(commissionPence)
    && commissionPence >= 0 && commissionPence <= Math.round(amountPence * MAX_FEE_RATE);
}

/** Database-priced bookings are the only source of charge amounts. */
export function bookingCharge(total: number, fee: number, destination: string, bookingId: string, userId: string) {
  const amount = Math.round(total * 100);
  const commission = Math.round(fee * 100);
  if (!isValidCommission(amount, commission)) {
    throw new Error("Invalid booking commission; expected at most 15% of the sponsorship total");
  }
  if (!destination) throw new Error("Creator payout account is required");
  return {
    application_fee_amount: commission,
    transfer_data: { destination },
    metadata: { bookingId, userId },
  };
}
