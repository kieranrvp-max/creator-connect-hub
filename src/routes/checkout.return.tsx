import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getStripeEnvironment } from "@/lib/stripe";
import { getCheckoutResult } from "@/utils/payments.functions";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string | undefined } => ({
    session_id: typeof s["session_id"] === "string" ? s["session_id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Booking payment — slot." },
      { name: "description", content: "Your sponsorship booking payment status." },
      { property: "og:title", content: "Booking payment — slot." },
      { property: "og:description", content: "Your sponsorship booking payment status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const check = useServerFn(getCheckoutResult);
  const result = useQuery({
    queryKey: ["checkout-result", session_id],
    enabled: !!session_id && !!user,
    queryFn: async () => {
      const r = await check({ data: { sessionId: session_id!, environment: getStripeEnvironment() } });
      if ("error" in r) throw new Error(r.error);
      return r;
    },
  });
  useEffect(() => { if (result.data?.paid) qc.invalidateQueries({ queryKey: ["bookings"] }); }, [result.data, qc]);

  const loading = !ready || result.isLoading;
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      {!session_id ? (
        <p>No payment information found.</p>
      ) : loading ? (
        <Skeleton className="mx-auto h-32 w-full rounded-xl" />
      ) : result.data?.paid ? (
        <>
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-4 text-3xl font-semibold">Payment received</h1>
          <p className="mt-2 text-muted-foreground">The creator has been notified and will accept or decline within 48 hours. If they decline, you're refunded in full.</p>
        </>
      ) : (
        <>
          <XCircle className="mx-auto size-12 text-destructive" />
          <h1 className="mt-4 text-3xl font-semibold">Payment not completed</h1>
          <p className="mt-2 text-muted-foreground">{result.error?.message ?? "You can finish paying from your orders page."}</p>
        </>
      )}
      <Button asChild className="mt-8"><Link to="/dashboard/sponsor">Go to my orders</Link></Button>
    </main>
  );
}
