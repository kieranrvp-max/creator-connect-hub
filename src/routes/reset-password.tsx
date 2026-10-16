import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Reset password — Creator Connect" },
      { name: "description", content: "Choose a new password for your Creator Connect account." },
      { property: "og:title", content: "Reset password — Creator Connect" },
      { property: "og:description", content: "Choose a new password for your Creator Connect account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-semibold">Set a new password</h1>
      <form
        className="mt-6 space-y-4 rounded-xl border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const pw = String(new FormData(e.currentTarget).get("pw"));
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) return void toast.error(error.message);
          toast.success("Password updated");
          navigate({ to: "/explore" });
        }}
      >
        <div className="space-y-2"><Label htmlFor="pw">New password</Label><Input id="pw" name="pw" type="password" minLength={8} required /></div>
        <Button type="submit" className="w-full" disabled={busy}>Update password</Button>
      </form>
    </main>
  );
}
