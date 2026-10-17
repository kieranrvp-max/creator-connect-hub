import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Copy, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/listing-card";
import { useAuth } from "@/hooks/use-auth";
import { listingsQuery } from "@/lib/marketplace";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Creator Connect — Connect with Top Brands & Secure Paid Sponsorships" },
      { name: "description", content: "The premier UK sponsorship marketplace built for creators to pitch, collaborate, and get paid seamlessly." },
      { property: "og:title", content: "Creator Connect — UK creator sponsorship marketplace" },
      { property: "og:description", content: "The premier UK sponsorship marketplace built for creators to pitch, collaborate, and get paid seamlessly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const PROMO_BY_ROLE = { creator: "EARLYBIRD", sponsor: "EARLYBIRDBIZ" } as const;

function Home() {
  return (
    <main data-testid="home-page">
      <AnnouncementBanner />
      <Hero />
      <FeaturedListings />
    </main>
  );
}

function AnnouncementBanner() {
  const { user, ready } = useAuth();
  if (ready && user) return null;
  return (
    <div className="bg-brand-gradient px-4 py-2.5 text-center text-sm font-medium text-white" data-testid="home-announcement-banner">
      🎉 Early Access: First 10 Creators (code: <strong className="font-bold">EARLYBIRD</strong>) &amp; First 10 Brands (code: <strong className="font-bold">EARLYBIRDBIZ</strong>) get 5% commission rates!
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" data-testid="home-hero">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-[#A855F7]/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -right-32 bottom-0 h-[24rem] w-[24rem] rounded-full bg-[#EC4899]/20 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pb-24 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80 backdrop-blur">
            <Sparkles className="size-3.5 text-[#EC4899]" /> UK sponsorship marketplace
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] text-white sm:text-5xl md:text-7xl" data-testid="home-hero-headline">
            Connect with Top Brands &amp; <span className="text-brand-gradient">Secure Paid Sponsorships</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/70 md:text-lg" data-testid="home-hero-subheadline">
            The premier UK sponsorship marketplace built for creators to pitch, collaborate, and get paid seamlessly.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="group h-12 rounded-full border-0 bg-brand-gradient px-7 text-base text-white shadow-lg shadow-[#A855F7]/30 transition-transform hover:-translate-y-0.5" data-testid="home-get-started-creator-btn">
              <Link to="/dashboard/creator">
                Get Started as Creator <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/20 bg-white/5 px-7 text-base text-white hover:bg-white/10 hover:text-white" data-testid="home-explore-marketplace-btn">
              <Link to="/explore">Explore Marketplace</Link>
            </Button>
          </div>
          <PromoBadge />
        </div>
        <HeroVisual />
        </div>
        <TrustRow />
      </div>
    </section>
  );
}

function PromoBadge() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO);
      setCopied(true);
      toast.success("Code EARLYBIRD copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — the code is EARLYBIRD");
    }
  };
  return (
    <div className="mt-8 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-[#EC4899]/30 bg-white/5 p-2 pl-4 backdrop-blur" data-testid="home-promo-badge">
      <span className="text-sm text-white/70">Early access code</span>
      <code className="rounded-lg border border-dashed border-[#EC4899]/60 bg-[#EC4899]/10 px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em] text-white" data-testid="home-promo-code">
        {PROMO}
      </code>
      <Button size="sm" variant="ghost" onClick={copy} className="rounded-lg text-white hover:bg-white/10 hover:text-white" data-testid="home-promo-copy-btn" aria-label="Copy promo code">
        {copied ? <Check className="text-green-400" /> : <Copy />} {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative hidden animate-in fade-in zoom-in-95 duration-700 lg:block" data-testid="home-hero-visual">
      <div className="rounded-[2rem] bg-brand-gradient p-[1.5px] shadow-2xl shadow-[#A855F7]/20">
        <img
          src="https://images.pexels.com/photos/5399014/pexels-photo-5399014.jpeg?auto=compress&cs=tinysrgb&w=900"
          alt="Creator recording a sponsored podcast episode"
          className="aspect-[4/5] w-full rounded-[calc(2rem-1.5px)] object-cover"
        />
      </div>
      <div className="absolute -left-10 bottom-10 rounded-2xl border border-white/15 bg-[#120326]/80 p-4 backdrop-blur-xl">
        <p className="text-xs text-white/60">Sponsorship booked</p>
        <p className="mt-1 font-display text-2xl font-semibold text-white">Paid out <span className="text-brand-gradient">securely</span></p>
      </div>
    </div>
  );
}

const TRUST = [
  { icon: Zap, title: "Go live in days", text: "No agencies, no minimums." },
  { icon: ShieldCheck, title: "Secure payouts", text: "Paid via Stripe, protected checkout." },
  { icon: Sparkles, title: "Niche audiences", text: "Newsletters, podcasts, YouTube & social." },
];

function TrustRow() {
  return (
    <div className="mt-16 grid gap-4 sm:grid-cols-3">
      {TRUST.map(({ icon: Icon, title, text }) => (
        <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition-colors hover:border-[#A855F7]/40">
          <Icon className="size-5 text-[#A855F7]" />
          <p className="mt-3 font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-white/60">{text}</p>
        </div>
      ))}
    </div>
  );
}

function FeaturedListings() {
  const { data: listings = [], isLoading } = useQuery(listingsQuery());
  const featured = listings.slice(0, 3);
  return (
    <section className="border-t border-white/10 bg-gradient-to-b from-transparent to-black/20" data-testid="home-featured-section">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#EC4899]">Live on the marketplace</p>
            <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Featured creator slots</h2>
          </div>
          <Link to="/explore" className="inline-flex items-center gap-1 text-sm font-semibold text-[#A855F7] hover:text-[#EC4899]" data-testid="home-view-all-link">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
          ) : featured.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 p-12 text-center text-white/60" data-testid="home-featured-empty">
              No listings yet — creators, be the first to list a slot.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="home-featured-grid">
              {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
