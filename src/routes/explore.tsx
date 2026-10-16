import { createFileRoute } from "@tanstack/react-router";
import { Marketplace } from "@/components/marketplace";

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

function Explore() {
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
      <Marketplace />
    </main>
  );
}
