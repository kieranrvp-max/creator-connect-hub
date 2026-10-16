import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

/** Escrow funded: brand paid upfront, money held on the platform until release. Idempotent. */
export async function markApplicationPaid(applicationId: string, paymentIntentId: string | null, env: StripeEnv) {
  await supabaseAdmin
    .from("opportunity_applications")
    .update({
      payment_status: "paid",
      status: "accepted",
      paid_at: new Date().toISOString(),
      payment_env: env,
      ...(paymentIntentId && { stripe_payment_intent_id: paymentIntentId }),
    })
    .eq("id", applicationId)
    .eq("payment_status", "unpaid");
}

/** Releases the creator's share (total minus commission) from escrow to their Connect account. */
export async function releaseApplication(applicationId: string) {
  const { data: a } = await supabaseAdmin
    .from("opportunity_applications")
    .select("id, status, payment_status, payment_env, total_amount, platform_fee, stripe_payment_intent_id, creator_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (!a || a.status !== "delivered" || a.payment_status !== "paid" || !a.stripe_payment_intent_id || !a.payment_env) {
    throw new Error("Only delivered, funded work can be released");
  }
  const { data: creator } = await supabaseAdmin.from("profiles").select("stripe_connect_account_id").eq("id", a.creator_id).maybeSingle();
  if (!creator?.stripe_connect_account_id) throw new Error("The creator hasn't connected a payout account");
  const stripe = createStripeClient(a.payment_env as StripeEnv);
  const pi = await stripe.paymentIntents.retrieve(a.stripe_payment_intent_id);
  const charge = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id;
  const amount = Math.round((Number(a.total_amount) - Number(a.platform_fee)) * 100);
  const transfer = await stripe.transfers.create(
    {
      amount,
      currency: "gbp",
      destination: creator.stripe_connect_account_id,
      transfer_group: a.id,
      ...(charge && { source_transaction: charge }),
      metadata: { applicationId: a.id },
    },
    { idempotencyKey: `release-${a.id}` },
  );
  await supabaseAdmin
    .from("opportunity_applications")
    .update({ status: "released", stripe_transfer_id: transfer.id, released_at: new Date().toISOString() })
    .eq("id", a.id);
}

/** Refunds a funded application that hasn't been released yet. */
export async function refundApplication(applicationId: string) {
  const { data: a } = await supabaseAdmin
    .from("opportunity_applications")
    .select("id, status, payment_status, payment_env, stripe_payment_intent_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (!a || a.status !== "accepted" || a.payment_status !== "paid") throw new Error("Only funded work that hasn't been delivered can be refunded");
  if (a.stripe_payment_intent_id && a.payment_env) {
    const stripe = createStripeClient(a.payment_env as StripeEnv);
    await stripe.refunds.create({ payment_intent: a.stripe_payment_intent_id }, { idempotencyKey: `app-refund-${a.id}` });
  }
  await supabaseAdmin.from("opportunity_applications").update({ status: "refunded", payment_status: "refunded" }).eq("id", a.id);
}

export async function markApplicationRefunded(paymentIntentId: string) {
  await supabaseAdmin
    .from("opportunity_applications")
    .update({ status: "refunded", payment_status: "refunded" })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .neq("status", "released")
    .neq("payment_status", "refunded");
}

export async function clearApplicationSession(sessionId: string) {
  await supabaseAdmin
    .from("opportunity_applications")
    .update({ stripe_checkout_session_id: null })
    .eq("stripe_checkout_session_id", sessionId)
    .eq("payment_status", "unpaid");
}
