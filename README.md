# Connect Niche Craft

Build a Micro-Sponsorship Marketplace for creators (newsletters, podcasts, niche media) and sponsors.

### 1. Database Schema & Auth (Supabase Integration)

Set up a Supabase backend with the following tables and Row-Level Security (RLS):

- **`profiles`**

  - `id` (references auth.users)

  - `user_type` (enum: 'creator' | 'sponsor')

  - `full_name` (text)

  - `avatar_url` (text)

  - `company_or_brand_name` (text, optional)

  - `stripe_connect_account_id` (text, for creators to receive payouts)

- **`listings`** (Created by creators)

  - `id` (uuid)

  - `creator_id` (references profiles.id)

  - `title` (text, e.g., "Weekly Tech Trends Newsletter")

  - `channel_type` (enum: 'Newsletter', 'Podcast', 'YouTube', 'Social Media')

  - `niche` (text, e.g., "Tech", "Finance", "Lifestyle", "Design")

  - `audience_size` (integer)

  - `avg_open_rate` (numeric, e.g., 42.5 for newsletters)

  - `price_per_slot` (numeric, in USD or GBP)

  - `description` (text)

  - `ad_format` (text, e.g., "100-word main sponsor section with 1 link")

  - `proof_screenshot_url` (text, for metric verification)

  - `created_at` (timestamp)

- **`bookings`** (Purchased by sponsors)

  - `id` (uuid)

  - `listing_id` (references listings.id)

  - `sponsor_id` (references profiles.id)

  - `ad_copy` (text)

  - `target_link` (text)

  - `preferred_date` (date)

  - `status` (enum: 'pending_approval', 'accepted', 'published', 'completed', 'declined')

  - `proof_url` (text, link provided by creator showing published ad)

  - `stripe_payment_intent_id` (text)

  - `total_amount` (numeric)

  - `platform_fee` (numeric)

  - `created_at` (timestamp)

---

### 2. User Interfaces & Pages

#### A. Public Browsing Page (`/explore`)

- Hero section explaining: "Connect directly with targeted niche creators for fast, low-cost micro-sponsorships."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://connect-niche-craft.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f115b454-3944-4c2a-b2a0-45bd03995eac).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
