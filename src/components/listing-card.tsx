import { Link } from "@tanstack/react-router";
import { BadgeCheck, Users, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCount, formatGBP, type ListingWithCreator } from "@/lib/marketplace";

export function ListingCard({ listing }: { listing: ListingWithCreator }) {
  return (
    <article className="flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">{listing.channel_type}</Badge>
        <span className="text-xs text-muted-foreground">{listing.niche}</span>
      </div>
      <h3 className="mt-4 flex items-center gap-1.5 text-xl font-semibold">
        {listing.title}
        {listing.proof_screenshot_url && <BadgeCheck className="size-4 text-success" aria-label="Metrics proof provided" />}
      </h3>
      <p className="text-sm text-muted-foreground">by {listing.creator?.company_or_brand_name || listing.creator?.full_name || "Creator"}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted p-3">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" /> Audience</dt>
          <dd className="mt-1 font-semibold">{formatCount(listing.audience_size)}</dd>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground"><MailOpen className="size-3" /> Open rate</dt>
          <dd className="mt-1 font-semibold">{listing.avg_open_rate != null ? `${listing.avg_open_rate}%` : "—"}</dd>
        </div>
      </dl>
      <div className="mt-auto flex items-end justify-between pt-6">
        <div>
          <span className="font-display text-2xl font-semibold">{formatGBP(Number(listing.price_per_slot))}</span>
          <span className="text-xs text-muted-foreground"> / slot</span>
        </div>
        <Button asChild size="sm">
          <Link to="/listing/$id" params={{ id: listing.id }}>Book Sponsorship</Link>
        </Button>
      </div>
    </article>
  );
}
