import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { untyped } from "@/lib/db-untyped";

const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);

/** Creator just pitched: email the brand. Only the pitching creator can trigger it. */
export const notifyPitchSubmitted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { applicationId: string }) => {
    if (!isUuid(d?.applicationId)) throw new Error("Invalid request");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: app } = await untyped(context.supabase)
      .from("opportunity_applications")
      .select("id, creator_id")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!app || app.creator_id !== context.userId) return { ok: false };
    const { notifyNewPitch } = await import("@/lib/notifications.server");
    await notifyNewPitch(app.id);
    return { ok: true };
  });

/** Creator just delivered: email the brand. Only the delivering creator can trigger it. */
export const notifyDeliverable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "booking" | "application"; id: string }) => {
    if ((d?.kind !== "booking" && d?.kind !== "application") || !isUuid(d.id)) throw new Error("Invalid request");
    return d;
  })
  .handler(async ({ data, context }) => {
    if (data.kind === "booking") {
      const { data: b } = await context.supabase
        .from("bookings")
        .select("id, listing:listings(creator_id)")
        .eq("id", data.id)
        .maybeSingle();
      if (!b || b.listing?.creator_id !== context.userId) return { ok: false };
    } else {
      const { data: a } = await untyped(context.supabase)
        .from("opportunity_applications")
        .select("id, creator_id")
        .eq("id", data.id)
        .maybeSingle();
      if (!a || a.creator_id !== context.userId) return { ok: false };
    }
    const { notifyWorkDelivered } = await import("@/lib/notifications.server");
    await notifyWorkDelivered(data.kind, data.id);
    return { ok: true };
  });
