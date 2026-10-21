import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { untyped } from "@/lib/db-untyped";
import { creatorShare, excerpt, ratePercent, referralEarning } from "@/lib/notify-math";

// Every marketplace notification goes to exactly one recipient and never
// blocks the payment or status change that triggered it.

async function emailOf(userId: string) {
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

async function nameOf(userId: string, fallback: string) {
  const { data } = await supabaseAdmin.from("profiles").select("full_name, company_or_brand_name").eq("id", userId).maybeSingle();
  return data?.company_or_brand_name || data?.full_name || fallback;
}

async function send(template: string, userId: string, key: string, templateData: Record<string, unknown>) {
  try {
    const to = await emailOf(userId);
    if (!to) return;
    await sendTemplateEmail(template, to, { templateData, idempotencyKey: `${template}-${key}` });
  } catch (e) {
    console.error(`Notification ${template} failed`, key, e);
  }
}

const ukDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });

async function notifyReferrer(code: string | null, total: number, key: string) {
  if (!code) return;
  const { data: promo } = await supabaseAdmin.from("promo_codes").select("code, referrer_id, referral_rate").eq("code", code).maybeSingle();
  if (!promo?.referrer_id || !(Number(promo.referral_rate) > 0)) return;
  await send("referrer-commission", promo.referrer_id, key, {
    code: promo.code,
    bookingAmount: Number(total),
    ratePercent: ratePercent(Number(promo.referral_rate)),
    earned: referralEarning(total, Number(promo.referral_rate)),
  });
}

/** Brand paid for a listing: tell the creator, and the referrer if a code was used. */
export async function notifyBookingPaid(bookingId: string) {
  const { data: b } = await supabaseAdmin
    .from("bookings")
    .select("id, sponsor_id, total_amount, platform_fee, preferred_date, promo_code, payment_status, listing:listings(title, creator_id)")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b || b.payment_status !== "paid" || !b.listing) return;
  const brandName = await nameOf(b.sponsor_id, "A brand");
  await Promise.all([
    send("creator-booking-paid", b.listing.creator_id, b.id, {
      listingTitle: b.listing.title,
      brandName,
      amount: Number(b.total_amount),
      creatorShare: creatorShare(b.total_amount, b.platform_fee),
      launchDate: ukDate(b.preferred_date),
    }),
    notifyReferrer(b.promo_code, Number(b.total_amount), `booking-${b.id}`),
  ]);
}

/** Brand funded escrow for a pitch: tell the creator, and the referrer if a code was used. */
export async function notifyApplicationFunded(applicationId: string) {
  const { data } = await untyped(supabaseAdmin)
    .from("opportunity_applications")
    .select("id, creator_id, total_amount, platform_fee, promo_code, payment_status, opportunity:opportunities(title, brand_id)")
    .eq("id", applicationId)
    .maybeSingle();
  const a = data as { id: string; creator_id: string; total_amount: number; platform_fee: number; promo_code: string | null; payment_status: string; opportunity: { title: string; brand_id: string } | null } | null;
  if (!a || a.payment_status !== "paid" || !a.opportunity) return;
  const brandName = await nameOf(a.opportunity.brand_id, "The brand");
  await Promise.all([
    send("creator-brief-funded", a.creator_id, a.id, {
      briefTitle: a.opportunity.title,
      brandName,
      amount: Number(a.total_amount),
      creatorShare: creatorShare(a.total_amount, a.platform_fee),
    }),
    notifyReferrer(a.promo_code, Number(a.total_amount), `application-${a.id}`),
  ]);
}

/** Creator pitched for a brief: tell the brand. */
export async function notifyNewPitch(applicationId: string) {
  const { data } = await untyped(supabaseAdmin)
    .from("opportunity_applications")
    .select("id, creator_id, pitch, opportunity:opportunities(title, brand_id)")
    .eq("id", applicationId)
    .maybeSingle();
  const a = data as { id: string; creator_id: string; pitch: string; opportunity: { title: string; brand_id: string } | null } | null;
  if (!a?.opportunity) return;
  await send("brand-new-pitch", a.opportunity.brand_id, a.id, {
    briefTitle: a.opportunity.title,
    creatorName: await nameOf(a.creator_id, "A creator"),
    pitchExcerpt: excerpt(a.pitch),
  });
}

/** Creator delivered a booking (published) or a brief (delivered): tell the brand. */
export async function notifyWorkDelivered(kind: "booking" | "application", id: string) {
  if (kind === "booking") {
    const { data: b } = await supabaseAdmin
      .from("bookings")
      .select("id, sponsor_id, proof_url, status, listing:listings(title, creator_id)")
      .eq("id", id)
      .maybeSingle();
    if (!b || b.status !== "published" || !b.listing) return;
    await send("brand-work-delivered", b.sponsor_id, `booking-${b.id}`, {
      title: b.listing.title,
      creatorName: await nameOf(b.listing.creator_id, "Your creator"),
      proofUrl: b.proof_url ?? undefined,
      isBrief: false,
    });
    return;
  }
  const { data } = await untyped(supabaseAdmin)
    .from("opportunity_applications")
    .select("id, creator_id, proof_url, status, opportunity:opportunities(title, brand_id)")
    .eq("id", id)
    .maybeSingle();
  const a = data as { id: string; creator_id: string; proof_url: string | null; status: string; opportunity: { title: string; brand_id: string } | null } | null;
  if (!a || a.status !== "delivered" || !a.opportunity) return;
  await send("brand-work-delivered", a.opportunity.brand_id, `application-${a.id}`, {
    title: a.opportunity.title,
    creatorName: await nameOf(a.creator_id, "Your creator"),
    proofUrl: a.proof_url ?? undefined,
    isBrief: true,
  });
}
