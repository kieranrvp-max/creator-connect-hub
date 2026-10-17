import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { ALLOWED_FEE_RATES } from "@/lib/checkout-charge";
import { untyped } from "@/lib/db-untyped";

type Result<T> = T | { error: string };
const isEnv = (e: unknown): e is StripeEnv => e === "sandbox" || e === "live";
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

function originOf(url: string) {
  const u = new URL(url);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Invalid URL");
  return u.origin;
}

/** Loads an application the signed-in brand owns (RLS + explicit owner check). */
async function ownedApplication(supabase: unknown, userId: string, id: string) {
  const { data } = await untyped(supabase)
    .from("opportunity_applications")
    .select("id, status, payment_status, stripe_checkout_session_id, creator_id, opportunity:opportunities!opportunity_applications_opportunity_id_fkey!inner(id, title, brand_id)")
    .eq("id", id)
    .maybeSingle();
  const app = data as { id: string; status: string; payment_status: string; stripe_checkout_session_id: string | null; creator_id: string; opportunity: { id: string; title: string; brand_id: string } | null } | null;
  if (!app?.opportunity || app.opportunity.brand_id !== userId) return null;
  return { ...app, opportunity: app.opportunity };
}

/** Brand accepts a creator: funds escrow upfront through Stripe Checkout. */
export const acceptAndFundApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { applicationId: string; environment: StripeEnv; returnUrl: string }) => {
    if (!isEnv(d.environment) || !isUuid(d.applicationId)) throw new Error("Invalid request");
    originOf(d.returnUrl);
    return d;
  })
  .handler(async ({ data, context }): Promise<Result<{ clientSecret: string }>> => {
    try {
      const app = await ownedApplication(context.supabase, context.userId, data.applicationId);
      if (!app) return { error: "Application not found" };
      if (app.status !== "pending" || app.payment_status !== "unpaid") return { error: "This application has already been handled" };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const stripe = createStripeClient(data.environment);

      if (app.stripe_checkout_session_id) {
        const existing = await stripe.checkout.sessions.retrieve(app.stripe_checkout_session_id);
        if (existing.status === "open" && existing.client_secret) return { clientSecret: existing.client_secret };
      }

      const { data: creator } = await supabaseAdmin.from("profiles").select("stripe_connect_account_id").eq("id", app.creator_id).maybeSingle();
      if (!creator?.stripe_connect_account_id) return { error: "This creator hasn't set up payouts yet, so they can't be hired." };
      const acct = await stripe.accounts.retrieve(creator.stripe_connect_account_id);
      if (!acct.payouts_enabled) return { error: "This creator's payout account isn't verified yet." };

      await untyped(supabaseAdmin).rpc("reprice_application", { _application_id: app.id });
      const { data: priced } = await untyped(supabaseAdmin).from("opportunity_applications").select("total_amount, platform_fee").eq("id", app.id).single();
      const total = Number(priced?.total_amount);
      const fee = Number(priced?.platform_fee);
      const amount = Math.round(total * 100);
      if (!isValidCommission(amount, Math.round(fee * 100))) {
        return { error: "Invalid commission on this application" };
      }

      const email = (context.claims as { email?: string }).email;
      const origin = originOf(data.returnUrl);
      const description = `Campaign: ${app.opportunity.title}`;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        ...(email && { customer_email: email }),
        return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: amount,
            product_data: { name: description, description: `Held securely until you approve delivery. Includes ${Math.round((fee / total) * 100)}% platform fee (£${fee.toFixed(2)}). Creator receives £${(total - fee).toFixed(2)}.` },
          },
        }],
        payment_intent_data: { transfer_group: app.id, description, metadata: { applicationId: app.id, userId: context.userId } },
        metadata: { applicationId: app.id, userId: context.userId },
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      });
      await untyped(supabaseAdmin).from("opportunity_applications").update({ stripe_checkout_session_id: session.id }).eq("id", app.id);
      return { clientSecret: session.client_secret ?? "" };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

export const releaseEscrow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { applicationId: string }) => {
    if (!isUuid(d.applicationId)) throw new Error("Invalid request");
    return d;
  })
  .handler(async ({ data, context }): Promise<Result<{ ok: true }>> => {
    try {
      const app = await ownedApplication(context.supabase, context.userId, data.applicationId);
      if (!app) return { error: "Application not found" };
      const { releaseApplication } = await import("@/lib/applications.server");
      await releaseApplication(app.id);
      return { ok: true };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

export const refundEscrow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { applicationId: string }) => {
    if (!isUuid(d.applicationId)) throw new Error("Invalid request");
    return d;
  })
  .handler(async ({ data, context }): Promise<Result<{ ok: true }>> => {
    try {
      const app = await ownedApplication(context.supabase, context.userId, data.applicationId);
      if (!app) return { error: "Application not found" };
      const { refundApplication } = await import("@/lib/applications.server");
      await refundApplication(app.id);
      return { ok: true };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });
