import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creator Connect — Micro-sponsorship marketplace" },
      { name: "description", content: "Connect brands with niche creators for one-off sponsorships on Creator Connect." },
      { property: "og:title", content: "Creator Connect — Micro-sponsorship marketplace" },
      { property: "og:description", content: "Connect brands with niche creators for one-off sponsorships on Creator Connect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/explore" });
  },
});
