import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
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
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Explore creators — Creator Connect micro-sponsorships" },
      { name: "description", content: "Browse niche newsletters, podcasts and channels and book affordable sponsorship slots." },
      { property: "og:title", content: "Explore creators — Creator Connect" },
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
      <section className="relative overflow-hidden border-b" data-testid="home-hero">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-highlight/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Micro-sponsorships</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] md:text-6xl">
              Connect directly with targeted <em className="marker-highlight not-italic">niche creators</em> for fast, low-cost sponsorships.
            </h1>
            <p className="mt-5 max-w-xl text-muted-foreground">
              No agencies, no minimums. Pick a slot, send your copy, and go live within days.
            </p>
            <HeroCtas />
          </div>
          <HeroCollage />
        </div>
      </section>

      <div id="listings" className="mx-auto grid max-w-6xl scroll-mt-28 gap-8 lg:scroll-mt-20 px-4 py-10 lg:grid-cols-[240px_1fr]">
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
          <p className="mb-4 text-sm text-muted-foreground">{results.length} {results.length === 1 ? "creator" : "creators"} available</p>
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

const HERO_IMAGES = [
  { src: "https://images.pexels.com/photos/5399014/pexels-photo-5399014.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Podcaster recording an episode at home", tag: "Podcasts" },
  { src: "https://images.unsplash.com/photo-1664277497095-424e085175e8?auto=format&fit=crop&w=700&q=80", alt: "Video creator filming in a studio", tag: "Channels" },
  { src: "https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=700&q=80", alt: "Writer drafting a newsletter on a laptop", tag: "Newsletters" },
];

function HeroCtas() {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Button asChild size="lg" className="group rounded-full px-6 shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5" data-testid="hero-browse-creators-btn">
        <a href="#listings">
          Browse creators
          <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
        </a>
      </Button>
      <Button asChild size="lg" variant="outline" className="rounded-full px-6 transition-colors" data-testid="hero-list-slot-btn">
        <Link to="/dashboard/creator">List your slot</Link>
      </Button>
    </div>
  );
}

function HeroCollage() {
  const [main, ...rest] = HERO_IMAGES;
  return (
    <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-700" data-testid="hero-collage">
      <HeroImage {...main!} className="row-span-2 h-full" />
      {rest.map((img) => <HeroImage key={img.tag} {...img} className="aspect-square" />)}
    </div>
  );
}

function HeroImage({ src, alt, tag, className }: { src: string; alt: string; tag: string; className: string }) {
  return (
    <figure className={`group relative overflow-hidden rounded-2xl border bg-muted ${className}`}>
      <img src={src} alt={alt} loading="eager" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <figcaption className="absolute bottom-3 left-3 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold backdrop-blur">{tag}</figcaption>
    </figure>
  );
}
