import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, CheckCircle2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SponsorshipBreakdown } from "@/components/sponsorship-breakdown";
import { ShareButton } from "@/components/share-button";
import { formatDate, formatGBP, myApplicationsQuery, opportunityQuery } from "@/lib/marketplace";
import { untyped } from "@/lib/db-untyped";

export const Route = createFileRoute("/opportunity/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Brand opportunity — Creator Connect" },
      { name: "description", content: "Pitch for a paid brand campaign on Creator Connect." },
      { property: "og:title", content: "Brand opportunity — Creator Connect" },
      { property: "og:description", content: "Pitch for a paid brand campaign on Creator Connect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OpportunityPage,
});

function OpportunityPage() {
  const { id } = Route.useParams();
  const { data: o, isLoading } = useQuery(opportunityQuery(id));

  if (isLoading) return <main className="mx-auto max-w-5xl px-4 py-10"><Skeleton className="h-80 rounded-xl" /></main>;
  if (!o)
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center" data-testid="opportunity-not-found">
        <h1 className="text-3xl font-semibold">Opportunity not found</h1>
        <Button asChild className="mt-6"><Link to="/explore" search={{ tab: "opportunities" }}>Back to opportunities</Link></Button>
      </main>
    );

  const brand = o.brand?.company_or_brand_name || o.brand?.full_name || "Brand";
  return (
    <main className="mx-auto max-w-5xl px-4 py-10" data-testid="opportunity-page">
      <div className="flex items-center justify-between gap-2">
        <Link to="/explore" search={{ tab: "opportunities" }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" data-testid="opportunity-back-link">
          <ArrowLeft className="size-4" /> All opportunities
        </Link>
        <ShareButton path={`/opportunity/${id}`} variant="outline" label="Share" />
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{o.niche}</Badge>
            {o.channel_type && <Badge variant="secondary">{o.channel_type}</Badge>}
            {o.status === "closed" && <Badge variant="destructive">Closed</Badge>}
          </div>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl" data-testid="opportunity-title">{o.title}</h1>
          <p className="mt-2 text-muted-foreground">Posted by <span className="font-semibold text-foreground">{brand}</span></p>
          {o.description && <p className="mt-6 whitespace-pre-line text-foreground/85">{o.description}</p>}
          {o.deliverables && (
            <div className="mt-6 rounded-xl border bg-card/70 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#EC4899]">Deliverables</p>
              <p className="mt-2 whitespace-pre-line text-sm">{o.deliverables}</p>
            </div>
          )}
          {o.deadline && <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="size-4" /> Apply by {formatDate(o.deadline)}</p>}
        </section>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[#A855F7]/30 bg-card/80 p-6 shadow-[0_0_40px_-12px_rgba(168,85,247,0.45)] backdrop-blur-xl">
            <p className="text-sm text-muted-foreground">Campaign budget</p>
            <p className="font-display text-4xl font-semibold" data-testid="opportunity-budget">{formatGBP(Number(o.budget))}</p>
            <div className="mt-4"><SponsorshipBreakdown total={Number(o.budget)} /></div>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#A855F7]" /> The brand pays upfront into escrow when they accept you. Funds are released to you once they approve your delivered work.
            </p>
          </div>
          <ApplyBox opportunityId={o.id} brandId={o.brand_id} open={o.status === "open"} />
        </aside>
      </div>
    </main>
  );
}

function ApplyBox({ opportunityId, brandId, open }: { opportunityId: string; brandId: string; open: boolean }) {
  const { user, ready, profile } = useAuth();
  const apps = useQuery({ ...myApplicationsQuery(user?.id ?? ""), enabled: !!user });
  const mine = apps.data?.find((a) => a.opportunity_id === opportunityId);

  const box = "rounded-2xl border bg-card/80 p-6 backdrop-blur-xl";
  if (!ready) return <Skeleton className="h-40 rounded-2xl" />;
  if (!user)
    return (
      <div className={box} data-testid="apply-signin">
        <p className="font-semibold">Want this campaign?</p>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with a creator account to pitch.</p>
        <Button asChild className="mt-4 w-full border-0 bg-brand-gradient text-white"><Link to="/auth" search={{ redirect: `/opportunity/${opportunityId}` }}>Sign in to apply</Link></Button>
      </div>
    );
  if (user.id === brandId)
    return <div className={box} data-testid="apply-own"><p className="text-sm text-muted-foreground">This is your brief. Manage applicants from your <Link to="/dashboard/sponsor" search={{ tab: "campaigns" }} className="text-primary underline">brand dashboard</Link>.</p></div>;
  if (profile && profile.user_type !== "creator")
    return (
      <div className={box} data-testid="apply-wrong-role">
        <p className="font-semibold">Creators only</p>
        <p className="mt-1 text-sm text-muted-foreground">You're signed in as a Brand / Business. Switch to a Creator account in <Link to="/account" className="text-primary underline">Account settings</Link> to apply.</p>
      </div>
    );
  if (mine)
    return (
      <div className={box} data-testid="apply-done">
        <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-success" /> You've applied</p>
        <p className="mt-1 text-sm text-muted-foreground">Track it in your <Link to="/dashboard/creator" className="text-primary underline">creator dashboard</Link>.</p>
      </div>
    );
  if (!open) return <div className={box}><p className="text-sm text-muted-foreground">This brief is no longer accepting applications.</p></div>;
  return <ApplyForm opportunityId={opportunityId} userId={user.id} />;
}

function ApplyForm({ opportunityId, userId }: { opportunityId: string; userId: string }) {
  const qc = useQueryClient();
  const [pitch, setPitch] = useState("");
  const [link, setLink] = useState("");
  const apply = useMutation({
    mutationFn: async () => {
      const { error } = await untyped(supabase).from("opportunity_applications").insert({
        opportunity_id: opportunityId,
        creator_id: userId,
        pitch: pitch.trim(),
        portfolio_link: link.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); toast.success("Application sent to the brand"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form className="space-y-4 rounded-2xl border bg-card/80 p-6 backdrop-blur-xl" onSubmit={(e) => { e.preventDefault(); apply.mutate(); }} data-testid="apply-form">
      <p className="font-semibold">Pitch for this campaign</p>
      <div className="space-y-2">
        <Label htmlFor="pitch">Your pitch</Label>
        <Textarea id="pitch" required minLength={10} maxLength={2000} rows={5} value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Why your audience is a great fit, what you'd create, and when." data-testid="apply-pitch-input" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="plink">Portfolio / media kit link (optional)</Label>
        <Input id="plink" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" data-testid="apply-link-input" />
      </div>
      <Button type="submit" className="w-full border-0 bg-brand-gradient text-white" disabled={apply.isPending} data-testid="apply-submit-btn">
        {apply.isPending ? "Sending…" : "Send application"}
      </Button>
    </form>
  );
}
