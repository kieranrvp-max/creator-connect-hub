import { Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { acceptAndFundApplication, refundEscrow, releaseEscrow } from "@/utils/opportunities.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingEmbeddedCheckout } from "@/components/embedded-checkout";
import { SponsorshipBreakdown } from "@/components/sponsorship-breakdown";
import { SocialBadges } from "@/components/social-badges";
import { ApplicationBadge } from "@/components/application-badge";
import { CHANNELS, NICHES, brandOpportunitiesQuery, formatGBP, type BrandApplication, type BrandOpportunity, type ChannelType } from "@/lib/marketplace";
import { untyped } from "@/lib/db-untyped";

export function BrandCampaigns({ userId }: { userId: string }) {
  const { data: opps = [], isLoading, error } = useQuery(brandOpportunitiesQuery(userId));
  const [funding, setFunding] = useState<BrandApplication | null>(null);
  return (
    <section data-testid="brand-campaigns">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Post briefs, review creator pitches and pay securely through escrow.</p>
        <NewOpportunityDialog userId={userId} />
      </div>
      <div className="mt-6 space-y-5">
        {isLoading && <Skeleton className="h-40 rounded-xl" />}
        {error && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Brand opportunities are launching soon — check back shortly.</p>}
        {!isLoading && !error && opps.length === 0 && (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground" data-testid="brand-campaigns-empty">No briefs yet. Post your first campaign opportunity to start receiving pitches.</p>
        )}
        {opps.map((o) => <OpportunityBlock key={o.id} o={o} onFund={setFunding} />)}
      </div>
      <FundDialog app={funding} onClose={() => setFunding(null)} />
    </section>
  );
}

function OpportunityBlock({ o, onFund }: { o: BrandOpportunity; onFund: (a: BrandApplication) => void }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: async () => {
      const { error } = await untyped(supabase).from("opportunities").update({ status: o.status === "open" ? "closed" : "open" }).eq("id", o.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="rounded-2xl border bg-card/80 p-5 backdrop-blur" data-testid="brand-opportunity">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/opportunity/$id" params={{ id: o.id }} className="text-lg font-semibold hover:text-primary">{o.title}</Link>
          <p className="text-sm text-muted-foreground">{o.niche} · {formatGBP(Number(o.budget))} budget{o.promo_code ? ` · ${o.promo_code}` : ""} · {o.status === "open" ? "Open" : "Closed"}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => toggle.mutate()} disabled={toggle.isPending} data-testid="brand-opportunity-toggle-btn">
          {o.status === "open" ? "Close brief" : "Reopen brief"}
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {o.applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          o.applications.map((a) => <ApplicantRow key={a.id} a={a} onFund={() => onFund(a)} />)
        )}
      </div>
    </div>
  );
}

function ApplicantRow({ a, onFund }: { a: BrandApplication; onFund: () => void }) {
  const qc = useQueryClient();
  const release = useServerFn(releaseEscrow);
  const refund = useServerFn(refundEscrow);
  const run = useMutation({
    mutationFn: async (action: "decline" | "release" | "refund") => {
      if (action === "decline") {
        const { error } = await untyped(supabase).from("opportunity_applications").update({ status: "declined" }).eq("id", a.id);
        if (error) throw error;
        return "Application declined";
      }
      const r = await (action === "release" ? release : refund)({ data: { applicationId: a.id } });
      if ("error" in r) throw new Error(r.error);
      return action === "release" ? "Payment released to the creator" : "Escrow refunded to you";
    },
    onSuccess: (msg) => { qc.invalidateQueries({ queryKey: ["opportunities"] }); toast.success(msg); },
    onError: (e: Error) => toast.error(e.message),
  });
  const name = a.creator?.company_or_brand_name || a.creator?.full_name || "Creator";
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center" data-testid="brand-applicant-row">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{name}</span><ApplicationBadge status={a.status} /></div>
        <SocialBadges socials={a.creator?.socials ?? []} className="mt-2" />
        <p className="mt-2 text-sm italic text-foreground/80">“{a.pitch}”</p>
        {a.portfolio_link && <a href={a.portfolio_link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary">Portfolio <ExternalLink className="size-3" /></a>}
        {a.proof_url && <a href={a.proof_url} target="_blank" rel="noreferrer" className="mt-1 ml-3 inline-flex items-center gap-1 text-xs text-primary">View delivered work <ExternalLink className="size-3" /></a>}
      </div>
      <div className="flex flex-wrap gap-2">
        {a.status === "pending" && (
          <>
            <Button size="sm" variant="ghost" disabled={run.isPending} onClick={() => run.mutate("decline")} data-testid="applicant-decline-btn">Decline</Button>
            <Button size="sm" className="border-0 bg-brand-gradient text-white" onClick={onFund} data-testid="applicant-accept-btn">Accept & pay</Button>
          </>
        )}
        {a.status === "accepted" && (
          <Button size="sm" variant="outline" disabled={run.isPending} onClick={() => { if (confirm("Cancel and refund the escrow payment?")) run.mutate("refund"); }} data-testid="applicant-refund-btn">Cancel & refund</Button>
        )}
        {a.status === "delivered" && (
          <Button size="sm" className="border-0 bg-brand-gradient text-white" disabled={run.isPending} onClick={() => { if (confirm("Approve the work and release payment to the creator?")) run.mutate("release"); }} data-testid="applicant-release-btn">Approve & release</Button>
        )}
      </div>
    </div>
  );
}

function FundDialog({ app, onClose }: { app: BrandApplication | null; onClose: () => void }) {
  const qc = useQueryClient();
  const fund = useServerFn(acceptAndFundApplication);
  const fetchSecret = useCallback(async () => {
    if (!app) throw new Error("No application selected");
    try {
      const r = await fund({ data: { applicationId: app.id, environment: getStripeEnvironment(), returnUrl: window.location.origin } });
      if ("error" in r) throw new Error(r.error);
      return r.clientSecret;
    } catch (e) {
      toast.error((e as Error).message);
      onClose();
      throw e;
    }
  }, [app, fund, onClose]);
  return (
    <Dialog open={!!app} onOpenChange={(o) => { if (!o) { onClose(); qc.invalidateQueries({ queryKey: ["opportunities"] }); } }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Fund campaign escrow</DialogTitle></DialogHeader>
        {app && (
          <>
            <SponsorshipBreakdown total={Number(app.total_amount)} fee={Number(app.platform_fee)} promoCode={app.promo_code} />
            <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#A855F7]" /> Your payment is held by Creator Connect and only released to the creator when you approve their delivered work. EARLYBIRDBIZ discounts are applied at checkout.</p>
            <BookingEmbeddedCheckout fetchSecret={fetchSecret} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewOpportunityDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [niche, setNiche] = useState("Lifestyle");
  const [channel, setChannel] = useState<ChannelType | "any">("any");
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (f: FormData) => {
      const { error } = await untyped(supabase).from("opportunities").insert({
        brand_id: userId,
        title: String(f.get("title")).trim(),
        niche,
        channel_type: channel === "any" ? null : channel,
        budget: Number(f.get("budget")),
        description: String(f.get("description") || "").trim() || null,
        deliverables: String(f.get("deliverables") || "").trim() || null,
        deadline: String(f.get("deadline") || "") || null,
        promo_code: String(f.get("promo") || "").trim().toUpperCase() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["opportunities"] }); setOpen(false); toast.success("Opportunity posted"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="border-0 bg-brand-gradient text-white" data-testid="new-opportunity-btn"><Plus className="size-4" /> Post opportunity</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New campaign opportunity</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); }} data-testid="new-opportunity-form">
          <div className="space-y-2"><Label htmlFor="ot">Title</Label><Input id="ot" name="title" required minLength={3} maxLength={140} placeholder="Looking for UK Beauty Creators" data-testid="opp-title-input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Niche</Label>
              <Select value={niche} onValueChange={setNiche}><SelectTrigger data-testid="opp-niche-select"><SelectValue /></SelectTrigger><SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Preferred channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as ChannelType | "any")}><SelectTrigger data-testid="opp-channel-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Any channel</SelectItem>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="ob">Budget per creator (£)</Label><Input id="ob" name="budget" type="number" min={1} step="0.01" required placeholder="300" data-testid="opp-budget-input" /></div>
            <div className="space-y-2"><Label htmlFor="od">Apply by (optional)</Label><Input id="od" name="deadline" type="date" min={new Date().toISOString().slice(0, 10)} data-testid="opp-deadline-input" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="odesc">Brief</Label><Textarea id="odesc" name="description" rows={3} maxLength={2000} placeholder="Who you are, the product, and the audience you want to reach." data-testid="opp-description-input" /></div>
          <div className="space-y-2"><Label htmlFor="odel">Deliverables</Label><Textarea id="odel" name="deliverables" rows={2} maxLength={1000} placeholder="1 × TikTok video (30–60s) + 1 story with link" data-testid="opp-deliverables-input" /></div>
          <div className="space-y-2"><Label htmlFor="opromo">Promo code (optional)</Label><Input id="opromo" name="promo" maxLength={40} placeholder="EARLYBIRDBIZ" className="uppercase" data-testid="opp-promo-input" />
            <p className="text-xs text-muted-foreground">EARLYBIRDBIZ lowers the platform fee to 5% (first 10 funded campaigns across Creator Connect).</p></div>
          <DialogFooter><Button type="submit" className="border-0 bg-brand-gradient text-white" disabled={create.isPending} data-testid="opp-submit-btn">{create.isPending ? "Posting…" : "Post opportunity"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

