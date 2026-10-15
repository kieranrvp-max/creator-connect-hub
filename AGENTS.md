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
- Payments use built-in Stripe via `createStripeClient` (gateway) with destination charges + application fee to the creator's Connect account; all refunds go through `refundAndClose` in `src/lib/bookings.server.ts` so DB status and Stripe stay in sync.
- Booking paid state is set by the signed webhook or the checkout-return verification (both call `markBookingPaid`, idempotent); never by the client.
- An hourly managed schedule hits `/api/public/jobs/expire-requests` to auto-refund stale pending requests.
