import { useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatGBP } from "@/lib/marketplace";

/** Referral payout balance for codes an admin has linked to this user. Hidden when they refer nothing. */
export function ReferralEarnings({ userId }: { userId: string }) {
  const { data = [] } = useQuery({
    queryKey: ["my-referrals", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_referral_earnings");
      if (error) throw error;
      return data ?? [];
    },
  });
  if (data.length === 0) return null;
  const total = data.reduce((s, r) => s + Number(r.earnings), 0);
  return (
    <section className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-6" data-testid="referral-earnings">
      <h2 className="flex items-center gap-2 font-semibold"><Gift className="size-4 text-primary" />Referral earnings</h2>
      <p className="mt-1 font-display text-3xl font-semibold">{formatGBP(total)}</p>
      <p className="mt-1 text-xs text-muted-foreground">Earned from paid bookings that used your codes. Creator Connect pays this out to you.</p>
      <ul className="mt-3 space-y-1 text-sm">
        {data.map((r) => (
          <li key={r.code} className="flex justify-between gap-3"><span className="font-mono">{r.code}</span><span className="text-muted-foreground">{Number(r.uses)} uses · {formatGBP(Number(r.earnings))}</span></li>
        ))}
      </ul>
    </section>
  );
}
