import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection, MailLink } from "@/components/legal-page";
import { PLATFORM_FEE_RATE } from "@/lib/marketplace";

const FEE = Math.round(PLATFORM_FEE_RATE * 100);

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Creator Connect" },
      { name: "description", content: "The rules for brands and creators using Creator Connect: account roles, campaign briefs, escrow payments, fees and conduct." },
      { property: "og:title", content: "Terms & Conditions — Creator Connect" },
      { property: "og:description", content: "Account roles, brief rules, escrow and the platform commission on Creator Connect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="These terms apply to everyone who uses Creator Connect, whether you are a brand booking sponsorships or a creator selling them. By creating an account or making a booking you agree to them. If you don't agree, please don't use the platform."
    >
      <LegalSection n={1} title="Account types & roles">
        <p>You must be at least 18 and able to enter a binding contract. Each account is either a <strong>Brand</strong> (sponsor) account or a <strong>Creator</strong> account, chosen when you sign up.</p>
        <p><strong>Brands</strong> agree to:</p>
        <ul>
          <li>give accurate business details and only promote lawful products and services;</li>
          <li>provide ad copy, links and briefs that are truthful and that they have the right to use;</li>
          <li>pay for bookings through Creator Connect and review delivered content promptly and fairly.</li>
        </ul>
        <p><strong>Creators</strong> agree to:</p>
        <ul>
          <li>list only channels they own or control, with honest audience, open-rate and engagement figures;</li>
          <li>publish sponsored content on the agreed date, as described in the listing or brief, and label it as an advert where the law or platform rules require (e.g. #ad under ASA/CAP guidance);</li>
          <li>connect a payout account with our payment processor, Stripe, and handle their own tax on earnings.</li>
        </ul>
        <p>You are responsible for keeping your login secure and for everything done through your account.</p>
      </LegalSection>

      <LegalSection n={2} title="Campaign brief rules">
        <p><strong>Creating campaign briefs is restricted to Brand accounts.</strong> Creator accounts cannot post briefs; they can browse open briefs and pitch to them. A brand that also creates content needs a separate Creator account to sell slots.</p>
        <ul>
          <li>Briefs must describe a real campaign with a genuine budget, clear deliverables and a realistic deadline.</li>
          <li>Briefs must not ask creators to mislead audiences, hide that content is sponsored, or promote anything illegal, unsafe or adult.</li>
          <li>Brands must not use briefs to collect creators' contact details to take deals off the platform.</li>
          <li>We may edit, unpublish or remove any brief or listing that breaks these rules.</li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Escrow & financial terms">
        <p><strong>Payments.</strong> All payments are taken in GBP through Stripe. The brand pays the price shown — there are no extra charges added at checkout.</p>
        <p><strong>Platform commission.</strong> Creator Connect keeps a <strong>{FEE}% platform commission</strong>, which is included in the listed price and taken from the creator's share (the creator receives {100 - FEE}%). Promotional codes may reduce this commission for a limited time; the reduced fee is shown in the checkout breakdown.</p>
        <p><strong>Escrow.</strong> Money for an accepted campaign brief is held in escrow by Creator Connect via Stripe and is not released to the creator until the deliverables are met. Sponsorship slot payments are taken when a brand books and are only kept once the creator accepts the request.</p>
        <p><strong>Release conditions.</strong> Escrowed funds are released to the creator when the brand confirms the content has been published as agreed, or when we confirm it after reviewing proof of publishing if a brand does not respond.</p>
        <p><strong>Refunds.</strong></p>
        <ul>
          <li>Brands can cancel a slot booking for a full refund until the creator accepts it.</li>
          <li>Requests the creator declines, or doesn't answer within 48 hours, are refunded in full automatically.</li>
          <li>If deliverables are not provided, the escrowed amount is refunded to the brand.</li>
          <li>Disputes are reviewed by Creator Connect, and our decision on releasing or refunding escrow is final for the platform.</li>
        </ul>
        <p><strong>No off-platform payments.</strong> Deals found on Creator Connect must be paid through Creator Connect. Avoiding the commission can lead to account suspension.</p>
      </LegalSection>

      <LegalSection n={4} title="Platform conduct & verification">
        <p><strong>Verified Badges.</strong> A creator can earn a Verified Badge by connecting a social account (read-only) or providing proof of their audience metrics that we can confirm. Badges show that we have checked account ownership and figures at that time — not that we endorse a creator. We may remove a badge if the account or figures change or can no longer be verified.</p>
        <p><strong>Prohibited behaviour.</strong> You must not:</p>
        <ul>
          <li>fake or inflate followers, views, open rates or engagement, or buy audiences;</li>
          <li>impersonate another person or brand, or list accounts you do not control;</li>
          <li>harass, threaten or discriminate against other users;</li>
          <li>post hateful, sexual, violent, illegal or infringing content;</li>
          <li>attempt fraud, chargebacks in bad faith, or payments outside the platform;</li>
          <li>scrape, hack, overload or interfere with the service.</li>
        </ul>
        <p>You can report any post with the Report button. We may remove content, withhold badges, or suspend or close accounts that break these terms, and will refund or release escrowed funds fairly where a deal is affected.</p>
      </LegalSection>

      <LegalSection n={5} title="Liability, changes & contact">
        <p>Creator Connect is a marketplace: the sponsorship agreement is between the brand and the creator. We don't guarantee campaign results such as clicks or sales. Nothing in these terms limits rights you have under UK consumer law. These terms are governed by the laws of England and Wales.</p>
        <p>We may update these terms and will show the new date at the top of this page. How we handle personal data is explained in our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. Questions? Email <MailLink />.</p>
      </LegalSection>
    </LegalPage>
  );
}
