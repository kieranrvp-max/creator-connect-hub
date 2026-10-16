import type Stripe from "stripe";

/** Database-priced bookings are the only source of charge amounts. */
export function bookingCharge(total: number, fee: number, destination: string, bookingId: string, userId: string): Stripe.Checkout.SessionCreateParams.PaymentIntentData {
  const amount = Math.round(total * 100);
  const commission = Math.round(fee * 100);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(commission) || commission !== Math.round(amount * 0.15)) {
    throw new Error("Invalid booking commission; expected 15% of the sponsorship total");
  }
  if (!destination) throw new Error("Creator payout account is required");
  return {
    application_fee_amount: commission,
    transfer_data: { destination },
    metadata: { bookingId, userId },
  };
}