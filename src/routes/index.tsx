import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, ShieldCheck, MessageSquare, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Marketplace } from "@/components/marketplace";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Creator Connect — UK sponsorship marketplace for creators" },
      { name: "description", content: "Connect with top brands and secure paid sponsorships. The UK marketplace for creators to pitch, collaborate and get paid." },
      { property: "og:title", content: "Creator Connect — Secure paid sponsorships" },
      { property: "og:description", content: "The UK sponsorship marketplace built for creators to pitch, collaborate and get paid seamlessly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const TRUST = [
  { icon: ShieldCheck, label: "Fast & Secure Stripe Payments" },
  { icon: MessageSquare, label: "Direct Brand Messaging" },
  { icon: Zap, label: "0% Friction Verification" },
];

function PromoCard() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText("EARLYBIRD");
      setCopied(true);
      toast.success("EARLYBIRD copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — the code is EARLYBIRD");
    }
  };
  return (
    <div className="relative rounded-2xl bg-banner p-px shadow-[0_0_60px_-10px_var(--neon)]">
      <div className="rounded-2xl bg-hero p-6 md:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neon">
          <Sparkles className="size-4" /> Early access offer
        </p>
        <p className="mt-3 font-display text-3xl font-semibold text-hero-foreground">5% commission</p>
        <p className="mt-1 text-sm text-hero-muted">instead of 15% — keep 95% of every sponsorship.</p>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-neon/60 bg-hero-foreground/5 px-4 py-3">
          <span className="font-mono text-xl font-bold tracking-[0.2em] text-hero-foreground">EARLYBIRD</span>
          <Button size="sm" onClick={copy} aria-label="Copy promo code EARLYBIRD">
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const scrollToExplore = () => document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
  return (
    <main>
      <div className="bg-banner px-4 py-2 text-center text-sm font-medium text-primary-foreground">
        🎉 Early Access: The first 10 creators get a reduced 5% commission using code <strong>EARLYBIRD</strong> at checkout!
      </div>

      <section className="bg-hero-glow text-hero-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1fr_380px]">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-5xl md:text-6xl">
              Connect with Top Brands &amp; Secure <span className="text-neon">Paid Sponsorships</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-hero-muted">
              The premier UK sponsorship marketplace built for creators to pitch, collaborate, and get paid seamlessly.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/auth">Get Started as Creator</Link>
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToExplore} className="border-hero-foreground/30 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
                Explore Marketplace
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 rounded-full border border-hero-foreground/15 bg-hero-foreground/5 px-3 py-1.5 text-sm">
                  <Icon className="size-4 text-neon" /> {label}
                </li>
              ))}
            </ul>
          </div>
          <PromoCard />
        </div>
      </section>

      <section id="marketplace" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 pt-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Marketplace</p>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Explore creators open for sponsorship</h2>
        </div>
        <Marketplace />
      </section>
    </main>
  );
}
