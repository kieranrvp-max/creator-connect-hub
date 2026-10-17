import { createFileRoute } from "@tanstack/react-router";
import { ContactForm, ContactLinks } from "@/components/contact-form";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Contact us — Creator Connect" },
      { name: "description", content: "Get in touch with the Creator Connect team by email, Instagram or our contact form." },
      { property: "og:title", content: "Contact us — Creator Connect" },
      { property: "og:description", content: "Questions about sponsorships or payouts? Message the Creator Connect team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold">Contact us</h1>
      <p className="mt-2 text-muted-foreground">Questions about listings, sponsorships or payouts? We're here to help.</p>
      <div className="mt-6"><ContactLinks /></div>
      <div className="mt-8 rounded-2xl border bg-card/60 p-6 backdrop-blur"><ContactForm /></div>
    </main>
  );
}
