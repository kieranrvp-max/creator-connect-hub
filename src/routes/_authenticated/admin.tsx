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
import { formatGBP } from "@/lib/marketplace";
import { ukDayBefore, ukMidnightAfter } from "@/lib/uk-time";

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Admin — Creator Connect" },
      { name: "description", content: "Manage promo and referral codes." },
      { property: "og:title", content: "Admin — Creator Connect" },
      { property: "og:description", content: "Manage promo and referral codes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Code = { code: string; fee_rate: number; max_uses: number | null; active: boolean; expires_at: string | null; referrer_id: string | null; referral_rate: number };
type Form = { code: string; fee: string; unlimited: boolean; maxUses: string; expiry: string; referrer: string; referralPct: string; active: boolean };
const blank: Form = { code: "", fee: "5", unlimited: false, maxUses: "10", expiry: "", referrer: "", referralPct: "0", active: true };

function Admin() {
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState(false);

  const codes = useQuery({
    queryKey: ["admin-codes"], enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Code[];
    },
  });
  const usage = useQuery({
    queryKey: ["admin-usage"], enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_promo_usage");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((u) => [u.code, u]));
    },
  });
  const people = useQuery({
    queryKey: ["admin-people"], enabled: isAdmin,
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, company_or_brand_name, user_type")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const code = f.code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new Error("Code must be 3–20 letters or numbers");
      const fee = Number(f.fee) / 100;
      if (!(fee >= 0 && fee <= 0.15)) throw new Error("Commission must be between 0% and 15%");
      const ref = Number(f.referralPct) / 100;
      if (!(ref >= 0 && ref <= fee)) throw new Error("Referral share can't exceed the commission");
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

  if (!isAdmin) return <main className="mx-auto max-w-md px-4 py-12 text-muted-foreground">This page is for admins only.</main>;

  const name = (id: string | null) => {
    const p = people.data?.find((x) => x.id === id);
    return p ? (p.company_or_brand_name || p.full_name || "Unnamed") : "—";
  };
  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Promo manager</h1>
      <p className="mt-1 text-sm text-muted-foreground">Create, edit or switch off promo and referral codes. Expiry ends at midnight UK time.</p>

      <form className="mt-6 grid gap-4 rounded-xl border bg-card p-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
        <div className="space-y-2"><Label htmlFor="code">Code</Label><Input id="code" value={form.code} disabled={editing} onChange={(e) => set("code", e.target.value)} placeholder="WEEKEND20" maxLength={20} /></div>
        <div className="space-y-2"><Label htmlFor="fee">Commission charged (%)</Label><Input id="fee" type="number" min={0} max={15} step="0.5" value={form.fee} onChange={(e) => set("fee", e.target.value)} /><p className="text-xs text-muted-foreground">Standard is 15%. 5% means a 10-point discount.</p></div>
        <div className="space-y-2">
          <Label htmlFor="max">Usage limit</Label>
          <div className="flex items-center gap-3"><Input id="max" type="number" min={1} value={form.maxUses} disabled={form.unlimited} onChange={(e) => set("maxUses", e.target.value)} /><label className="flex shrink-0 items-center gap-2 text-sm"><Switch checked={form.unlimited} onCheckedChange={(v) => set("unlimited", v)} />Unlimited</label></div>
        </div>
        <div className="space-y-2"><Label htmlFor="exp">Last day valid (optional)</Label><Input id="exp" type="date" value={form.expiry} onChange={(e) => set("expiry", e.target.value)} /></div>
        <div className="space-y-2">
          <Label htmlFor="ref">Referrer (optional)</Label>
          <select id="ref" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.referrer} onChange={(e) => set("referrer", e.target.value)}>
            <option value="">No referrer</option>
            {people.data?.map((p) => <option key={p.id} value={p.id}>{p.company_or_brand_name || p.full_name || "Unnamed"} ({p.user_type === "creator" ? "Creator" : "Brand"})</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label htmlFor="rp">Referrer earns (% of booking)</Label><Input id="rp" type="number" min={0} max={15} step="0.5" value={form.referralPct} onChange={(e) => set("referralPct", e.target.value)} /></div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />Active</label>
        <div className="flex gap-2 sm:justify-end">
          {editing && <Button type="button" variant="ghost" onClick={() => { setForm(blank); setEditing(false); }}>Cancel</Button>}
          <Button type="submit" disabled={save.isPending}>{editing ? "Save changes" : "Create code"}</Button>
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
                  <td className="p-3">{Math.round(c.fee_rate * 1000) / 10}%</td>
                  <td className="p-3">{u?.uses ?? 0} / {c.max_uses ?? "∞"}</td>
                  <td className="p-3">{c.expires_at ? `End of ${ukDayBefore(c.expires_at)}` : "Never"}</td>
                  <td className="p-3">{name(c.referrer_id)}</td>
                  <td className="p-3">{formatGBP(Number(u?.referral_earnings ?? 0))}</td>
                  <td className="p-3">{expired ? "Expired" : c.active ? "Active" : "Off"}</td>
                  <td className="space-x-1 whitespace-nowrap p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(true); setForm({ code: c.code, fee: String(c.fee_rate * 100), unlimited: c.max_uses === null, maxUses: String(c.max_uses ?? 10), expiry: c.expires_at ? ukDayBefore(c.expires_at) : "", referrer: c.referrer_id ?? "", referralPct: String(c.referral_rate * 100), active: c.active }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => toggle.mutate(c)}>{c.active ? "Disable" : "Enable"}</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
