import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Banknote,
  CalendarCheck,
  Clock,
  CreditCard,
  FileText,
  Link2,
  Megaphone,
  Search,
  ShieldCheck,
  Sparkles,
  Undo2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_FEE_RATE } from "@/lib/marketplace";

const FEE_PCT = Math.round(PLATFORM_FEE_RATE * 100);
const CREATOR_PCT = 100 - FEE_PCT;

export const Route = createFileRoute("/how-it-works")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "How It Works — Creator Connect micro-sponsorships" },
      {
        name: "description",
        content:
          "How brands book and sponsor niche creators on Creator Connect, and how creators list their channel and get paid securely.",
      },
      { property: "og:title", content: "How It Works — Creator Connect" },
      {
        property: "og:description",
        content:
          "Sponsors pay the listed price and get a slot in days. Creators keep 85% and get paid straight to their own account.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/how-it-works" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/how-it-works" }],
  }),
  component: HowItWorks,
});

type Step = { icon: typeof Search; title: string; body: string };

const SPONSOR_STEPS: Step[] = [
  {
    icon: Search,
    title: "Find your audience",
    body: "Filter Explore by channel — newsletter, podcast, YouTube or social — then by niche and the most you want to spend. Every card shows audience size, average open rate and the price per slot up front.",
  },
  {
    icon: FileText,
    title: "Send your copy and a date",
    body: "Open a listing, pick a launch date, paste the ad copy and the link you want traffic to go to. That's the whole brief — no decks, no calls, no back-and-forth.",
  },
  {
    icon: CreditCard,
    title: "Pay the price you saw",
    body: `Checkout is secure and takes a minute. You pay exactly the listed price — the platform's ${FEE_PCT}% comes out of the creator's share, never added on top of your total.`,
  },
  {
    icon: ShieldCheck,
    title: "Check the proof",
    body: "The creator accepts, runs the ad, and posts a link proving it went live. Your order tracks each stage — pending, approved, published, completed — so you always know where it stands.",
  },
];

const CREATOR_STEPS: Step[] = [
  {
    icon: Megaphone,
    title: "List your channel",
    body: "Add your channel type, niche, audience size, average open rate and price per slot. Upload a screenshot of your stats and your listing gets a verified mark sponsors can see.",
  },
  {
    icon: Banknote,
    title: "Connect payouts once",
    body: "Link your own payments account from the Creator dashboard. Until it's verified, bookings can't be paid out to you — so do this before you publish a listing.",
  },
  {
    icon: Users,
    title: "Accept or decline",
    body: "Paid requests land in your dashboard with the ad copy and destination link. Take the ones that fit your audience; decline the rest and the sponsor is refunded automatically.",
  },
  {
    icon: Link2,
    title: "Publish, then get paid",
    body: `Send the proof link once the ad is live and mark the booking complete. Your share — ${CREATOR_PCT}% of the listed price — goes straight to your connected account.`,
  },
];

const SPONSOR_NOTES = [
  {
    icon: Undo2,
    title: "Cancel before it's accepted",
    body: "Change your mind any time before the creator accepts and you get a full refund, no questions asked.",
  },
  {
    icon: Clock,
    title: "Never left waiting",
    body: "If a paid request goes unanswered for 48 hours, it's refunded automatically.",
  },
  {
    icon: CalendarCheck,
    title: "One sponsor per date",
    body: "Each creator takes a single sponsor for a given date, so your ad never shares the slot.",
  },
];

const CREATOR_NOTES = [
  {
    icon: Sparkles,
    title: `You keep ${CREATOR_PCT}%`,
    body: `The ${FEE_PCT}% platform fee is taken from your share, not added to what the sponsor pays. Set your price with that in mind.`,
  },
  {
    icon: ShieldCheck,
    title: "Money is held, not chased",
    body: "A request only reaches you once payment is confirmed. You never invoice a sponsor or chase an unpaid booking.",
  },
  {
    icon: CalendarCheck,
    title: "You stay in control",
    body: "Decline anything that isn't a fit, and only one paid booking per date — your audience never sees two ads on the same day.",
  },
];

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="mt-10 grid gap-5 md:grid-cols-2">
      {steps.map((step, i) => (
        <li key={step.title} className="relative rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <step.icon className="size-4" aria-hidden="true" />
            </span>
            <span className="font-display text-sm font-semibold text-muted-foreground">
              Step {i + 1}
            </span>
          </div>
          <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

function NoteList({ notes }: { notes: typeof SPONSOR_NOTES }) {
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-3">
      {notes.map((note) => (
        <li key={note.title} className="rounded-lg border border-dashed bg-background/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <note.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {note.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note.body}</p>
        </li>
      ))}
    </ul>
  );
}

function HowItWorks() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] md:text-6xl">
            Two sides, one <em className="marker-highlight not-italic">simple deal</em>.
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Creator Connect sits between a brand that wants to reach a small, loyal audience and a
            creator who already has one. No agencies, no retainers, no minimum spend.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a href="#for-sponsors">
                I'm a brand <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="#for-creators">
                I'm a creator <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section id="for-sponsors" className="scroll-mt-32 border-b sm:scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">For brands &amp; sponsors</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">
            Book a slot and go live within days
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            You're buying one placement with one creator. Pick the audience, hand over your copy, pay
            the listed price, and check the proof once the ad is out.
          </p>
          <StepList steps={SPONSOR_STEPS} />
          <NoteList notes={SPONSOR_NOTES} />
          <div className="mt-10">
            <Button asChild>
              <Link to="/explore">Browse creators <ArrowRight className="ml-2 size-4" aria-hidden="true" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="for-creators" className="scroll-mt-32 bg-muted/40 sm:scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">For creators</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">
            List your channel, keep {CREATOR_PCT}%, get paid securely
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            You set the price and the dates. We hold the sponsor's money until you accept, then pay
            your share straight into your own account.
          </p>
          <StepList steps={CREATOR_STEPS} />
          <NoteList notes={CREATOR_NOTES} />
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/dashboard/creator">Open Creator dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth">Create a creator account</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
