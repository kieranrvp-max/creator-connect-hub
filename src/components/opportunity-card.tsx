import { Link } from "@tanstack/react-router";
import { CalendarClock, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";
import { formatDate, formatGBP, type OpportunityWithBrand } from "@/lib/marketplace";

export function OpportunityCard({ o }: { o: OpportunityWithBrand }) {
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
          <Button asChild size="sm" className="bg-brand-gradient border-0 text-white" data-testid="opportunity-card-view-btn">
            <Link to="/opportunity/$id" params={{ id: o.id }}>View & apply</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
