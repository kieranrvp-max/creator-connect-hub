import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { profileQuery } from "@/lib/marketplace";
import { uploadAvatar, useAvatarUrl } from "@/lib/avatar";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/account")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Account settings — Creator Connect" },
      { name: "description", content: "Update your profile, photo, location and bio." },
      { property: "og:title", content: "Account settings — Creator Connect" },
      { property: "og:description", content: "Update your profile, photo, location and bio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const { data: p, isLoading, isError, refetch } = useQuery({
    ...profileQuery(user?.id ?? ""),
    enabled: ready && !!user,
    retry: 1,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const avatarUrl = useAvatarUrl(avatarPath ?? p?.avatar_url);

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadAvatar(user!.id, file);
      setAvatarPath(path);
      const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
      if (error) throw error;
      qc.invalidateQueries();
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = useMutation({
    mutationFn: async (f: FormData) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: String(f.get("name")).trim() || null,
          company_or_brand_name: String(f.get("brand")).trim() || null,
          location: String(f.get("location")).trim() || null,
          bio: String(f.get("bio")).trim() || null,
          website_url: String(f.get("website")).trim() || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!ready || !user) return <main className="mx-auto max-w-md px-4 py-12"><Skeleton className="h-72 rounded-xl" /></main>;

  if (isError) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">We couldn't load your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong while fetching your profile. Please try again.</p>
        <Button className="mt-4" onClick={() => refetch()}>Try again</Button>
      </main>
    );
  }

  if (isLoading) return <main className="mx-auto max-w-md px-4 py-12"><Skeleton className="h-72 rounded-xl" /></main>;

  if (!p) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">No profile found</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your account exists but no profile is attached to it yet. Try signing out and back in, or contact support.</p>
      </main>
    );
  }

  const initial = (p.full_name || p.company_or_brand_name || user.email || "?").charAt(0).toUpperCase();

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-semibold">Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user.email} · {p.user_type === "creator" ? "Creator" : "Sponsor"} account</p>

      <div className="mt-6 flex items-center gap-4 rounded-xl border bg-card p-6">
        <Avatar className="h-20 w-20">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
          <AvatarFallback className="text-2xl">{initial}</AvatarFallback>
        </Avatar>
        <div>
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Camera className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : p.user_type === "creator" ? "Upload profile picture" : "Upload logo"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">JPG or PNG, up to 5 MB, straight from your phone or computer.</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
        </div>
      </div>

      <form className="mt-4 space-y-4 rounded-xl border bg-card p-6" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}>
        <div className="space-y-2"><Label htmlFor="name">{p.user_type === "creator" ? "Display name" : "Your name"}</Label><Input id="name" name="name" defaultValue={p.full_name ?? ""} maxLength={100} /></div>
        <div className="space-y-2"><Label htmlFor="brand">{p.user_type === "creator" ? "Brand name" : "Business name"}</Label><Input id="brand" name="brand" defaultValue={p.company_or_brand_name ?? ""} maxLength={100} /></div>
        <div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" name="location" defaultValue={p.location ?? ""} placeholder="Manchester, UK" maxLength={100} /></div>
        <div className="space-y-2">
          <Label htmlFor="bio">{p.user_type === "creator" ? "Bio — describe your content style and audience" : "About your business — what you sell and who it's for"}</Label>
          <Textarea id="bio" name="bio" defaultValue={p.bio ?? ""} rows={4} maxLength={500} />
        </div>
        <div className="space-y-2"><Label htmlFor="website">Website link</Label><Input id="website" name="website" type="url" defaultValue={p.website_url ?? ""} placeholder="https://" /></div>
        <Button type="submit" disabled={save.isPending}>Save changes</Button>
      </form>
    </main>
  );
}
