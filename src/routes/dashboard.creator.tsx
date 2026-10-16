import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ExternalLink, Banknote, BadgeCheck } from "lucide-react";
import { ApplicationBadge } from "@/components/application-badge";
import { useServerFn } from "@tanstack/react-start";
import { getStripeEnvironment } from "@/lib/stripe";
import { createPayoutOnboardingLink, declineAndRefundBooking, getPayoutStatus } from "@/utils/payments.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import {
  CHANNELS, NICHES, creatorBookingsQuery, myApplicationsQuery, type CreatorApplication, formatDate, formatGBP, myListingsQuery, profileQuery,
  type BookingStatus, type ChannelType, type CreatorBooking,
} from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/dashboard/creator")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Creator dashboard — Creator Connect" },
      { name: "description", content: "Manage your sponsorship listings, requests and payouts." },
      { property: "og:title", content: "Creator dashboard — Creator Connect" },
      { property: "og:description", content: "Manage your sponsorship listings, requests and payouts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatorDashboard,
});

function CreatorDashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const profile = useQuery(profileQuery(user.id));

  const becomeCreator = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ user_type: "creator" }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (profile.isLoading) return <main className="mx-auto max-w-6xl px-4 py-8"><Skeleton className="h-64 rounded-xl" /></main>;
  if (profile.data?.user_type !== "creator")
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold">You're signed up as a Brand / Business</h1>
        <p className="mt-3 text-muted-foreground">Only Creator accounts can post sponsorship slots. Brands post campaign briefs from the brand dashboard instead.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline"><Link to="/dashboard/sponsor" search={{ tab: "campaigns" }}>Go to brand dashboard</Link></Button>
          <Button onClick={() => becomeCreator.mutate()} disabled={becomeCreator.isPending} data-testid="become-creator-btn">Switch to Creator</Button>
        </div>
      </main>
    );

  return <CreatorView userId={user.id} name={profile.data.full_name} />;
}

function CreatorView({ userId, name }: { userId: string; name: string | null }) {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery(creatorBookingsQuery(userId));
  const { data: myListings = [] } = useQuery(myListingsQuery(userId));

  const decline = useServerFn(declineAndRefundBooking);
  const declineM = useMutation({
    mutationFn: async (id: string) => {
      const r = await decline({ data: { bookingId: id } });
      if ("error" in r) throw new Error(r.error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookings"] }); toast("Request declined and sponsor refunded"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; status: BookingStatus; proof_url?: string }) => {
      const { error } = await supabase.from("bookings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = items.filter((b) => b.status === "pending_approval");
  const active = items.filter((b) => b.status === "accepted" || b.status === "published");
  const done = items.filter((b) => b.status === "completed");
  const earnings = items
    .filter((b) => b.status === "published" || b.status === "completed")
    .reduce((s, b) => s + Number(b.total_amount) - Number(b.platform_fee), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Welcome back{name ? `, ${name}` : ""}</p><h1 className="text-4xl font-semibold">Creator dashboard</h1></div>
        <NewListingDialog userId={userId} />
      </div>

      <PayoutsCard />
      <Link to="/account" hash="integrations" className="mt-3 flex items-center gap-3 rounded-xl border border-[#A855F7]/25 bg-[#A855F7]/5 p-4 text-sm transition-colors hover:border-[#A855F7]/50" data-testid="creator-verify-socials-link">
        <BadgeCheck className="size-5 text-[#EC4899]" />
        <span className="flex-1"><span className="font-semibold">Integrations & Verification</span> — add your TikTok and Instagram stats so brands can see your reach.</span>
      </Link>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Summary label="Total earnings" value={formatGBP(earnings)} />
        <Summary label="Active bookings" value={String(active.length)} />
        <Summary label="Pending requests" value={String(pending.length)} highlight />
      </div>

      <Tabs defaultValue="pending" className="mt-10">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({done.length})</TabsTrigger>
        </TabsList>
        {([["pending", pending], ["active", active], ["completed", done]] as const).map(([key, list]) => (
          <TabsContent key={key} value={key} className="mt-4 space-y-3">
            {isLoading && <Skeleton className="h-28 rounded-xl" />}
            {!isLoading && list.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Nothing here yet.</p>}
            {list.map((b) => <BookingRow key={b.id} b={b} onUpdate={(p) => (p.status === "declined" ? declineM.mutate(b.id) : update.mutate({ id: b.id, ...p }))} />)}
          </TabsContent>
        ))}
      </Tabs>

      <MyApplications userId={userId} />

      <h2 className="mt-12 text-2xl font-semibold">Your listings</h2>
      {myListings.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-muted-foreground">No listings yet. Add one to start receiving bookings.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {myListings.map((l) => (
            <div key={l.id} className="rounded-xl border bg-card p-4">
              <Link to="/listing/$id" params={{ id: l.id }} className="block hover:underline">
                <p className="font-semibold">{l.title}</p>
              </Link>
              <p className="text-sm text-muted-foreground">{l.channel_type} · {l.niche} · {formatGBP(Number(l.price_per_slot))}</p>
              <PromoEditor listingId={l.id} current={l.promo_code} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function Summary({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-xl bg-primary p-5 text-primary-foreground" : "rounded-xl border bg-card p-5"}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}

function BookingRow({ b, onUpdate }: { b: CreatorBooking; onUpdate: (p: { status: BookingStatus; proof_url?: string }) => void }) {
  const sponsor = b.sponsor?.company_or_brand_name || b.sponsor?.full_name || "Sponsor";
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2"><span className="font-semibold">{sponsor}</span><StatusBadge status={b.status} /></div>
        <p className="text-sm text-muted-foreground">{b.listing?.title} · {formatDate(b.preferred_date)} · you earn {formatGBP(Number(b.total_amount) - Number(b.platform_fee))}</p>
        <p className="mt-2 text-sm italic">“{b.ad_copy}”</p>
        <a href={b.target_link} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">{b.target_link}</a>
        {b.proof_url && <a href={b.proof_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-sm text-primary">View proof <ExternalLink className="size-3" /></a>}
      </div>
      <div className="flex gap-2">
        {b.status === "pending_approval" && (
          <>
            <Button variant="outline" size="sm" onClick={() => { if (confirm("Decline this request and refund the sponsor?")) onUpdate({ status: "declined" }); }}>Decline & refund</Button>
            <Button size="sm" onClick={() => onUpdate({ status: "accepted" })}>Accept</Button>
          </>
        )}
        {b.status === "accepted" && <ProofDialog onSubmit={(url) => onUpdate({ status: "published", proof_url: url })} />}
        {b.status === "published" && <Button size="sm" variant="outline" onClick={() => onUpdate({ status: "completed" })}>Mark completed</Button>}
      </div>
    </div>
  );
}

function ProofDialog({ onSubmit, label = "Submit proof" }: { onSubmit: (url: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" data-testid="proof-dialog-btn">{label}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit proof of publishing</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(url); setOpen(false); toast.success("Proof submitted"); }} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="proof">Link to the published ad</Label><Input id="proof" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></div>
          <DialogFooter><Button type="submit">Submit</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewListingDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<ChannelType>("Newsletter");
  const [niche, setNiche] = useState("Tech");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async (f: FormData) => {
      const open_rate = String(f.get("open_rate") || "");
      const { error } = await supabase.from("listings").insert({
        creator_id: userId,
        title: String(f.get("title")).trim(),
        channel_type: channel,
        niche,
        audience_size: Number(f.get("audience")),
        avg_open_rate: open_rate ? Number(open_rate) : null,
        price_per_slot: Number(f.get("price")),
        ad_format: String(f.get("format") || "") || null,
        description: String(f.get("description") || "") || null,
        proof_screenshot_url: String(f.get("proof") || "") || null,
        promo_code: String(f.get("promo") || "").trim().toUpperCase() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      setOpen(false);
      toast.success("Listing published");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="border-0 bg-brand-gradient text-white" data-testid="new-listing-btn"><Plus className="size-4" /> Add sponsorship slot</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New sponsorship slot / media kit package</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); }}>
          <div className="space-y-2"><Label htmlFor="t">Title</Label><Input id="t" name="title" required maxLength={120} placeholder="Weekly Tech Trends Newsletter" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as ChannelType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Niche</Label>
              <Select value={niche} onValueChange={setNiche}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label htmlFor="a">Audience</Label><Input id="a" name="audience" type="number" min={0} required /></div>
            <div className="space-y-2"><Label htmlFor="o">Open rate %</Label><Input id="o" name="open_rate" type="number" step="0.1" min={0} max={100} /></div>
            <div className="space-y-2"><Label htmlFor="p">Price (£)</Label><Input id="p" name="price" type="number" min={1} step="0.01" required /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="f">Ad format</Label><Input id="f" name="format" placeholder="100-word main sponsor section with 1 link" /></div>
          <div className="space-y-2"><Label htmlFor="d">Description</Label><Textarea id="d" name="description" rows={3} maxLength={1000} /></div>
          <div className="space-y-2"><Label htmlFor="s">Metrics proof link (optional)</Label><Input id="s" name="proof" type="url" placeholder="https:// screenshot of your analytics" /></div>
          <div className="space-y-2"><Label htmlFor="promo">Promo code (optional)</Label><Input id="promo" name="promo" maxLength={40} placeholder="EARLYBIRD" className="uppercase" />
            <p className="text-xs text-muted-foreground">EARLYBIRD lowers the platform fee to 5% so you keep 95% (first 10 bookings across Creator Connect).</p></div>
          <DialogFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Create listing"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PayoutsCard() {
  const status = useServerFn(getPayoutStatus);
  const link = useServerFn(createPayoutOnboardingLink);
  const q = useQuery({
    queryKey: ["payout-status"],
    queryFn: async () => {
      const r = await status({ data: { environment: getStripeEnvironment() } });
      if ("error" in r) throw new Error(r.error);
      return r;
    },
  });
  const connect = useMutation({
    mutationFn: async () => {
      const r = await link({ data: { environment: getStripeEnvironment(), returnUrl: window.location.origin } });
      if ("error" in r) throw new Error(r.error);
      return r.url;
    },
    onSuccess: (url) => { window.open(url, "_blank", "noopener"); toast("Finish setup in the new tab, then refresh this page."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = q.data;
  const ready = s?.ready;
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
      <Banknote className="size-6 text-primary" />
      <div className="flex-1">
        <p className="font-semibold">Payouts</p>
        <p className="text-sm text-muted-foreground">
          {q.isLoading ? "Checking…" : q.error ? q.error.message : ready ? "Connected — you'll receive 85% of each booking automatically." : s?.connected ? "Setup incomplete — finish verification to start taking bookings." : "Connect a payout account so sponsors can book and pay you."}
        </p>
      </div>
      {!ready && !q.isLoading && (
        <div className="flex gap-2">
          {s?.connected && <Button variant="outline" size="sm" onClick={() => q.refetch()}>Refresh</Button>}
          <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>{s?.connected ? "Continue setup" : "Connect payouts"}</Button>
        </div>
      )}
    </div>
  );
}

function PromoEditor({ listingId, current }: { listingId: string; current: string | null }) {
  const [code, setCode] = useState(current ?? "");
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: async (value: string | null) => {
      const { error } = await supabase.from("listings").update({ promo_code: value }).eq("id", listingId);
      if (error) throw error;
    },
    onSuccess: (_d, value) => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["fee-rate", listingId] });
      if (!value) setCode("");
      toast.success(value ? `${value} applied — platform fee lowered on new bookings` : "Promo code removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); save.mutate(code.trim().toUpperCase() || null); }}>
      <Input aria-label="Promo code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code" maxLength={40} className="h-8 uppercase" />
      <Button type="submit" size="sm" variant="secondary" disabled={save.isPending}>Apply</Button>
      {current && <Button type="button" size="sm" variant="ghost" disabled={save.isPending} onClick={() => save.mutate(null)}>Remove</Button>}
    </form>
  );
}

function MyApplications({ userId }: { userId: string }) {
  const { data: apps = [], isLoading, error } = useQuery(myApplicationsQuery(userId));
  return (
    <section className="mt-12" data-testid="creator-applications">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-semibold">Brand campaign applications</h2>
        <Button asChild size="sm" variant="outline"><Link to="/explore" search={{ tab: "opportunities" }} data-testid="creator-find-opps-btn">Find opportunities</Link></Button>
      </div>
      <div className="mt-4 space-y-3">
        {isLoading && <Skeleton className="h-24 rounded-xl" />}
        {!isLoading && (error || apps.length === 0) && (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No applications yet. Pitch for a brand brief to get hired.</p>
        )}
        {apps.map((a) => <ApplicationRow key={a.id} a={a} />)}
      </div>
    </section>
  );
}

function ApplicationRow({ a }: { a: CreatorApplication }) {
  const qc = useQueryClient();
  const deliver = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase.from("opportunity_applications").update({ status: "delivered", proof_url: url }).eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const brand = a.opportunity?.brand?.company_or_brand_name || a.opportunity?.brand?.full_name || "Brand";
  const share = Number(a.total_amount) - Number(a.platform_fee);
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 md:flex-row md:items-center" data-testid="creator-application-row">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {a.opportunity && <Link to="/opportunity/$id" params={{ id: a.opportunity.id }} className="font-semibold hover:text-primary">{a.opportunity.title}</Link>}
          <ApplicationBadge status={a.status} />
        </div>
        <p className="text-sm text-muted-foreground">{brand} · you earn {formatGBP(share)}{a.promo_code ? ` (${a.promo_code})` : ""}</p>
        {a.proof_url && <a href={a.proof_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary">Your delivered work <ExternalLink className="size-3" /></a>}
      </div>
      {a.status === "accepted" && <ProofDialog label="Submit delivered work" onSubmit={(url) => deliver.mutate(url)} />}
    </div>
  );
}
