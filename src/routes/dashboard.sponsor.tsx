import { createFileRoute, Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { bookings, formatGBP, getListing } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/sponsor")({
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
  const orders = bookings.filter((b) => b.status !== "completed");
  const spent = bookings.reduce((s, b) => s + b.total_amount + b.platform_fee, 0);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Total spent · {formatGBP(spent)}</p><h1 className="text-4xl font-semibold">Your orders</h1></div>
        <Button asChild><Link to="/explore">Find creators</Link></Button>
      </div>
      <div className="mt-8 overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Creator</TableHead><TableHead>Launch date</TableHead><TableHead>Destination</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((b) => {
              const l = getListing(b.listing_id);
              return (
                <TableRow key={b.id}>
                  <TableCell>
                    {l && <Link to="/listing/$id" params={{ id: l.id }} className="font-semibold hover:text-primary">{l.title}</Link>}
                    <p className="text-xs text-muted-foreground">{l?.channel_type}</p>
                  </TableCell>
                  <TableCell>{new Date(b.preferred_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">{b.target_link}</TableCell>
                  <TableCell>{formatGBP(b.total_amount + b.platform_fee)}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
