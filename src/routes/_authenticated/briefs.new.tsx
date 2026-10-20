import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandCampaigns } from "@/components/brand-campaigns";

const BRIEFS_RESERVED_MSG = "Brief creation is reserved for Brand accounts.";

export const Route = createFileRoute("/_authenticated/briefs/new")({
  staticData: { sitemap: false },
  beforeLoad: async ({ context }) => {
    const [{ data: profile }, { data: isAdmin }] = await Promise.all([
      supabase.from("profiles").select("user_type").eq("id", context.user.id).maybeSingle(),
      supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" }),
    ]);
    if (profile?.user_type === "creator" && !isAdmin) {
      toast.error(BRIEFS_RESERVED_MSG);
      throw redirect({ to: "/explore", search: { tab: "opportunities" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Post a campaign brief — Creator Connect" },
      { name: "description", content: "Post a campaign brief and let niche creators pitch to your brand." },
      { property: "og:title", content: "Post a campaign brief — Creator Connect" },
      { property: "og:description", content: "Post a campaign brief and let niche creators pitch to your brand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewBrief,
});

function NewBrief() {
  const { user } = Route.useRouteContext();
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-4 text-3xl font-semibold">Your campaign briefs</h1>
      <BrandCampaigns userId={user.id} openNew />
    </main>
  );
}
