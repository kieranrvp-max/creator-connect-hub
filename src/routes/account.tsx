import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialIntegrations } from "@/components/social-integrations";
import { ROLE_LABEL, profileQuery, type UserType } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Account settings — Creator Connect" },
      { name: "description", content: "Update your name, brand, account role and social verification." },
      { property: "og:title", content: "Account settings — Creator Connect" },
      { property: "og:description", content: "Update your name, brand, account role and social verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

function Account() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery(profileQuery(user.id));

  const save = useMutation({
    mutationFn: async (f: FormData) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: String(f.get("name")).trim() || null,
          company_or_brand_name: String(f.get("brand")).trim() || null,
          avatar_url: String(f.get("avatar")).trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !p) return <main className="mx-auto max-w-2xl px-4 py-12"><Skeleton className="h-72 rounded-xl" /></main>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Account</h1>
      <p className="mt-1 text-sm text-muted-foreground" data-testid="account-role-label">{user.email} · {ROLE_LABEL[p.user_type]} account</p>
      <RoleSwitcher userId={user.id} role={p.user_type} />
      <form className="mt-6 space-y-4 rounded-xl border bg-card p-6" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}>
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" defaultValue={p.full_name ?? ""} maxLength={100} /></div>
        <div className="space-y-2"><Label htmlFor="brand">{p.user_type === "creator" ? "Brand name" : "Company"}</Label><Input id="brand" name="brand" defaultValue={p.company_or_brand_name ?? ""} maxLength={100} /></div>
        <div className="space-y-2"><Label htmlFor="avatar">Avatar image link</Label><Input id="avatar" name="avatar" type="url" defaultValue={p.avatar_url ?? ""} placeholder="https://" /></div>
        <Button type="submit" disabled={save.isPending} data-testid="account-save-btn">Save changes</Button>
      </form>
      {p.user_type === "creator" && <SocialIntegrations userId={user.id} />}
    </main>
  );
}

const ROLE_HELP: Record<UserType, string> = {
  creator: "Post sponsorship slots & media kit packages, and pitch for brand briefs.",
  sponsor: "Post campaign opportunities & briefs, and book creator slots.",
};

function RoleSwitcher({ userId, role }: { userId: string; role: UserType }) {
  const qc = useQueryClient();
  const [pending, setPending] = useState<UserType | null>(null);
  const change = useMutation({
    mutationFn: async (next: UserType) => {
      const { error } = await supabase.from("profiles").update({ user_type: next }).eq("id", userId);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => { qc.invalidateQueries(); toast.success(`You're now a ${ROLE_LABEL[next]} account`); },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setPending(null),
  });
  const pick = (next: UserType) => {
    if (next === role) return;
    if (!confirm(`Switch your account to ${ROLE_LABEL[next]}? Your existing posts stay live, but you'll only be able to create ${next === "creator" ? "sponsorship slots" : "campaign briefs"}.`)) return;
    setPending(next);
    change.mutate(next);
  };
  return (
    <div className="mt-6 rounded-xl border bg-card p-6" data-testid="role-switcher">
      <p className="font-semibold">Account role</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(["creator", "sponsor"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => pick(r)}
            disabled={change.isPending}
            data-testid={`role-option-${r}`}
            aria-pressed={role === r}
            className={cn(
              "rounded-xl border p-4 text-left transition-[border-color,box-shadow,background-color]",
              role === r ? "border-[#A855F7] bg-[#A855F7]/10 shadow-[0_0_20px_-6px_rgba(168,85,247,0.6)]" : "border-white/10 hover:border-white/25",
            )}
          >
            <p className="font-semibold">{ROLE_LABEL[r]}{role === r && <span className="ml-2 text-xs text-[#EC4899]">Current</span>}{pending === r && <span className="ml-2 text-xs text-muted-foreground">Switching…</span>}</p>
            <p className="mt-1 text-xs text-muted-foreground">{ROLE_HELP[r]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
