import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { untyped } from "@/lib/db-untyped";

export type ChannelType = Database["public"]["Enums"]["channel_type"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type UserType = Database["public"]["Enums"]["user_type"];
export type ApplicationStatus = "pending" | "accepted" | "delivered" | "released" | "declined" | "refunded";
export type SocialPlatform = "tiktok" | "instagram";
export type SocialAccount = {
  id: string; creator_id: string; platform: SocialPlatform; handle: string; followers: number;
  avg_views: number | null; verified: boolean; synced_at: string | null; created_at: string;
};
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type NameRef = { full_name: string | null; company_or_brand_name: string | null };
type SocialSummary = Pick<SocialAccount, "platform" | "handle" | "followers" | "avg_views" | "verified">;
export type ListingWithCreator = ListingRow & { creator: (NameRef & { socials: SocialSummary[] }) | null };
export type Opportunity = {
  id: string; brand_id: string; title: string; niche: string; channel_type: ChannelType | null; budget: number;
  description: string | null; deliverables: string | null; deadline: string | null; status: "open" | "closed";
  promo_code: string | null; created_at: string;
};
export type OpportunityWithBrand = Opportunity & { brand: NameRef | null };
export type Application = {
  id: string; opportunity_id: string; creator_id: string; pitch: string; portfolio_link: string | null;
  status: ApplicationStatus; total_amount: number; platform_fee: number; promo_code: string | null;
  payment_status: "unpaid" | "paid" | "refunded"; proof_url: string | null; created_at: string;
};
export type BrandApplication = Application & { creator: (NameRef & { socials: SocialSummary[] }) | null };
export type BrandOpportunity = Opportunity & { applications: BrandApplication[] };
export type CreatorApplication = Application & { opportunity: { id: string; title: string; budget: number; brand: NameRef | null } | null };

export const ROLE_LABEL: Record<UserType, string> = { creator: "Creator", sponsor: "Brand / Business" };

export const CHANNELS: ChannelType[] = ["Instagram", "TikTok", "YouTube", "Newsletter", "Podcast", "Social Media"];
export const NICHES = ["Tech", "Lifestyle", "Food & Drink", "Beauty", "Fitness", "Finance", "Fashion", "Travel", "Gaming", "Design", "Health", "Parenting"];

export const SUPPORT_EMAIL = "kieran@creatorconnecthub.co.uk";
export const INSTAGRAM_URL = "https://instagram.com/joincreatorconnect";

/** Platform fee taken from the creator's share; sponsor pays the listed price. Mirrors the database trigger. */
export const PLATFORM_FEE_RATE = 0.15;
export const calcFee = (price: number) => Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
export const creatorShare = (price: number) => Math.round((price - calcFee(price)) * 100) / 100;

export const formatGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n);
export const formatCount = (n: number) => new Intl.NumberFormat("en-GB", { notation: "compact" }).format(n);
export const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const LISTING_SELECT = "*, creator:profiles!listings_creator_id_fkey(full_name, company_or_brand_name, socials:social_accounts!social_accounts_creator_id_fkey(platform, handle, followers, avg_views, verified))";
// Used until the social_accounts migration is applied.
const LISTING_SELECT_BASIC = "*, creator:profiles!listings_creator_id_fkey(full_name, company_or_brand_name)";
const withSocials = (l: ListingRow & { creator: NameRef | null }): ListingWithCreator => ({ ...l, creator: l.creator ? { ...l.creator, socials: [] } : null });

async function fetchListings(): Promise<ListingWithCreator[]> {
  const res = await untyped(supabase).from("listings").select(LISTING_SELECT).order("created_at", { ascending: false });
  if (!res.error) return res.data as ListingWithCreator[];
  const { data, error } = await supabase.from("listings").select(LISTING_SELECT_BASIC).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(withSocials);
}

export const listingsQuery = () => queryOptions({ queryKey: ["listings"], queryFn: fetchListings });

export const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ["listings", id],
    queryFn: async (): Promise<ListingWithCreator | null> => {
      const res = await untyped(supabase).from("listings").select(LISTING_SELECT).eq("id", id).maybeSingle();
      if (!res.error) return res.data as ListingWithCreator | null;
      const { data, error } = await supabase.from("listings").select(LISTING_SELECT_BASIC).eq("id", id).maybeSingle();
      if (error) throw error;
      return data && withSocials(data);
    },
  });

export const myListingsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["listings", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select(LISTING_SELECT_BASIC).eq("creator_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const creatorBookingsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["bookings", "creator", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, listing:listings!bookings_listing_id_fkey!inner(title, creator_id), sponsor:profiles!bookings_sponsor_id_fkey(full_name, company_or_brand_name)")
        .eq("listing.creator_id", userId)
        .order("preferred_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
export type CreatorBooking = Awaited<ReturnType<NonNullable<ReturnType<typeof creatorBookingsQuery>["queryFn"]>>>[number];

export const sponsorBookingsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["bookings", "sponsor", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, listing:listings!bookings_listing_id_fkey(id, title, channel_type)")
        .eq("sponsor_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_type, full_name, avatar_url, company_or_brand_name, location, bio, website_url, verified_badge, suspended")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

/* ---------------- Brand opportunities ---------------- */

const db = () => untyped(supabase);
const OPP_SELECT = "*, brand:profiles!opportunities_brand_id_fkey(full_name, company_or_brand_name)";

export const opportunitiesQuery = () =>
  queryOptions({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await db().from("opportunities").select(OPP_SELECT).eq("status", "open").order("created_at", { ascending: false });
      if (error) throw error;
      return data as OpportunityWithBrand[];
    },
    retry: false,
  });

export const opportunityQuery = (id: string) =>
  queryOptions({
    queryKey: ["opportunities", id],
    queryFn: async () => {
      const { data, error } = await db().from("opportunities").select(OPP_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data as OpportunityWithBrand | null;
    },
    retry: false,
  });

const APP_CREATOR = "creator:profiles!opportunity_applications_creator_id_fkey(full_name, company_or_brand_name, socials:social_accounts!social_accounts_creator_id_fkey(platform, handle, followers, avg_views, verified))";

export const brandOpportunitiesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["opportunities", "mine", userId],
    queryFn: async () => {
      const { data, error } = await db()
        .from("opportunities")
        .select(`*, applications:opportunity_applications!opportunity_applications_opportunity_id_fkey(*, ${APP_CREATOR})`)
        .eq("brand_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BrandOpportunity[];
    },
    retry: false,
  });

export const myApplicationsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["applications", "mine", userId],
    queryFn: async () => {
      const { data, error } = await db()
        .from("opportunity_applications")
        .select("*, opportunity:opportunities!opportunity_applications_opportunity_id_fkey(id, title, budget, brand:profiles!opportunities_brand_id_fkey(full_name, company_or_brand_name))")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CreatorApplication[];
    },
    retry: false,
  });

export const socialAccountsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["socials", userId],
    queryFn: async () => {
      const { data, error } = await db().from("social_accounts").select("*").eq("creator_id", userId);
      if (error) throw error;
      return data as SocialAccount[];
    },
    retry: false,
  });
