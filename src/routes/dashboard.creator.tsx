import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { bookings as seed, CHANNELS, NICHES, formatGBP, getListing, type Booking } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/creator")({
  head: () => ({
    meta: [
      { title: "Creator dashboard — slot." },
      { name: "description", content: "Manage your sponsorship listings, requests and payouts." },
      { property: "og:title", content: "Creator dashboard — slot." },
      { property: "og:description", content: "Manage your sponsorship listings, requests and payouts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatorDashboard,
});

function CreatorDashboard() {
  const [items, setItems] = useState<Booking[]>(seed);
  const pending = items.filter((b) => b.status === "pending_approval");
  const active = items.filter((b) => b.status === "accepted" || b.status === "published");
  const done = items.filter((b) => b.status === "completed");
  const earnings = items.filter((b) => b.status === "published" || b.status === "completed").reduce((s, b) => s + b.total_amount, 0);

  const update = (id: string, patch: Partial<Booking>) => setItems((xs) => xs.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Welcome back, Maya</p><h1 className="text-4xl font-semibold">Creator dashboard</h1></div>
        <NewListingDialog />
      </div>

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
            {list.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Nothing here yet.</p>}
            {list.map((b) => <BookingRow key={b.id} b={b} update={update} />)}
          </TabsContent>
        ))}
      </Tabs>
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

function BookingRow({ b, update }: { b: Booking; update: (id: string, p: Partial<Booking>) => void }) {
  const listing = getListing(b.listing_id);
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2"><span className="font-semibold">{b.sponsor}</span><StatusBadge status={b.status} /></div>
        <p className="text-sm text-muted-foreground">{listing?.title} · {new Date(b.preferred_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {formatGBP(b.total_amount)}</p>
        <p className="mt-2 text-sm italic">“{b.ad_copy}”</p>
        {b.proof_url && <a href={b.proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary">View proof <ExternalLink className="size-3" /></a>}
      </div>
      <div className="flex gap-2">
        {b.status === "pending_approval" && (
          <>
            <Button variant="outline" size="sm" onClick={() => { update(b.id, { status: "declined" }); toast("Request declined"); }}>Decline</Button>
            <Button size="sm" onClick={() => { update(b.id, { status: "accepted" }); toast.success("Request accepted"); }}>Accept</Button>
          </>
        )}
        {b.status === "accepted" && <ProofDialog onSubmit={(url) => update(b.id, { status: "published", proof_url: url })} />}
      </div>
    </div>
  );
}

function ProofDialog({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Submit proof</Button></DialogTrigger>
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

function NewListingDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" /> Add new listing</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New listing</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setOpen(false); toast.success("Listing created (demo)"); }}>
          <div className="space-y-2"><Label htmlFor="t">Title</Label><Input id="t" required placeholder="Weekly Tech Trends Newsletter" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Channel</Label>
              <Select defaultValue="Newsletter"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Niche</Label>
              <Select defaultValue="Tech"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label htmlFor="a">Audience</Label><Input id="a" type="number" min={0} required /></div>
            <div className="space-y-2"><Label htmlFor="o">Open rate %</Label><Input id="o" type="number" step="0.1" /></div>
            <div className="space-y-2"><Label htmlFor="p">Price (£)</Label><Input id="p" type="number" min={1} required /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="f">Ad format</Label><Input id="f" placeholder="100-word main sponsor section with 1 link" /></div>
          <div className="space-y-2"><Label htmlFor="d">Description</Label><Textarea id="d" rows={3} /></div>
          <div className="space-y-2"><Label htmlFor="s">Metrics screenshot</Label><Input id="s" type="file" accept="image/*" /></div>
          <DialogFooter><Button type="submit">Create listing</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
