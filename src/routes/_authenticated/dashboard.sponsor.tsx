import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingEmbeddedCheckout } from "@/components/embedded-checkout";
import { SponsorshipBreakdown } from "@/components/sponsorship-breakdown";
import { getStripeEnvironment } from "@/lib/stripe";
import { cancelBookingAsSponsor, resumeBookingCheckout } from "@/utils/payments.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatGBP, profileQuery, sponsorBookingsQuery } from "@/lib/marketplace";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandCampaigns } from "@/components/brand-campaigns";

export const Route = createFileRoute("/_authenticated/dashboard/sponsor")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): { tab?: "orders" | "campaigns" | undefined } => ({
    tab: s["tab"] === "campaigns" ? "campaigns" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Brand dashboard — Creator Connect" },
      { name: "description", content: "Track your sponsorship orders and their status." },
      { property: "og:title", content: "Sponsor dashboard — Creator Connect" },
      { property: "og:description", content: "Track your sponsorship orders and their status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SponsorDashboard,
});

function SponsorDashboard() {
  const { user } = Route.useRouteContext();
  const { tab = "orders" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const profile = useQuery(profileQuery(user.id));
  const { data: orders = [], isLoading } = useQuery(sponsorBookingsQuery(user.id));
  const qc = useQueryClient();
  const resume = useServerFn(resumeBookingCheckout);
  const [payId, setPayId] = useState<string | null>(null);
  const cancel = useServerFn(cancelBookingAsSponsor);
  const onCancel = async (id: string) => {
    if (!confirm("Cancel this request? You'll get a full refund.")) return;
    const r = await cancel({ data: { bookingId: id } });
    if ("error" in r) { toast.error(r.error); return; }
    toast.success("Request cancelled and refunded");
    qc.invalidateQueries({ queryKey: ["bookings"] });
  };
  const fetchSecret = useCallback(async () => {
    if (!payId) throw new Error("No booking selected");
    try {
      const r = await resume({ data: { bookingId: payId, environment: getStripeEnvironment() } });
      if ("error" in r) throw new Error(r.error);
      return r.clientSecret;
    } catch (e) {
      toast.error((e as Error).message);
      setPayId(null);
      throw e;
    }
  }, [payId, resume]);
  const spent = orders.filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.total_amount), 0);
  const payingOrder = orders.find((b) => b.id === payId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Total paid on slots · {formatGBP(spent)}</p><h1 className="text-4xl font-semibold">Brand dashboard</h1></div>
        <Button asChild><Link to="/explore">Find creators</Link></Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => navigate({ search: v === "campaigns" ? { tab: "campaigns" } : {} })} className="mt-8">
        <TabsList>
          <TabsTrigger value="orders" data-testid="brand-tab-orders">Slot orders</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="brand-tab-campaigns">Campaign opportunities</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-6">
          {profile.isLoading ? <Skeleton className="h-40 rounded-xl" /> : profile.data?.user_type === "sponsor" ? <BrandCampaigns userId={user.id} /> : (
            <div className="rounded-xl border border-dashed p-10 text-center" data-testid="brand-campaigns-wrong-role">
              <p className="font-semibold">Campaign briefs are for Brand / Business accounts</p>
              <p className="mt-1 text-sm text-muted-foreground">You're signed in as a Creator. Creators post sponsorship slots instead — or switch role in <Link to="/account" className="text-primary underline">Account settings</Link>.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
      <div className="overflow-x-auto rounded-xl border bg-card">
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
        </TabsContent>
      </Tabs>
      <Dialog open={!!payId} onOpenChange={(o) => { if (!o) { setPayId(null); qc.invalidateQueries({ queryKey: ["bookings"] }); } }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Finish payment</DialogTitle></DialogHeader>
          {payingOrder && <SponsorshipBreakdown total={Number(payingOrder.total_amount)} fee={Number(payingOrder.platform_fee)} promoCode={payingOrder.promo_code} />}
          {payId && <BookingEmbeddedCheckout fetchSecret={fetchSecret} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}
