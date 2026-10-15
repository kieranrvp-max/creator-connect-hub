import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

type Search = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//") ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — slot." },
      { name: "description", content: "Sign in or create a creator or sponsor account on slot." },
      { property: "og:title", content: "Sign in — slot." },
      { property: "og:description", content: "Join slot. as a creator or sponsor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [userType, setUserType] = useState<"creator" | "sponsor">("sponsor");
  const [sent, setSent] = useState(false);

  const goNext = async (userId: string) => {
    if (redirect) return navigate({ to: redirect });
    const { data } = await supabase.from("profiles").select("user_type").eq("id", userId).maybeSingle();
    navigate({ to: data?.user_type === "creator" ? "/dashboard/creator" : "/explore" });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) goNext(data.session.user.id); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) goNext(s.user.id); });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const signUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: String(f.get("name")), user_type: userType, company_or_brand_name: String(f.get("brand") || "") || null },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else setSent(true);
  };

  const forgot = async () => {
    const email = (document.getElementById("si-email") as HTMLInputElement | null)?.value;
    if (!email) { toast.error("Enter your email above first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success("Check your email for a reset link");
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  };

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 className="text-4xl font-semibold">Welcome to slot<span className="text-primary">.</span></h1>
      <p className="mt-2 text-muted-foreground">Book or sell micro-sponsorships in minutes.</p>
      <div className="mt-8 rounded-xl border bg-card p-6">
        {sent ? (
          <p className="text-center">Check your email to confirm your account, then come back to sign in.</p>
        ) : (
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">Sign in</TabsTrigger><TabsTrigger value="signup">Create account</TabsTrigger></TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="mt-4 space-y-4">
                <div className="space-y-2"><Label htmlFor="si-email">Email</Label><Input id="si-email" name="email" type="email" required /></div>
                <div className="space-y-2"><Label htmlFor="si-pw">Password</Label><Input id="si-pw" name="password" type="password" required /></div>
                <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
                <button type="button" className="w-full text-center text-sm text-muted-foreground underline" onClick={forgot}>Forgot password?</button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-4 space-y-4">
                <RadioGroup value={userType} onValueChange={(v) => setUserType(v as "creator" | "sponsor")} className="grid grid-cols-2 gap-2">
                  {(["sponsor", "creator"] as const).map((t) => (
                    <Label key={t} htmlFor={`t-${t}`} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 has-[[data-state=checked]]:border-primary">
                      <RadioGroupItem id={`t-${t}`} value={t} /> {t === "sponsor" ? "I'm a sponsor" : "I'm a creator"}
                    </Label>
                  ))}
                </RadioGroup>
                <div className="space-y-2"><Label htmlFor="su-name">Full name</Label><Input id="su-name" name="name" required /></div>
                <div className="space-y-2"><Label htmlFor="su-brand">{userType === "sponsor" ? "Company" : "Brand name"} (optional)</Label><Input id="su-brand" name="brand" /></div>
                <div className="space-y-2"><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" required /></div>
                <div className="space-y-2"><Label htmlFor="su-pw">Password</Label><Input id="su-pw" name="password" type="password" minLength={8} required /></div>
                <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
        <Separator className="my-6" />
        <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
      </div>
    </main>
  );
}
