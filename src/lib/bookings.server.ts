import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Idempotently marks a booking paid. Only flips unpaid → paid. */
export async function markBookingPaid(bookingId: string, paymentIntentId: string | null) {
  await supabaseAdmin
    .from("bookings")
    .update({ payment_status: "paid", ...(paymentIntentId && { stripe_payment_intent_id: paymentIntentId }) })
    .eq("id", bookingId)
    .eq("payment_status", "unpaid");
}

export async function markBookingRefunded(paymentIntentId: string) {
  await supabaseAdmin
    .from("bookings")
    .update({ payment_status: "refunded", status: "declined" })
    .eq("stripe_payment_intent_id", paymentIntentId);
}
