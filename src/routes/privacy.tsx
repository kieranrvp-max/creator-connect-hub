import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection, MailLink } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Privacy Policy — Creator Connect" },
      { name: "description", content: "How Creator Connect collects, uses, shares and deletes your personal data, including social account verification data." },
      { property: "og:title", content: "Privacy Policy — Creator Connect" },
      { property: "og:description", content: "What data Creator Connect collects, why, who it's shared with and how to delete it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Creator Connect is a UK marketplace that connects brands with niche creators for micro-sponsorships. This policy explains what personal data we collect, why we use it, who we share it with and how you can have it deleted. We process data in line with the UK GDPR and the Data Protection Act 2018."
    >
      <LegalSection n={1} title="Information we collect">
        <p><strong>Account information.</strong> When you sign up we collect your email address, password (stored only in hashed form), account type (Creator or Brand) and basic sign-in metadata such as the date you joined and when you last signed in. If you sign in with Google we receive your name and email address from Google.</p>
        <p><strong>Profile details.</strong> Anything you add to your profile: display or business name, photo or logo, location, bio, website and social links, plus listing and campaign brief content you publish.</p>
        <p><strong>Social account data.</strong> If you connect a social account (for example TikTok, Instagram or YouTube) we request <strong>read-only access to basic profile information and metrics</strong> — such as your handle, display name, follower count and public engagement figures. We use this strictly to verify that you own the account and to show accurate audience figures. We never post on your behalf, read private messages or access content you have not made public.</p>
        <p><strong>Bookings and payments.</strong> Records of sponsorship requests, ad copy, target links, dates and payment status. Card details are entered directly with our payment processor, Stripe — we never see or store your full card number.</p>
        <p><strong>Messages and reports.</strong> Messages you send through our contact form and any posts you report to us.</p>
        <p><strong>Technical data.</strong> Basic device, browser and log information needed to keep the service running and secure.</p>
      </LegalSection>

      <LegalSection n={2} title="How we use your data">
        <ul>
          <li><strong>Identity and authentication</strong> — to create your account, sign you in, confirm your email address and recover your password.</li>
          <li><strong>Verified Badges</strong> — to check that a creator controls the social accounts and audience figures they list, and to award or remove a Verified Badge.</li>
          <li><strong>Campaign briefs and bookings</strong> — to publish listings and briefs, pass a brand's brief and ad copy to the creator, track deal progress and process payments, refunds and payouts.</li>
          <li><strong>Platform security</strong> — to prevent fraud, spam and abuse, review reported posts, suspend accounts that break our <Link to="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>, and keep accurate financial records.</li>
          <li><strong>Support</strong> — to reply when you contact us.</li>
        </ul>
        <p>Our legal bases are performing our contract with you, our legitimate interest in running a safe marketplace, and meeting legal obligations such as tax and anti-fraud record keeping. We do not sell your data and do not use it for third-party advertising.</p>
      </LegalSection>

      <LegalSection n={3} title="Data sharing & escrow">
        <p><strong>Other users.</strong> Your public profile, listings, briefs, social handles and Verified Badge are visible to visitors. When you book or pitch, the other party sees the details needed to deliver the deal.</p>
        <p><strong>Third-party services.</strong> We share only what is needed with the providers that run the platform:</p>
        <ul>
          <li><strong>Stripe</strong> — card payments, escrow holding, refunds and creator payouts (including identity checks Stripe requires for payouts).</li>
          <li><strong>Social platforms</strong> (e.g. TikTok, Instagram, YouTube) — read-only verification when you choose to connect an account.</li>
          <li><strong>Hosting, database, authentication and email providers</strong> — to store your data securely and send account emails.</li>
        </ul>
        <p><strong>Escrow records.</strong> We keep records of every payment held in escrow, released to a creator or refunded to a brand, so that disputes can be resolved and our accounts are accurate.</p>
        <p><strong>No unauthorised disclosure.</strong> We never disclose your personal data to unauthorised third parties. We only share it beyond the providers above if the law requires it, to protect users from fraud or harm, or with your consent.</p>
      </LegalSection>

      <LegalSection n={4} title="Data retention & deletion">
        <p>We keep your data while your account is open. Payment and escrow records are kept for as long as UK tax and accounting law requires (normally six years), even after an account is closed. Contact messages and reports are kept only as long as needed to deal with them.</p>
        <p><strong>Deleting your account or data.</strong> You can delete your listings and briefs at any time from your dashboard, and edit or clear your profile from your Account page. To delete your whole account and personal data, or to disconnect a social account and remove the data we received from it, email <MailLink /> from the address you signed up with. We will confirm and complete deletion within 30 days, keeping only the financial records we are legally required to hold.</p>
        <p><strong>Your rights.</strong> You can ask to access, correct, export or restrict the use of your data, or object to how we use it, by emailing <MailLink />. If you are unhappy with our response you can complain to the UK Information Commissioner's Office (ico.org.uk).</p>
      </LegalSection>

      <LegalSection n={5} title="Contact">
        <p>Questions about this policy? Email <MailLink /> or use our <Link to="/contact" className="text-primary hover:underline">contact page</Link>.</p>
      </LegalSection>
    </LegalPage>
  );
}
