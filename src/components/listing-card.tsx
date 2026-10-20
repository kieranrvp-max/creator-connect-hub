import { Link } from "@tanstack/react-router";
import { BadgeCheck, Users, MailOpen, Pencil, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialBadges } from "@/components/social-badges";
import { ShareButton } from "@/components/share-button";
import { DeleteListingButton } from "@/components/delete-listing-button";
import { CardQuickActions } from "@/components/card-quick-actions";
import { useAuth } from "@/hooks/use-auth";
import { formatCount, formatGBP, rateLabel, type ListingWithCreator } from "@/lib/marketplace";

export function ListingCard({ listing }: { listing: ListingWithCreator }) {
  const { user } = useAuth();
  const isOwner = user?.id === listing.creator_id;
  const verified = listing.proof_screenshot_url || listing.creator?.socials.some((s) => s.verified);
  return (
    <article className="flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-primary/10 hover:[box-shadow:0_0_15px_rgba(236,72,153,0.3)]" data-testid="listing-card">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">{listing.channel_type}</Badge>
        <span className="text-xs text-muted-foreground">{listing.niche}</span>
      </div>
      <h3 className="mt-4 flex items-center gap-1.5 text-xl font-semibold">
        {listing.title}
        {verified && <BadgeCheck className="size-4 text-success" aria-label="Verified creator" />}
      </h3>
      <p className="text-sm text-muted-foreground">by {listing.creator?.company_or_brand_name || listing.creator?.full_name || "Creator"}</p>
      <SocialBadges socials={listing.creator?.socials ?? []} className="mt-3" />
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted p-3">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" /> Audience</dt>
          <dd className="mt-1 font-semibold">{formatCount(listing.audience_size)}</dd>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">{listing.channel_type === "Newsletter" ? <MailOpen className="size-3" /> : <Heart className="size-3" />} {rateLabel(listing.channel_type)}</dt>
          <dd className="mt-1 font-semibold">{listing.avg_open_rate != null ? `${listing.avg_open_rate}%` : "—"}</dd>
        </div>
      </dl>
      <div className="mt-auto flex items-end justify-between pt-6">
        <div>
          <span className="font-display text-2xl font-semibold">{formatGBP(Number(listing.price_per_slot))}</span>
          <span className="text-xs text-muted-foreground"> / slot</span>
        </div>
        <div className="flex items-center gap-1">
          <ShareButton path={`/listing/${listing.id}`} />
          <CardQuickActions kind="listing" id={listing.id} pinned={!!listing.pinned} />
          {isOwner && (
            <>
              <Button asChild type="button" size="sm" variant="ghost" aria-label="Edit this post" data-testid="edit-listing-btn">
                <Link to="/listing/$id" params={{ id: listing.id }}><Pencil className="size-4" /></Link>
              </Button>
              <DeleteListingButton listingId={listing.id} />
            </>
          )}
          <Button asChild size="sm">
            <Link to="/listing/$id" params={{ id: listing.id }}>Book Sponsorship</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
