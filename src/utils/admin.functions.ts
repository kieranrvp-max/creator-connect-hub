import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

/** Admin override: refund a paid booking back to the sponsor and close it. */
export const adminRefundBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookingId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { refundAndClose } = await import("@/lib/bookings.server");
    await refundAndClose(data.bookingId);
    return { ok: true };
  });

/** Admin override: release escrowed funds for a delivered application to the creator. */
export const adminReleaseApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { releaseApplication } = await import("@/lib/applications.server");
    await releaseApplication(data.applicationId);
    return { ok: true };
  });

/** Admin override: refund a funded application back to the brand. */
export const adminRefundApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { refundApplication } = await import("@/lib/applications.server");
    await refundApplication(data.applicationId);
    return { ok: true };
  });
