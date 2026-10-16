import { calcFee, formatGBP, PLATFORM_FEE_RATE } from "@/lib/marketplace";

export function SponsorshipBreakdown({ total, fee = calcFee(total) }: { total: number; fee?: number }) {
  return (
    <dl className="space-y-2 text-sm" aria-label="Sponsorship price breakdown">
      <div className="flex justify-between gap-4 text-muted-foreground"><dt>Sponsorship price</dt><dd className="shrink-0">{formatGBP(total)}</dd></div>
      <div className="flex justify-between gap-4 text-muted-foreground"><dt>Creator share ({100 - PLATFORM_FEE_RATE * 100}%)</dt><dd className="shrink-0">{formatGBP(total - fee)}</dd></div>
      <div className="flex justify-between gap-4 text-muted-foreground"><dt>Platform fee ({PLATFORM_FEE_RATE * 100}%, included)</dt><dd className="shrink-0">{formatGBP(fee)}</dd></div>
      <div className="flex justify-between gap-4 border-t pt-2 font-semibold"><dt>Total you pay</dt><dd className="shrink-0">{formatGBP(total)}</dd></div>
    </dl>
  );
}