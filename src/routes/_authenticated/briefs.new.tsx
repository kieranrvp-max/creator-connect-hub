import { createFileRoute } from "@tanstack/react-router";
import { BrandCampaigns } from "@/components/brand-campaigns";

export const Route = createFileRoute("/_authenticated/briefs/new")({
  staticData: { sitemap: false },
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
