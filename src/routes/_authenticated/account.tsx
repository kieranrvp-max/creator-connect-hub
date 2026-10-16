import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { profileQuery } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/account")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Account settings — Creator Connect" },
      { name: "description", content: "Update your name, brand and account type." },
      { property: "og:title", content: "Account settings — Creator Connect" },
      { property: "og:description", content: "Update your name, brand and account type." },
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

  if (isLoading || !p) return <main className="mx-auto max-w-md px-4 py-12"><Skeleton className="h-72 rounded-xl" /></main>;

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-semibold">Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user.email} · {p.user_type === "creator" ? "Creator" : "Sponsor"} account</p>
      <form className="mt-6 space-y-4 rounded-xl border bg-card p-6" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}>
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" defaultValue={p.full_name ?? ""} maxLength={100} /></div>
        <div className="space-y-2"><Label htmlFor="brand">{p.user_type === "creator" ? "Brand name" : "Company"}</Label><Input id="brand" name="brand" defaultValue={p.company_or_brand_name ?? ""} maxLength={100} /></div>
        <div className="space-y-2"><Label htmlFor="avatar">Avatar image link</Label><Input id="avatar" name="avatar" type="url" defaultValue={p.avatar_url ?? ""} placeholder="https://" /></div>
        <Button type="submit" disabled={save.isPending}>Save changes</Button>
      </form>
    </main>
  );
}
