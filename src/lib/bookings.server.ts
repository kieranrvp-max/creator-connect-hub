import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

type CloseStatus = "declined";

/** Refunds (incl. reversing the creator transfer and platform fee) and closes a booking. Idempotent. */
export async function refundAndClose(bookingId: string, status: CloseStatus = "declined") {
  const { data: b } = await supabaseAdmin
    .from("bookings")
    .select("id, payment_status, stripe_payment_intent_id, payment_env")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b) return;
  if (b.payment_status === "paid" && b.stripe_payment_intent_id && b.payment_env) {
    const stripe = createStripeClient(b.payment_env as StripeEnv);
    await stripe.refunds.create(
      { payment_intent: b.stripe_payment_intent_id, reverse_transfer: true, refund_application_fee: true },
      { idempotencyKey: `refund-${b.id}` },
    );
  }
  await supabaseAdmin
    .from("bookings")
    .update({ status, payment_status: b.payment_status === "paid" ? "refunded" : b.payment_status })
    .eq("id", b.id);
}

/** Idempotently marks a booking paid. If the creator's date was taken meanwhile, refunds it. */
export async function markBookingPaid(bookingId: string, paymentIntentId: string | null, env: StripeEnv) {
  const { data: updated } = await supabaseAdmin
    .from("bookings")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      payment_env: env,
      ...(paymentIntentId && { stripe_payment_intent_id: paymentIntentId }),
    })
    .eq("id", bookingId)
    .eq("payment_status", "unpaid")
    .select("id, listing_id, preferred_date")
    .maybeSingle();
  if (!updated) return;
  const { data: clash } = await supabaseAdmin.rpc("creator_date_taken", {
    _listing_id: updated.listing_id,
    _date: updated.preferred_date,
    _exclude: updated.id,
  });
  if (clash) {
    await refundAndClose(updated.id);
    return;
  }
  const { notifyBookingPaid } = await import("@/lib/notifications.server");
  await notifyBookingPaid(updated.id);
}

export async function markBookingRefunded(paymentIntentId: string) {
  await supabaseAdmin
    .from("bookings")
    .update({ payment_status: "refunded", status: "declined" })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .neq("payment_status", "refunded");
}

/** Abandoned checkout: remove the unpaid placeholder booking. */
export async function deleteUnpaidBySession(sessionId: string) {
  await supabaseAdmin.from("bookings").delete().eq("stripe_checkout_session_id", sessionId).eq("payment_status", "unpaid");
}

/** Refund paid requests the creator hasn't answered within 48 hours. */
export async function expireStaleRequests() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("status", "pending_approval")
    .eq("payment_status", "paid")
    .lt("paid_at", cutoff)
    .limit(100);
  let refunded = 0;
  for (const b of data ?? []) {
    try {
      await refundAndClose(b.id);
      refunded++;
    } catch (e) {
      console.error("Auto-refund failed", b.id, e);
    }
  }
  return refunded;
}
