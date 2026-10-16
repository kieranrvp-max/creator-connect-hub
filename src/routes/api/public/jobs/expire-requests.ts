import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/jobs/expire-requests")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { expireStaleRequests } = await import("@/lib/bookings.server");
        const refunded = await expireStaleRequests();
        return Response.json({ success: true, refunded });
      },
    },
  },
});
