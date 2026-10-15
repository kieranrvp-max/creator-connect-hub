import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingEmbeddedCheckout } from "@/components/embedded-checkout";
import { getStripeEnvironment } from "@/lib/stripe";
import { cancelBookingAsSponsor, resumeBookingCheckout } from "@/utils/payments.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatGBP, sponsorBookingsQuery } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/dashboard/sponsor")({
  head: () => ({
    meta: [
      { title: "Sponsor dashboard — slot." },
      { name: "description", content: "Track your sponsorship orders and their status." },
      { property: "og:title", content: "Sponsor dashboard — slot." },
      { property: "og:description", content: "Track your sponsorship orders and their status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SponsorDashboard,
});

function SponsorDashboard() {
  const { user } = Route.useRouteContext();
  const { data: orders = [], isLoading } = useQuery(sponsorBookingsQuery(user.id));
  const qc = useQueryClient();
  const resume = useServerFn(resumeBookingCheckout);
  const [payId, setPayId] = useState<string | null>(null);
  const cancel = useServerFn(cancelBookingAsSponsor);
  const onCancel = async (id: string) => {
    if (!confirm("Cancel this request? You'll get a full refund.")) return;
    const r = await cancel({ data: { bookingId: id } });
    if ("error" in r) return toast.error(r.error);
    toast.success("Request cancelled and refunded");
    qc.invalidateQueries({ queryKey: ["bookings"] });
  };
  const fetchSecret = useCallback(async () => {
    try {
      const r = await resume({ data: { bookingId: payId!, environment: getStripeEnvironment() } });
      if ("error" in r) throw new Error(r.error);
      return r.clientSecret;
    } catch (e) {
      toast.error((e as Error).message);
      setPayId(null);
      throw e;
    }
  }, [payId, resume]);
  const spent = orders.filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.total_amount), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Total paid · {formatGBP(spent)}</p><h1 className="text-4xl font-semibold">Your orders</h1></div>
        <Button asChild><Link to="/explore">Find creators</Link></Button>
      </div>
      <div className="mt-8 overflow-x-auto rounded-xl border bg-card">
        {isLoading ? <Skeleton className="h-40" /> : orders.length === 0 ? (
          <p className="p-12 text-center text-muted-foreground">No orders yet. Browse creators to book your first slot.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Creator</TableHead><TableHead>Launch date</TableHead><TableHead>Destination</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Proof</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    {b.listing && <Link to="/listing/$id" params={{ id: b.listing.id }} className="font-semibold hover:text-primary">{b.listing.title}</Link>}
                    <p className="text-xs text-muted-foreground">{b.listing?.channel_type}</p>
                  </TableCell>
                  <TableCell>{formatDate(b.preferred_date)}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">{b.target_link}</TableCell>
                  <TableCell>{formatGBP(Number(b.total_amount))}</TableCell>
                  <TableCell>
                    {b.payment_status === "unpaid" ? (
                      <Button size="sm" variant="outline" onClick={() => setPayId(b.id)}>Pay now</Button>
                    ) : b.payment_status === "refunded" ? (
                      <span className="text-sm text-muted-foreground">Refunded</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={b.status} />
                        {b.status === "pending_approval" && (
                          <Button size="sm" variant="ghost" onClick={() => onCancel(b.id)}>Cancel</Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{b.proof_url ? <a href={b.proof_url} target="_blank" rel="noreferrer" className="text-sm text-primary">View</a> : <span className="text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <Dialog open={!!payId} onOpenChange={(o) => { if (!o) { setPayId(null); qc.invalidateQueries({ queryKey: ["bookings"] }); } }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Finish payment</DialogTitle></DialogHeader>
          {payId && <BookingEmbeddedCheckout fetchSecret={fetchSecret} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}
