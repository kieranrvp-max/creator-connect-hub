# Roadmap
- [x] Verify database-priced 15% included commission, validate Stripe application fee and show sponsor breakdown in new and resumed checkout (6 tests passed).
- [ ] End-to-end commission payment verification — blocked: no preview users/listings; connected-account read declined, so Connect readiness is unverified.
- [x] How it works page (`/how-it-works`): sponsors + creators sections
- [ ] Switch checkout, refunds and Connect to the owner's Stripe account — secret key saved; live publishable key set; awaiting webhook signing secret
- [x] Checkout warning banner removed from the top of the app
- [x] UI screens, backend, auth, real data
- [x] Stripe Checkout (15% fee from creator share) + Connect onboarding
- [x] Purple theme + hero highlight fix
- [x] Audit + gap fixes: one booking/date, 48h auto-refund, sponsor cancel, decline refunds, expired checkouts, password reset, account page
- [ ] Creator payouts in test mode — blocked: owner must enable Connect in their own Stripe account and creators must reconnect payouts
- [ ] Listing edit/delete UI (not yet requested)
- [x] Email notifications: creator on paid booking/funded brief, brand on new pitch/delivered work, referrer on code use
- [x] Legal pages support email → kieran@creatorconnecthub.co.uk

- [ ] Branded authentication emails and notify.creatorconnecthub.co.uk sender setup; sending awaits DNS verification and publishing.

## Platform update (staged)
- [x] Stage 1: admin role, admin bar, promo manager (expiry, limits, referrers)
- [ ] Stage 2: moderation (admin delete/suspend/pin, profanity filter, report flag)
- [ ] Stage 3: Profile hub + public profiles
- [ ] Stage 4: ratings & reliability
- [ ] Stage 5: location filter (waiting on rest of user's document)

## Role gating, legal pages, promo discount (Oct 2026)
- [x] Brief creation for Brand accounts only (Explore card hidden for creators, /briefs/new guarded)
- [x] Open rate only for Newsletter; Engagement rate for other channels
- [x] /privacy and /terms pages + footer links
- [x] Promo form: Commission Discount %, live split preview, searchable referrer, 2.5% referrer ledger + Account balance card
