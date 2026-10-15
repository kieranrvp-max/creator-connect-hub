import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getListing, formatGBP, formatCount } from "@/lib/mock-data";

export const Route = createFileRoute("/listing/$id")({
  loader: ({ params }) => {
    const listing = getListing(params.id);
    if (!listing) throw notFound();
    return { listing };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.listing.title} — sponsor on slot.` : "Listing not found — slot.";
    const d = loaderData?.listing.description ?? "This listing is unavailable.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ListingPage,
});

const FEE = 0.1;

function ListingPage() {
  const { listing } = Route.useLoaderData();
  const [copy, setCopy] = useState("");
  const fee = listing.price_per_slot * FEE;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/explore" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to explore
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex gap-2"><Badge>{listing.channel_type}</Badge><Badge variant="outline">{listing.niche}</Badge></div>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{listing.title}</h1>
          <p className="mt-2 text-muted-foreground">by {listing.creator}</p>
          <p className="mt-6 text-lg leading-relaxed">{listing.description}</p>

          <h2 className="mt-10 flex items-center gap-2 text-2xl font-semibold">
            Metrics {listing.verified && <span className="inline-flex items-center gap-1 font-sans text-sm text-success"><BadgeCheck className="size-4" /> Verified</span>}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat label="Audience" value={formatCount(listing.audience_size)} />
            <Stat label="Avg. open rate" value={listing.avg_open_rate ? `${listing.avg_open_rate}%` : "—"} />
            <Stat label="Price per slot" value={formatGBP(listing.price_per_slot)} />
          </div>

          <h2 className="mt-10 text-2xl font-semibold">Ad specs</h2>
          <ul className="mt-4 space-y-2 rounded-xl border bg-card p-5 text-sm">
            <li><span className="text-muted-foreground">Format:</span> {listing.ad_format}</li>
            <li><span className="text-muted-foreground">Turnaround:</span> Creator replies within 48 hours</li>
            <li><span className="text-muted-foreground">Proof:</span> Live link shared after publishing</li>
          </ul>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <form
            className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
            onSubmit={(e) => { e.preventDefault(); toast.success("Checkout coming soon — booking request saved (demo)."); }}
          >
            <h2 className="text-2xl font-semibold">Book this slot</h2>
            <div className="space-y-2"><Label htmlFor="date">Launch date</Label><Input id="date" type="date" required /></div>
            <div className="space-y-2">
              <Label htmlFor="copy">Ad copy</Label>
              <Textarea id="copy" rows={5} required value={copy} onChange={(e) => setCopy(e.target.value)} placeholder="What should the creator say about you?" />
              <p className="text-right text-xs text-muted-foreground">{copy.trim() ? copy.trim().split(/\s+/).length : 0} words</p>
            </div>
            <div className="space-y-2"><Label htmlFor="url">Destination URL</Label><Input id="url" type="url" required placeholder="https://" /></div>
            <Separator />
            <div className="space-y-1 text-sm">
              <Row label="Slot" value={formatGBP(listing.price_per_slot)} />
              <Row label="Platform fee (10%)" value={formatGBP(fee)} />
              <div className="flex justify-between pt-1 font-semibold"><span>Total</span><span>{formatGBP(listing.price_per_slot + fee)}</span></div>
            </div>
            <Button type="submit" className="w-full" size="lg">Proceed to Checkout</Button>
            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="size-3" /> You're only charged if the creator accepts</p>
          </form>
        </aside>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold">{value}</p></div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{label}</span><span>{value}</span></div>;
}
