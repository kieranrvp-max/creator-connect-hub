import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { bookingCharge } from "@/lib/checkout-charge";

type Result<T> = T | { error: string };
const isEnv = (e: unknown): e is StripeEnv => e === "sandbox" || e === "live";
const safeId = (s: string) => /^[a-zA-Z0-9_-]+$/.test(s);
const toPence = (n: number) => Math.round(n * 100);

/** Returns the origin of the caller-supplied URL only if it's http(s). */
function originOf(url: string) {
  const u = new URL(url);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Invalid URL");
  return u.origin;
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | undefined; userId: string },
): Promise<string> {
  if (!safeId(options.userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

/* ---------------- Creator payouts (Connect) ---------------- */

export const getPayoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: StripeEnv }) => {
    if (!isEnv(d.environment)) throw new Error("Invalid environment");
    return d;
  })
  .handler(async ({ data, context }): Promise<Result<{ connected: boolean; ready: boolean; detailsSubmitted: boolean }>> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: p } = await supabaseAdmin.from("profiles").select("stripe_connect_account_id").eq("id", context.userId).maybeSingle();
      if (!p?.stripe_connect_account_id) return { connected: false, ready: false, detailsSubmitted: false };
      const stripe = createStripeClient(data.environment);
      const acct = await stripe.accounts.retrieve(p.stripe_connect_account_id);
      return { connected: true, ready: !!acct.charges_enabled && !!acct.payouts_enabled, detailsSubmitted: !!acct.details_submitted };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

export const createPayoutOnboardingLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: StripeEnv; returnUrl: string }) => {
    if (!isEnv(d.environment)) throw new Error("Invalid environment");
    originOf(d.returnUrl);
    return d;
  })
  .handler(async ({ data, context }): Promise<Result<{ url: string }>> => {
    try {
      const { data: me } = await context.supabase.from("profiles").select("user_type").eq("id", context.userId).maybeSingle();
      if (me?.user_type !== "creator") return { error: "Only creators can set up payouts" };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const stripe = createStripeClient(data.environment);
      const { data: p } = await supabaseAdmin.from("profiles").select("stripe_connect_account_id").eq("id", context.userId).maybeSingle();
      let accountId = p?.stripe_connect_account_id ?? null;
      if (!accountId) {
        const email = (context.claims as { email?: string }).email;
        const acct = await stripe.accounts.create({
          type: "express",
          country: "GB",
          ...(email && { email }),
          capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
          metadata: { userId: context.userId },
        });
        accountId = acct.id;
        await supabaseAdmin.from("profiles").update({ stripe_connect_account_id: accountId }).eq("id", context.userId);
      }
      const origin = originOf(data.returnUrl);
      const link = await stripe.accountLinks.create({
        account: accountId,
        type: "account_onboarding",
        refresh_url: `${origin}/dashboard/creator?payouts=refresh`,
        return_url: `${origin}/dashboard/creator?payouts=done`,
      });
      return { url: link.url };
    } catch (e) {
      const msg = getStripeErrorMessage(e);
      if (/signed up for Connect|unclaimed/i.test(msg)) {
        return { error: "Creator payouts aren't switched on for this marketplace yet. The site owner needs to claim the payments account and enable Connect." };
      }
      return { error: msg };
    }
  });

/* ---------------- Sponsor checkout ---------------- */

export const createBookingCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { listingId: string; adCopy: string; targetLink: string; preferredDate: string; environment: StripeEnv; returnUrl: string }) => {
    if (!isEnv(d.environment)) throw new Error("Invalid environment");
    if (!/^[0-9a-f-]{36}$/i.test(d.listingId)) throw new Error("Invalid listing");
    if (!d.adCopy?.trim() || d.adCopy.length > 2000) throw new Error("Ad copy is required (max 2000 characters)");
    const t = new URL(d.targetLink);
    if (t.protocol !== "https:" && t.protocol !== "http:") throw new Error("Destination must be a web link");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.preferredDate)) throw new Error("Invalid date");
    originOf(d.returnUrl);
    return d;
  })
  .handler(async ({ data, context }): Promise<Result<{ clientSecret: string; bookingId: string }>> => {
    try {
      const { supabase, userId } = context;
      const { data: listing } = await supabase.from("listings").select("id, title, creator_id, price_per_slot").eq("id", data.listingId).maybeSingle();
      if (!listing) return { error: "Listing not found" };
      if (listing.creator_id === userId) return { error: "You can't book your own listing" };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: creator } = await supabaseAdmin.from("profiles").select("stripe_connect_account_id").eq("id", listing.creator_id).maybeSingle();
      if (!creator?.stripe_connect_account_id) return { error: "This creator hasn't set up payouts yet, so they can't take bookings." };

      const stripe = createStripeClient(data.environment);
      const acct = await stripe.accounts.retrieve(creator.stripe_connect_account_id);
      if (!acct.charges_enabled) return { error: "This creator's payout account isn't verified yet. Please try again later." };

      // Insert as the sponsor (RLS); trigger sets the listed total with an included 15% fee.
      const { data: booking, error: insErr } = await supabase
        .from("bookings")
        .insert({ listing_id: listing.id, sponsor_id: userId, ad_copy: data.adCopy.trim(), target_link: data.targetLink, preferred_date: data.preferredDate })
        .select("id, total_amount, platform_fee")
        .single();
      if (insErr || !booking) return { error: insErr?.message ?? "Could not create booking" };

      const email = (context.claims as { email?: string }).email;
      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });
      const origin = originOf(data.returnUrl);
      const description = `Sponsorship: ${listing.title}`;
      const total = Number(booking.total_amount);
      const fee = Number(booking.platform_fee);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        customer: customerId,
        return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        line_items: [{
          quantity: 1,
          price_data: { currency: "gbp", unit_amount: toPence(total), product_data: { name: description, description: `Includes 15% Creator Connect platform fee (£${fee.toFixed(2)}). Creator share: £${(total - fee).toFixed(2)}. No additional platform fee.` } },
        }],
        payment_intent_data: {
          ...bookingCharge(total, fee, creator.stripe_connect_account_id, booking.id, userId),
          description,
        },
        metadata: { bookingId: booking.id, userId },
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      });

      await supabaseAdmin.from("bookings").update({ stripe_checkout_session_id: session.id }).eq("id", booking.id);
      return { clientSecret: session.client_secret ?? "", bookingId: booking.id };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

/** Lets an unpaid booking be paid again (e.g. checkout closed early). */
export const resumeBookingCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookingId: string; environment: StripeEnv }) => {
    if (!isEnv(d.environment)) throw new Error("Invalid environment");
    return d;
  })
  .handler(async ({ data, context }): Promise<Result<{ clientSecret: string }>> => {
    try {
      const { data: b } = await context.supabase.from("bookings").select("id, payment_status, stripe_checkout_session_id").eq("id", data.bookingId).eq("sponsor_id", context.userId).maybeSingle();
      if (!b || b.payment_status !== "unpaid" || !b.stripe_checkout_session_id) return { error: "Nothing to pay for this booking" };
      const stripe = createStripeClient(data.environment);
      const s = await stripe.checkout.sessions.retrieve(b.stripe_checkout_session_id);
      if (s.status !== "open" || !s.client_secret) return { error: "This checkout expired. Please book the slot again." };
      return { clientSecret: s.client_secret };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

export const getCheckoutResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string; environment: StripeEnv }) => {
    if (!isEnv(d.environment) || !/^cs_[a-zA-Z0-9_]+$/.test(d.sessionId)) throw new Error("Invalid session");
    return d;
  })
  .handler(async ({ data, context }): Promise<Result<{ paid: boolean; bookingId: string | null }>> => {
    try {
      const stripe = createStripeClient(data.environment);
      const s = await stripe.checkout.sessions.retrieve(data.sessionId);
      if (s.metadata?.["userId"] !== context.userId) return { error: "Not your checkout" };
      const bookingId = s.metadata?.["bookingId"] ?? null;
      const paid = s.payment_status === "paid";
      if (paid && bookingId) {
        const { markBookingPaid } = await import("@/lib/bookings.server");
        await markBookingPaid(bookingId, typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null, data.environment);
      }
      return { paid, bookingId };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

/* ---------------- Creator decline → refund ---------------- */

export const declineAndRefundBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookingId: string }) => d)
  .handler(async ({ data, context }): Promise<Result<{ ok: true }>> => {
    try {
      // RLS: creator can only read paid bookings on their own listings.
      const { data: b } = await context.supabase
        .from("bookings")
        .select("id, status, listing:listings!bookings_listing_id_fkey!inner(creator_id)")
        .eq("id", data.bookingId)
        .maybeSingle();
      if (!b || b.listing?.creator_id !== context.userId) return { error: "Booking not found" };
      if (b.status !== "pending_approval") return { error: "Only pending requests can be declined" };
      const { refundAndClose } = await import("@/lib/bookings.server");
      await refundAndClose(b.id);
      return { ok: true };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

export const cancelBookingAsSponsor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookingId: string }) => d)
  .handler(async ({ data, context }): Promise<Result<{ ok: true }>> => {
    try {
      const { data: b } = await context.supabase
        .from("bookings")
        .select("id, status, payment_status")
        .eq("id", data.bookingId)
        .eq("sponsor_id", context.userId)
        .maybeSingle();
      if (!b) return { error: "Booking not found" };
      if (b.status !== "pending_approval") return { error: "This request was already accepted, so it can't be cancelled." };
      const { refundAndClose } = await import("@/lib/bookings.server");
      await refundAndClose(b.id);
      return { ok: true };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });
