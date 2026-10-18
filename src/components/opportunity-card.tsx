import { Link } from "@tanstack/react-router";
import { CalendarClock, Megaphone, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";
import { DeleteOpportunityButton } from "@/components/delete-opportunity-button";
import { CardQuickActions } from "@/components/card-quick-actions";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatGBP, type OpportunityWithBrand } from "@/lib/marketplace";

export function OpportunityCard({ o }: { o: OpportunityWithBrand }) {
  const { user } = useAuth();
  const isOwner = user?.id === o.brand_id;
  const brand = o.brand?.company_or_brand_name || o.brand?.full_name || "Brand";
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card/80 p-5 backdrop-blur transition-shadow hover:shadow-lg hover:shadow-[#EC4899]/10 hover:[box-shadow:0_0_15px_rgba(236,72,153,0.3)]" data-testid="opportunity-card">
      <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-brand-gradient opacity-60 transition-opacity group-hover:opacity-100" />
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="gap-1"><Megaphone className="size-3" /> Brief</Badge>
        <span className="text-xs text-muted-foreground">{o.niche}{o.channel_type ? ` · ${o.channel_type}` : ""}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold">{o.title}</h3>
      <p className="text-sm text-muted-foreground">by {brand}</p>
      {o.description && <p className="mt-3 line-clamp-3 text-sm text-foreground/80">{o.description}</p>}
      {o.deadline && (
        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="size-3" /> Apply by {formatDate(o.deadline)}</p>
      )}
      <div className="mt-auto flex items-end justify-between pt-6">
        <div>
          <span className="font-display text-2xl font-semibold">{formatGBP(Number(o.budget))}</span>
          <span className="text-xs text-muted-foreground"> budget</span>
        </div>
        <div className="flex items-center gap-1">
          <ShareButton path={`/opportunity/${o.id}`} />
          <CardQuickActions kind="opportunity" id={o.id} pinned={!!o.pinned} />
          {isOwner && (
            <>
              <Button asChild type="button" size="sm" variant="ghost" aria-label="Edit this brief" data-testid="edit-opportunity-btn">
                <Link to="/opportunity/$id" params={{ id: o.id }}><Pencil className="size-4" /></Link>
              </Button>
              <DeleteOpportunityButton opportunityId={o.id} />
            </>
          )}
          <Button asChild size="sm" className="bg-brand-gradient border-0 text-white" data-testid="opportunity-card-view-btn">
            <Link to="/opportunity/$id" params={{ id: o.id }}>View & apply</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
