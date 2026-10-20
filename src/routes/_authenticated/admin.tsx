import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatGBP } from "@/lib/marketplace";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { STANDARD_FEE_PCT, discountFromFeeRate, feeRateFromDiscount, promoSplit } from "@/lib/promo-math";
import { ukDayBefore, ukMidnightAfter } from "@/lib/uk-time";
import { adminRefundApplication, adminRefundBooking, adminReleaseApplication } from "@/utils/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Admin — Creator Connect" },
      { name: "description", content: "Creator Connect admin dashboard." },
      { property: "og:title", content: "Admin — Creator Connect" },
      { property: "og:description", content: "Creator Connect admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Code = { code: string; fee_rate: number; max_uses: number | null; active: boolean; expires_at: string | null; referrer_id: string | null; referral_rate: number };
type Form = { code: string; fee: string; unlimited: boolean; maxUses: string; expiry: string; referrer: string; referralPct: string; active: boolean };
const blank: Form = { code: "", fee: "5", unlimited: false, maxUses: "10", expiry: "", referrer: "", referralPct: "2.5", active: true };

type Person = { id: string; full_name: string | null; company_or_brand_name: string | null; user_type: string; email: string | null };

function ReferrerPicker({ people, value, onChange }: { people: Person[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const label = (p: Person) => p.company_or_brand_name || p.full_name || p.email || "Unnamed";
  const current = people.find((p) => p.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal" data-testid="referrer-picker">
          <span className="truncate">{current ? label(current) : "No referrer"}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search name or email…" />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none no referrer" onSelect={() => { onChange(""); setOpen(false); }}>
                <Check className={`mr-2 size-4 ${value ? "opacity-0" : "opacity-100"}`} />No referrer
              </CommandItem>
              {people.map((p) => (
                <CommandItem key={p.id} value={`${p.id} ${p.full_name ?? ""} ${p.company_or_brand_name ?? ""} ${p.email ?? ""}`} onSelect={() => { onChange(p.id); setOpen(false); }}>
                  <Check className={`mr-2 size-4 shrink-0 ${value === p.id ? "opacity-100" : "opacity-0"}`} />
                  <div className="min-w-0">
                    <p className="truncate">{label(p)} <span className="text-xs text-muted-foreground">({p.user_type === "creator" ? "Creator" : "Brand"})</span></p>
                    {p.email && <p className="truncate text-xs text-muted-foreground">{p.email}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function Admin() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return <main className="mx-auto max-w-md px-4 py-12 text-muted-foreground">This page is for admins only.</main>;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Platform controls for Creator Connect.</p>
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex w-full flex-nowrap justify-start gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x pb-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="escrow">Escrow</TabsTrigger>
          <TabsTrigger value="announce">Announcements</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="promo">Promo codes</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="users"><Users /></TabsContent>
        <TabsContent value="escrow"><Escrow /></TabsContent>
        <TabsContent value="announce"><Announcements /></TabsContent>
        <TabsContent value="reports"><Reports /></TabsContent>
        <TabsContent value="promo"><Promo /></TabsContent>
      </Tabs>
    </main>
  );
}

function Overview() {
  const metrics = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_metrics");
      if (error) throw error;
      return data?.[0];
    },
  });
  const m = metrics.data;
  const cards = [
    { label: "Creators", value: m?.creators ?? "…" },
    { label: "Brands", value: m?.brands ?? "…" },
    { label: "Active deals", value: m?.active_deals ?? "…" },
    { label: "Gross volume", value: m ? formatGBP(Number(m.gross_volume)) : "…" },
    { label: "Platform revenue", value: m ? formatGBP(Number(m.net_revenue)) : "…" },
  ];
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

type Person = { id: string; full_name: string | null; company_or_brand_name: string | null; user_type: string; verified_badge: boolean; suspended: boolean };

function Users() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const people = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, company_or_brand_name, user_type, verified_badge, suspended").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Person[];
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { verified_badge?: boolean; suspended?: boolean } }) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const filtered = (people.data ?? []).filter((p) => {
    const s = `${p.full_name ?? ""} ${p.company_or_brand_name ?? ""}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });
  return (
    <div className="mt-4 space-y-3">
      <Input placeholder="Search by name or business…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Verified badge</th><th className="p-3">Suspended</th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">{p.company_or_brand_name || p.full_name || "Unnamed"}</td>
                <td className="p-3">{p.user_type === "creator" ? "Creator" : "Brand"}</td>
                <td className="p-3"><Switch checked={p.verified_badge} onCheckedChange={(v) => update.mutate({ id: p.id, patch: { verified_badge: v } })} /></td>
                <td className="p-3"><Switch checked={p.suspended} onCheckedChange={(v) => update.mutate({ id: p.id, patch: { suspended: v } })} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No users match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type PaidBooking = { id: string; total_amount: number; status: string; paid_at: string | null; listing: { title: string } | null; sponsor: { full_name: string | null } | null };
type PaidApp = { id: string; total_amount: number; status: string; paid_at: string | null; opportunity: { title: string } | null; creator: { full_name: string | null } | null };

function Escrow() {
  const qc = useQueryClient();
  const bookings = useQuery({
    queryKey: ["admin-escrow-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("id, total_amount, status, paid_at, listing:listings(title), sponsor:profiles!bookings_sponsor_id_fkey(full_name)").eq("payment_status", "paid").order("paid_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PaidBooking[];
    },
  });
  const apps = useQuery({
    queryKey: ["admin-escrow-apps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunity_applications").select("id, total_amount, status, paid_at, opportunity:opportunities(title), creator:profiles!opportunity_applications_creator_id_fkey(full_name)").eq("payment_status", "paid").order("paid_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PaidApp[];
    },
  });
  const act = useMutation({
    mutationFn: async ({ kind, id, action }: { kind: "booking" | "application"; id: string; action: "release" | "refund" }) => {
      if (kind === "booking") {
        if (action === "refund") await adminRefundBooking({ data: { bookingId: id } });
        else throw new Error("Bookings pay out via Stripe Connect automatically");
      } else if (action === "release") await adminReleaseApplication({ data: { applicationId: id } });
      else await adminRefundApplication({ data: { applicationId: id } });
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Done"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Paid bookings</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-3">Listing</th><th className="p-3">Sponsor</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>
              {(bookings.data ?? []).map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3">{b.listing?.title ?? "—"}</td>
                  <td className="p-3">{b.sponsor?.full_name ?? "—"}</td>
                  <td className="p-3">{formatGBP(Number(b.total_amount))}</td>
                  <td className="p-3">{b.status}</td>
                  <td className="p-3 text-right"><Button size="sm" variant="outline" disabled={act.isPending} onClick={() => { if (confirm("Refund this booking to the sponsor?")) act.mutate({ kind: "booking", id: b.id, action: "refund" }); }}>Issue refund</Button></td>
                </tr>
              ))}
              {(bookings.data ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No paid bookings.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold">Funded applications (escrow)</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-3">Brief</th><th className="p-3">Creator</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>
              {(apps.data ?? []).map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.opportunity?.title ?? "—"}</td>
                  <td className="p-3">{a.creator?.full_name ?? "—"}</td>
                  <td className="p-3">{formatGBP(Number(a.total_amount))}</td>
                  <td className="p-3">{a.status}</td>
                  <td className="space-x-1 whitespace-nowrap p-3 text-right">
                    {a.status !== "released" && <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => { if (confirm("Force-release escrow funds to the creator?")) act.mutate({ kind: "application", id: a.id, action: "release" }); }}>Force release</Button>}
                    <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => { if (confirm("Refund this application to the brand?")) act.mutate({ kind: "application", id: a.id, action: "refund" }); }}>Issue refund</Button>
                  </td>
                </tr>
              ))}
              {(apps.data ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No funded applications.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Announcements() {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const list = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const publish = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("announcements").update({ active: false }).eq("active", true);
      if (error) throw error;
      const { error: e2 } = await supabase.from("announcements").insert({ message, active: true });
      if (e2) throw e2;
    },
    onSuccess: () => { setMessage(""); qc.invalidateQueries({ queryKey: ["admin-announcements"] }); qc.invalidateQueries({ queryKey: ["announcement"] }); toast.success("Banner published"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); qc.invalidateQueries({ queryKey: ["announcement"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-3 rounded-xl border bg-card p-6">
        <Label htmlFor="ann">App-wide banner message</Label>
        <Input id="ann" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Early access: 5% fees with EARLYBIRD this week" maxLength={200} />
        <Button disabled={!message.trim() || publish.isPending} onClick={() => publish.mutate()}>Publish banner</Button>
        <p className="text-xs text-muted-foreground">Publishing replaces any currently active banner.</p>
      </div>
      {(list.data ?? []).map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <p className="text-sm">{a.message}</p>
          <label className="flex shrink-0 items-center gap-2 text-sm"><Switch checked={a.active} onCheckedChange={(v) => toggle.mutate({ id: a.id, active: v })} />{a.active ? "On" : "Off"}</label>
        </div>
      ))}
    </div>
  );
}

function Reports() {
  const qc = useQueryClient();
  const reports = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("id, reason, resolved, created_at, listing:listings(title), opportunity:opportunities(title)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").update({ resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const rows = reports.data ?? [];
  return (
    <div className="mt-4 space-y-3">
      {rows.length === 0 && <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">No reported content. flagged posts will appear here.</p>}
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <div>
            <p className="text-sm font-medium">{r.listing?.title ?? r.opportunity?.title ?? "Content"}</p>
            <p className="text-sm text-muted-foreground">{r.reason}</p>
          </div>
          {r.resolved ? <span className="text-xs text-muted-foreground">Resolved</span> : <Button size="sm" variant="outline" onClick={() => resolve.mutate(r.id)}>Mark resolved</Button>}
        </div>
      ))}
    </div>
  );
}

function Promo() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState(false);

  const codes = useQuery({
    queryKey: ["admin-codes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Code[];
    },
  });
  const usage = useQuery({
    queryKey: ["admin-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_promo_usage");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((u) => [u.code, u]));
    },
  });
  const people = useQuery({
    queryKey: ["admin-people"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_user_directory");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const code = f.code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new Error("Code must be 3–20 letters or numbers");
      const fee = feeRateFromDiscount(Number(f.fee));
      const ref = Number(f.referralPct) / 100;
      if (!(ref >= 0 && ref <= fee)) throw new Error("Referral share can't exceed the fee charged");
      const max = f.unlimited ? null : Math.floor(Number(f.maxUses));
      if (max !== null && !(max > 0)) throw new Error("Usage limit must be at least 1");
      const row = {
        code, fee_rate: fee, max_uses: max, active: f.active,
        expires_at: f.expiry ? ukMidnightAfter(f.expiry).toISOString() : null,
        referrer_id: f.referrer || null, referral_rate: ref,
      };
      const { error } = editing
        ? await supabase.from("promo_codes").update(row).eq("code", code)
        : await supabase.from("promo_codes").insert(row);
      if (error) throw new Error(error.code === "23505" ? "That code already exists" : error.message);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-codes"] }); qc.invalidateQueries({ queryKey: ["admin-usage"] }); setForm(blank); setEditing(false); toast.success("Code saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (c: Code) => {
      const { error } = await supabase.from("promo_codes").update({ active: !c.active }).eq("code", c.code);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-codes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const name = (id: string | null) => {
    const p = people.data?.find((x) => x.id === id);
    return p ? (p.company_or_brand_name || p.full_name || p.email || "Unnamed") : "—";
  };
  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const split = (() => {
    try { return promoSplit(Number(form.fee), Number(form.referralPct) || 0); } catch { return null; }
  })();

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">Create, edit or switch off promo and referral codes. Expiry ends at midnight UK time.</p>
      <form className="mt-4 grid gap-4 rounded-xl border bg-card p-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
        <div className="space-y-2"><Label htmlFor="code">Code</Label><Input id="code" value={form.code} disabled={editing} onChange={(e) => set("code", e.target.value)} placeholder="BAKE5" maxLength={20} /></div>
        <div className="space-y-2"><Label htmlFor="fee">Commission Discount (%)</Label><Input id="fee" type="number" min={0} max={STANDARD_FEE_PCT} step="0.5" value={form.fee} onChange={(e) => set("fee", e.target.value)} /><p className="text-xs text-muted-foreground">Taken off the standard {STANDARD_FEE_PCT}% fee. 5 means a 10% fee.</p></div>
        <div className="space-y-2">
          <Label htmlFor="max">Usage limit</Label>
          <div className="flex items-center gap-3"><Input id="max" type="number" min={1} value={form.maxUses} disabled={form.unlimited} onChange={(e) => set("maxUses", e.target.value)} /><label className="flex shrink-0 items-center gap-2 text-sm"><Switch checked={form.unlimited} onCheckedChange={(v) => set("unlimited", v)} />Unlimited</label></div>
        </div>
        <div className="space-y-2"><Label htmlFor="exp">Last day valid (optional)</Label><Input id="exp" type="date" value={form.expiry} onChange={(e) => set("expiry", e.target.value)} /></div>
        <div className="space-y-2">
          <Label>Referrer (optional)</Label>
          <ReferrerPicker people={people.data ?? []} value={form.referrer} onChange={(v) => set("referrer", v)} />
        </div>
        <div className="space-y-2"><Label htmlFor="rp">Referrer earns (% of booking)</Label><Input id="rp" type="number" min={0} max={STANDARD_FEE_PCT} step="0.5" value={form.referralPct} onChange={(e) => set("referralPct", e.target.value)} /></div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm sm:col-span-2" aria-live="polite" data-testid="promo-split-preview">
          {split ? (
            <ul className="space-y-1">
              <li><span className="font-semibold">User charged fee: {split.charged}%</span> <span className="text-muted-foreground">({STANDARD_FEE_PCT}% standard − {Number(form.fee) || 0}% discount)</span></li>
              <li><span className="font-semibold">Referrer payout: {split.referrer}%</span> <span className="text-muted-foreground">of booking{form.referrer ? "" : " (pick a referrer to apply)"}</span></li>
              <li><span className="font-semibold">Platform net revenue: {form.referrer ? split.platform : split.charged}%</span> <span className="text-muted-foreground">before Stripe card fees</span></li>
              <li className="text-muted-foreground">Creator receives {split.creator}%. On a £100 booking: creator {formatGBP(split.creator)}, referrer {formatGBP(form.referrer ? split.referrer : 0)}, Creator Connect {formatGBP(form.referrer ? split.platform : split.charged)}.</li>
            </ul>
          ) : <p className="text-destructive">Discount must be 0–{STANDARD_FEE_PCT}% and the referrer share can't be more than the fee charged.</p>}
        </div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />Active</label>
        <div className="flex gap-2 sm:justify-end">
          {editing && <Button type="button" variant="ghost" onClick={() => { setForm(blank); setEditing(false); }}>Cancel</Button>}
          <Button type="submit" disabled={save.isPending || !split}>{editing ? "Save changes" : "Create code"}</Button>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Code</th><th className="p-3">Fee</th><th className="p-3">Uses</th><th className="p-3">Expires</th><th className="p-3">Referrer</th><th className="p-3">Referral owed</th><th className="p-3">Status</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {codes.data?.map((c) => {
              const u = usage.data?.[c.code];
              const expired = c.expires_at && new Date(c.expires_at) <= new Date();
              return (
                <tr key={c.code} className="border-t">
                  <td className="p-3 font-mono font-semibold">{c.code}</td>
                  <td className="whitespace-nowrap p-3">{Math.round(c.fee_rate * 1000) / 10}% <span className="text-xs text-muted-foreground">(−{discountFromFeeRate(c.fee_rate)}%)</span></td>
                  <td className="p-3">{u?.uses ?? 0} / {c.max_uses ?? "∞"}</td>
                  <td className="p-3">{c.expires_at ? `End of ${ukDayBefore(c.expires_at)}` : "Never"}</td>
                  <td className="p-3">{name(c.referrer_id)}</td>
                  <td className="p-3">{formatGBP(Number(u?.referral_earnings ?? 0))}</td>
                  <td className="p-3">{expired ? "Expired" : c.active ? "Active" : "Off"}</td>
                  <td className="space-x-1 whitespace-nowrap p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(true); setForm({ code: c.code, fee: String(discountFromFeeRate(c.fee_rate)), unlimited: c.max_uses === null, maxUses: String(c.max_uses ?? 10), expiry: c.expires_at ? ukDayBefore(c.expires_at) : "", referrer: c.referrer_id ?? "", referralPct: String(Math.round(c.referral_rate * 10000) / 100), active: c.active }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => toggle.mutate(c)}>{c.active ? "Disable" : "Enable"}</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
