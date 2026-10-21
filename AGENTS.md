<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Data access uses the browser Cloud client with RLS + TanStack Query options in `src/lib/marketplace.ts`; signed-in pages live under `src/routes/_authenticated/` (client-only gate) so sessions in localStorage work.
- Booking price, platform fee and initial status are set by a database trigger, never trusted from the client; the UI mirrors the fee via `calcFee` for display only.
- Payments use the owner's Stripe account via `createStripeClient` with Connect destination charges; `bookingCharge` validates database-priced commission before setting the application fee, and refunds go through `refundAndClose` so DB status and Stripe stay in sync.
- New and resumed sponsor checkouts share `SponsorshipBreakdown` so the included commission is displayed consistently without a surcharge.
- Booking paid state is set by the signed webhook or the checkout-return verification (both call `markBookingPaid`, idempotent); never by the client.
- An hourly managed schedule hits `/api/public/jobs/expire-requests` to auto-refund stale pending requests.

- Authentication emails use the scaffolded managed handler under `/lovable/email/auth/`; keep all six actions and shared email-safe styles so branding stays consistent without custom delivery infrastructure.
- Admin rights live in `user_roles` (checked with `has_role`); the UI hint is `useIsAdmin`, but database policies enforce every admin action. Commission validation accepts 0–15% so admin promo codes work without code changes.
- `listings.avg_open_rate` stores open rate for Newsletter listings and engagement rate for every other channel; label it with `rateLabel(channel)` so the UI never shows "open rate" for social channels.
- Referral earnings are a ledger computed from paid bookings × `promo_codes.referral_rate` (`admin_promo_usage`, `my_referral_earnings`); there is no automatic Stripe transfer to referrers, because destination charges allow only one connected account per payment.
- Marketplace notification emails are sent only from server code via `src/lib/notifications.server.ts` (one recipient each, idempotency key per event, failures logged and never block payments); client-side status changes call auth-checked server functions in `src/utils/notifications.functions.ts` that verify the caller owns the record.
