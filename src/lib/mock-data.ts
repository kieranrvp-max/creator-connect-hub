export type ChannelType = "Newsletter" | "Podcast" | "YouTube" | "Social Media";
export type BookingStatus = "pending_approval" | "accepted" | "published" | "completed" | "declined";

export interface Listing {
  id: string;
  creator: string;
  title: string;
  channel_type: ChannelType;
  niche: string;
  audience_size: number;
  avg_open_rate: number | null;
  price_per_slot: number;
  description: string;
  ad_format: string;
  verified: boolean;
}

export interface Booking {
  id: string;
  listing_id: string;
  sponsor: string;
  ad_copy: string;
  target_link: string;
  preferred_date: string;
  status: BookingStatus;
  proof_url?: string;
  total_amount: number;
  platform_fee: number;
}

export const CHANNELS: ChannelType[] = ["Newsletter", "Podcast", "YouTube", "Social Media"];
export const NICHES = ["Tech", "Finance", "Lifestyle", "Design", "Health", "Gaming"];

export const listings: Listing[] = [
  { id: "1", creator: "Maya Chen", title: "Weekly Tech Trends", channel_type: "Newsletter", niche: "Tech", audience_size: 18400, avg_open_rate: 48.2, price_per_slot: 220, description: "A Sunday digest of the five tech stories that matter, read by engineers and founders across the UK and EU.", ad_format: "100-word main sponsor section with 1 link", verified: true },
  { id: "2", creator: "Tom Okafor", title: "Pocket Money Pod", channel_type: "Podcast", niche: "Finance", audience_size: 9200, avg_open_rate: null, price_per_slot: 180, description: "Personal finance for people in their twenties. Two episodes a week, very loyal listeners.", ad_format: "60-second host-read mid-roll", verified: true },
  { id: "3", creator: "Studio Lark", title: "Type & Grid", channel_type: "Newsletter", niche: "Design", audience_size: 6100, avg_open_rate: 56.9, price_per_slot: 120, description: "Typography, layout and design tools for working designers.", ad_format: "Classified ad, 50 words + logo", verified: false },
  { id: "4", creator: "Priya Raman", title: "Slow Mornings", channel_type: "YouTube", niche: "Lifestyle", audience_size: 42000, avg_open_rate: null, price_per_slot: 450, description: "Calm, practical home and routine videos. Viewers are 25–40 and mostly UK based.", ad_format: "45-second integrated segment + pinned link", verified: true },
  { id: "5", creator: "Dev Shorts", title: "Dev Shorts", channel_type: "Social Media", niche: "Tech", audience_size: 31000, avg_open_rate: null, price_per_slot: 260, description: "Bite-size coding tips on TikTok and Instagram Reels.", ad_format: "1 dedicated short + story with link", verified: false },
  { id: "6", creator: "Ana Ruiz", title: "The Indie Ledger", channel_type: "Newsletter", niche: "Finance", audience_size: 12700, avg_open_rate: 44.1, price_per_slot: 160, description: "Money and tax tips for freelancers and solo founders.", ad_format: "Top banner + 80-word blurb", verified: true },
];

export const bookings: Booking[] = [
  { id: "b1", listing_id: "1", sponsor: "Linear Labs", ad_copy: "Ship faster with the issue tracker built for speed.", target_link: "https://example.com/linear", preferred_date: "2026-10-25", status: "pending_approval", total_amount: 220, platform_fee: 22 },
  { id: "b2", listing_id: "1", sponsor: "Notely", ad_copy: "Your second brain, now with AI search.", target_link: "https://example.com/notely", preferred_date: "2026-10-28", status: "pending_approval", total_amount: 220, platform_fee: 22 },
  { id: "b3", listing_id: "6", sponsor: "Taxly", ad_copy: "Self-assessment done in 20 minutes.", target_link: "https://example.com/taxly", preferred_date: "2026-10-19", status: "accepted", total_amount: 160, platform_fee: 16 },
  { id: "b4", listing_id: "1", sponsor: "Railway", ad_copy: "Deploy anything in seconds.", target_link: "https://example.com/railway", preferred_date: "2026-10-04", status: "published", proof_url: "https://example.com/issue-41", total_amount: 220, platform_fee: 22 },
  { id: "b5", listing_id: "6", sponsor: "Monzo Business", ad_copy: "Banking that gets freelancers.", target_link: "https://example.com/monzo", preferred_date: "2026-09-20", status: "completed", proof_url: "https://example.com/issue-38", total_amount: 160, platform_fee: 16 },
];

export const getListing = (id: string) => listings.find((l) => l.id === id);
export const formatGBP = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
export const formatCount = (n: number) => new Intl.NumberFormat("en-GB", { notation: "compact" }).format(n);
