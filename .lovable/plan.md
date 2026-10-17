# Creator Connect — platform update (staged)

Your document cuts off partway through section 4 ("Niche (Tech, Lifestyle,"). Sections 0–3 and the start of 4 are planned below; please resend the rest (hero, contact/support, visual polish) and it will be added as a later stage.

This is a large update, so it is split into stages that each ship and get checked on their own. That keeps each step reliable and spreads out credit use.

## Stage 1 — Admin access and promo code manager
- Give kieran@creatorconnecthub.co.uk an admin role, stored in its own protected list rather than on the profile, so nobody can give themselves admin.
- Admin-only bar at the top of every page: Total Users, Active Listings, Deals Completed.
- New Admin page with a Promo Manager: create, edit and disable codes; set the discount (commission rate), an "Unlimited" toggle or a use cap, an expiry date that ends at midnight UK time (handles BST/GMT), and an optional linked referrer account.
- Referral tracking: uses per code and the commission each referrer is owed, worked out from paid bookings that used the code.
- EARLYBIRDBIZ (5%, 10 uses) is added if it isn't already there.
- Payment checks will accept any commission rate that comes from a valid active code, instead of only 15% or 5%.

## Stage 2 — Moderation
- Admin buttons on every listing, brief and profile: Admin Delete, Suspend User, Pin to Top. Pinned posts appear first; suspended users' posts are hidden and they can't post.
- Profanity and spam-link filter in the forms and in the database, so it can't be bypassed. Message shown: "Inappropriate language or unsafe links detected. Please revise your post."
- A small Report/Flag icon on every card that sends reports to an Admin reports queue.

## Stage 3 — Profile hub and public profiles
- "Account" becomes "Profile" everywhere.
- New fields: picture/logo upload (initials shown if none), display/business name, location, bio, and Instagram, TikTok, YouTube and website links.
- Public pages at /creators/:id and /brands/:id showing bio, location, verified badge, rating, links and active posts. Names and avatars on cards link to these pages.

## Stage 4 — Ratings and reliability
- After a deal completes or payout is released, the sponsor or brand can leave a 1–5 star review, once per deal.
- Profiles and cards show completion rate, average delivery time, star rating and badges ("Top Rated Creator", "Verified Brand").

## Stage 5 — Location filter
- Location filter on Explore (city or region), plus the niche filter options from your list once the full text is resent.

## Technical details
- New tables: user_roles (app_role enum and has_role() security definer), reports, reviews. New columns: promo_codes (expires_at, referrer_id, referral_rate), profiles (bio, location, socials, suspended), listings/opportunities (pinned). All have grants and row-level security; admin writes are checked with has_role.
- Expiry is stored as a timestamptz worked out from Europe/London midnight. The existing pricing triggers check active, expiry and use count.
- ALLOWED_FEE_RATES validation becomes "fee equals the rate stored for that booking, between 0 and 15%", and its tests are updated.
- Moderation runs as a shared word and link list on the client plus a BEFORE INSERT/UPDATE trigger function.
- Avatars go in a public storage bucket, with a policy so each user can only write to their own folder.
