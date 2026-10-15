import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import { CHANNELS, NICHES, formatGBP, listingsQuery } from "@/lib/marketplace";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore creators — slot. micro-sponsorships" },
      { name: "description", content: "Browse niche newsletters, podcasts and channels and book affordable sponsorship slots." },
      { property: "og:title", content: "Explore creators — slot." },
      { property: "og:description", content: "Book fast, low-cost micro-sponsorships with niche creators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Explore,
});

const MAX = 500;

function Explore() {
  const [channel, setChannel] = useState("all");
  const [niche, setNiche] = useState("all");
  const [maxPrice, setMaxPrice] = useState(MAX);
  const { data: listings = [], isLoading } = useQuery(listingsQuery());

  const results = useMemo(
    () =>
      listings.filter(
        (l) =>
          (channel === "all" || l.channel_type === channel) &&
          (niche === "all" || l.niche === niche) &&
          (maxPrice >= MAX || Number(l.price_per_slot) <= maxPrice),
      ),
    [listings, channel, niche, maxPrice],
  );

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Micro-sponsorships</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] md:text-6xl">
            Connect directly with targeted <em className="marker-highlight not-italic">niche creators</em> for fast, low-cost sponsorships.
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            No agencies, no minimums. Pick a slot, send your copy, and go live within days.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-2">
            <Label>Channel type</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Niche</Label>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All niches</SelectItem>
                {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Max price</Label>
              <span className="text-sm font-semibold">{maxPrice >= MAX ? "Any" : formatGBP(maxPrice)}</span>
            </div>
            <Slider min={50} max={MAX} step={10} value={[maxPrice]} onValueChange={(v) => setMaxPrice(v[0] ?? MAX)} />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setChannel("all"); setNiche("all"); setMaxPrice(MAX); }}>
            Reset filters
          </Button>
        </aside>

        <section>
          <p className="mb-4 text-sm text-muted-foreground">{results.length} creators available</p>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              {listings.length === 0 ? "No listings yet — creators, be the first to list a slot." : "No creators match these filters."}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
