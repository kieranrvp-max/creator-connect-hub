import { formatGBP, PLATFORM_FEE_RATE } from "@/lib/marketplace";

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;

export function SponsorshipBreakdown({ total, fee, rate, promoCode }: { total: number; fee?: number; rate?: number; promoCode?: string | null }) {
  const r = rate ?? (fee !== undefined && total > 0 ? Math.round((fee / total) * 100) / 100 : PLATFORM_FEE_RATE);
  const f = fee ?? Math.round(total * r * 100) / 100;
  const discounted = r < PLATFORM_FEE_RATE;
  return (
    <dl className="space-y-2 text-sm" aria-label="Sponsorship price breakdown">
      <div className="flex justify-between gap-4 text-muted-foreground"><dt>Sponsorship price</dt><dd className="shrink-0">{formatGBP(total)}</dd></div>
      <div className="flex justify-between gap-4 text-muted-foreground"><dt>Creator share ({pct(1 - r)})</dt><dd className="shrink-0">{formatGBP(total - f)}</dd></div>
      <div className="flex justify-between gap-4 text-muted-foreground">
        <dt>Platform fee ({discounted && <s className="mr-1">{pct(PLATFORM_FEE_RATE)}</s>}{pct(r)}, included){discounted && promoCode && <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">{promoCode}</span>}</dt>
        <dd className="shrink-0">{formatGBP(f)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t pt-2 font-semibold"><dt>Total you pay</dt><dd className="shrink-0">{formatGBP(total)}</dd></div>
    </dl>
  );
}
