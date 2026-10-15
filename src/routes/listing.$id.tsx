import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { calcFee, calcTotal, formatCount, formatGBP, listingQuery } from "@/lib/marketplace";

export const Route = createFileRoute("/listing/$id")({
  head: () => ({
    meta: [
      { title: "Sponsorship listing — slot." },
      { name: "description", content: "View audience metrics and ad specs, then book a sponsorship slot." },
      { property: "og:title", content: "Sponsorship listing — slot." },
      { property: "og:description", content: "View audience metrics and book a sponsorship slot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListingPage,
});

function ListingPage() {
  const { id } = Route.useParams();
  const { data: listing, isLoading } = useQuery(listingQuery(id));
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [copy, setCopy] = useState("");

  const book = useMutation({
    mutationFn: async (v: { preferred_date: string; ad_copy: string; target_link: string }) => {
      const { error } = await supabase.from("bookings").insert({ ...v, listing_id: id, sponsor_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking request sent to the creator");
      navigate({ to: "/dashboard/sponsor" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <main className="mx-auto max-w-6xl px-4 py-8"><Skeleton className="h-96 rounded-xl" /></main>;
  if (!listing)
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold">Listing not found</h1>
        <Button asChild className="mt-6"><Link to="/explore">Back to explore</Link></Button>
      </main>
    );

  const price = Number(listing.price_per_slot);
  const isOwn = user?.id === listing.creator_id;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/explore" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to explore
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex gap-2"><Badge>{listing.channel_type}</Badge><Badge variant="outline">{listing.niche}</Badge></div>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{listing.title}</h1>
          <p className="mt-2 text-muted-foreground">by {listing.creator?.company_or_brand_name || listing.creator?.full_name || "Creator"}</p>
          {listing.description && <p className="mt-6 text-lg leading-relaxed">{listing.description}</p>}

          <h2 className="mt-10 flex items-center gap-2 text-2xl font-semibold">
            Metrics
            {listing.proof_screenshot_url && (
              <a href={listing.proof_screenshot_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-sans text-sm text-success">
                <BadgeCheck className="size-4" /> View proof
              </a>
            )}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat label="Audience" value={formatCount(listing.audience_size)} />
            <Stat label="Avg. open rate" value={listing.avg_open_rate != null ? `${listing.avg_open_rate}%` : "—"} />
            <Stat label="Price per slot" value={formatGBP(price)} />
          </div>

          <h2 className="mt-10 text-2xl font-semibold">Ad specs</h2>
          <ul className="mt-4 space-y-2 rounded-xl border bg-card p-5 text-sm">
            <li><span className="text-muted-foreground">Format:</span> {listing.ad_format || "Discuss with creator"}</li>
            <li><span className="text-muted-foreground">Turnaround:</span> Creator replies within 48 hours</li>
            <li><span className="text-muted-foreground">Proof:</span> Live link shared after publishing</li>
          </ul>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <form
            className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              book.mutate({ preferred_date: String(f.get("date")), ad_copy: copy.trim(), target_link: String(f.get("url")) });
            }}
          >
            <h2 className="text-2xl font-semibold">Book this slot</h2>
            <div className="space-y-2"><Label htmlFor="date">Launch date</Label><Input id="date" name="date" type="date" min={new Date().toISOString().slice(0, 10)} required /></div>
            <div className="space-y-2">
              <Label htmlFor="copy">Ad copy</Label>
              <Textarea id="copy" rows={5} required maxLength={2000} value={copy} onChange={(e) => setCopy(e.target.value)} placeholder="What should the creator say about you?" />
              <p className="text-right text-xs text-muted-foreground">{copy.trim() ? copy.trim().split(/\s+/).length : 0} words</p>
            </div>
            <div className="space-y-2"><Label htmlFor="url">Destination URL</Label><Input id="url" name="url" type="url" required placeholder="https://" /></div>
            <Separator />
            <div className="space-y-1 text-sm">
              <Row label="Slot" value={formatGBP(price)} />
              <Row label="Platform fee (10%)" value={formatGBP(calcFee(price))} />
              <div className="flex justify-between pt-1 font-semibold"><span>Total</span><span>{formatGBP(calcTotal(price))}</span></div>
            </div>
            {!user ? (
              <Button asChild className="w-full" size="lg"><Link to="/auth" search={{ redirect: `/listing/${id}` }}>Sign in to book</Link></Button>
            ) : isOwn ? (
              <p className="text-center text-sm text-muted-foreground">This is your listing.</p>
            ) : (
              <Button type="submit" className="w-full" size="lg" disabled={book.isPending}>{book.isPending ? "Sending…" : "Proceed to Checkout"}</Button>
            )}
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
