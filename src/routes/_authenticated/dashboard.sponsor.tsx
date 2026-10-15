import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  const spent = orders.filter((b) => b.status !== "declined").reduce((s, b) => s + Number(b.total_amount), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Total committed · {formatGBP(spent)}</p><h1 className="text-4xl font-semibold">Your orders</h1></div>
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
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  <TableCell>{b.proof_url ? <a href={b.proof_url} target="_blank" rel="noreferrer" className="text-sm text-primary">View</a> : <span className="text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  );
}
