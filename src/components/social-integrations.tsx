import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Instagram, Music2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialBadge, PLATFORM_LABEL } from "@/components/social-badges";
import { socialAccountsQuery, type SocialAccount, type SocialPlatform } from "@/lib/marketplace";

const PLATFORMS: { key: SocialPlatform; icon: typeof Instagram }[] = [
  { key: "tiktok", icon: Music2 },
  { key: "instagram", icon: Instagram },
];

export function SocialIntegrations({ userId }: { userId: string }) {
  const { data: socials = [], isLoading, error } = useQuery(socialAccountsQuery(userId));
  return (
    <section id="integrations" className="mt-8 scroll-mt-24 rounded-2xl border border-[#A855F7]/25 bg-card/80 p-6 shadow-[0_0_40px_-16px_rgba(168,85,247,0.5)] backdrop-blur-xl" data-testid="integrations-section">
      <h2 className="text-2xl font-semibold">Integrations & Verification</h2>
      <p className="mt-1 text-sm text-muted-foreground">Connect your socials to show a verified badge and live stats on your creator cards. Until a connection is set up, you can enter stats manually — they'll show as Unverified.</p>
      {isLoading ? <Skeleton className="mt-5 h-40 rounded-xl" /> : error ? (
        <p className="mt-5 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Social integrations are launching soon.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {PLATFORMS.map((p) => <PlatformCard key={p.key} platform={p.key} Icon={p.icon} userId={userId} current={socials.find((s) => s.platform === p.key)} />)}
        </div>
      )}
    </section>
  );
}

function PlatformCard({ platform, Icon, userId, current }: { platform: SocialPlatform; Icon: typeof Instagram; userId: string; current: SocialAccount | undefined }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const name = PLATFORM_LABEL[platform];
  const done = () => { qc.invalidateQueries({ queryKey: ["socials"] }); qc.invalidateQueries({ queryKey: ["listings"] }); };
  const save = useMutation({
    mutationFn: async (f: FormData) => {
      const avg = String(f.get("avg") || "");
      const { error } = await supabase.from("social_accounts").upsert(
        { creator_id: userId, platform, handle: String(f.get("handle")).trim().replace(/^@/, ""), followers: Number(f.get("followers")), avg_views: avg ? Number(avg) : null },
        { onConflict: "creator_id,platform" },
      );
      if (error) throw error;
    },
    onSuccess: () => { done(); setEditing(false); toast.success(`${name} stats saved (Unverified)`); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("social_accounts").delete().eq("creator_id", userId).eq("platform", platform);
      if (error) throw error;
    },
    onSuccess: () => { done(); toast(`${name} removed`); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4" data-testid={`integration-${platform}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-white"><Icon className="size-5" /></span>
        <div className="flex-1">
          <p className="font-semibold">{name}</p>
          {current ? <p className="text-xs text-muted-foreground">@{current.handle}</p> : <p className="text-xs text-muted-foreground">Not connected</p>}
        </div>
        <Button size="sm" disabled className="border-0 bg-brand-gradient text-white opacity-60" title="OAuth connection coming soon" data-testid={`connect-${platform}-btn`}>
          Connect {name} · Coming soon
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)} data-testid={`manual-${platform}-btn`}>
          {current ? "Edit stats" : "Enter manually"}
        </Button>
        {current && (
          <Button size="icon" variant="ghost" aria-label={`Remove ${name}`} onClick={() => remove.mutate()} disabled={remove.isPending} data-testid={`remove-${platform}-btn`}><Trash2 className="size-4" /></Button>
        )}
      </div>
      {current && !editing && <div className="mt-3"><SocialBadge s={current} /></div>}
      {editing && (
        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }} data-testid={`manual-${platform}-form`}>
          <div className="space-y-1.5"><Label htmlFor={`${platform}-h`}>Handle</Label><Input id={`${platform}-h`} name="handle" required maxLength={60} defaultValue={current?.handle ?? ""} placeholder="@yourname" data-testid={`manual-${platform}-handle`} /></div>
          <div className="space-y-1.5"><Label htmlFor={`${platform}-f`}>Followers</Label><Input id={`${platform}-f`} name="followers" type="number" min={0} required defaultValue={current?.followers ?? ""} data-testid={`manual-${platform}-followers`} /></div>
          <div className="space-y-1.5"><Label htmlFor={`${platform}-v`}>Avg views</Label><Input id={`${platform}-v`} name="avg" type="number" min={0} defaultValue={current?.avg_views ?? ""} data-testid={`manual-${platform}-avg`} /></div>
          <Button type="submit" disabled={save.isPending} data-testid={`manual-${platform}-save`}>Save</Button>
          <p className="text-xs text-muted-foreground sm:col-span-4">Manual stats are labelled “Unverified” until you connect {name}.</p>
        </form>
      )}
    </div>
  );
}
