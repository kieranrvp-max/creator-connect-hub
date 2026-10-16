import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ChannelType = Database["public"]["Enums"]["channel_type"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type UserType = Database["public"]["Enums"]["user_type"];
export type ApplicationStatus = Database["public"]["Enums"]["application_status"];
export type SocialPlatform = Database["public"]["Enums"]["social_platform"];
export type SocialAccount = Database["public"]["Tables"]["social_accounts"]["Row"];

export const ROLE_LABEL: Record<UserType, string> = { creator: "Creator", sponsor: "Brand / Business" };

export const CHANNELS: ChannelType[] = ["Newsletter", "Podcast", "YouTube", "Social Media"];
export const NICHES = ["Tech", "Finance", "Lifestyle", "Design", "Health", "Gaming"];

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
type SocialSummary = Pick<SocialAccount, "platform" | "handle" | "followers" | "avg_views" | "verified">;

async function fetchListings() {
  const res = await supabase.from("listings").select(LISTING_SELECT).order("created_at", { ascending: false });
  if (!res.error) return res.data;
  const { data, error } = await supabase.from("listings").select(LISTING_SELECT_BASIC).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((l) => ({ ...l, creator: l.creator ? { ...l.creator, socials: [] as SocialSummary[] } : null }));
}
export type ListingWithCreator = Awaited<ReturnType<typeof fetchListings>>[number];

export const listingsQuery = () => queryOptions({ queryKey: ["listings"], queryFn: fetchListings });

export const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ["listings", id],
    queryFn: async () => {
      const res = await supabase.from("listings").select(LISTING_SELECT).eq("id", id).maybeSingle();
      if (!res.error) return res.data;
      const { data, error } = await supabase.from("listings").select(LISTING_SELECT_BASIC).eq("id", id).maybeSingle();
      if (error) throw error;
      return data && { ...data, creator: data.creator ? { ...data.creator, socials: [] as SocialSummary[] } : null };
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
        .select("id, user_type, full_name, avatar_url, company_or_brand_name")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

/* ---------------- Brand opportunities ---------------- */

const OPP_SELECT = "*, brand:profiles!opportunities_brand_id_fkey(full_name, company_or_brand_name)";

async function fetchOpportunities() {
  const { data, error } = await supabase.from("opportunities").select(OPP_SELECT).eq("status", "open").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export type OpportunityWithBrand = Awaited<ReturnType<typeof fetchOpportunities>>[number];

export const opportunitiesQuery = () => queryOptions({ queryKey: ["opportunities"], queryFn: fetchOpportunities, retry: false });

export const opportunityQuery = (id: string) =>
  queryOptions({
    queryKey: ["opportunities", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select(OPP_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: false,
  });

const APP_CREATOR = "creator:profiles!opportunity_applications_creator_id_fkey(full_name, company_or_brand_name, socials:social_accounts!social_accounts_creator_id_fkey(platform, handle, followers, avg_views, verified))";

export const brandOpportunitiesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["opportunities", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`*, applications:opportunity_applications!opportunity_applications_opportunity_id_fkey(*, ${APP_CREATOR})`)
        .eq("brand_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    retry: false,
  });
export type BrandOpportunity = Awaited<ReturnType<NonNullable<ReturnType<typeof brandOpportunitiesQuery>["queryFn"]>>>[number];
export type BrandApplication = BrandOpportunity["applications"][number];

export const myApplicationsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["applications", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunity_applications")
        .select("*, opportunity:opportunities!opportunity_applications_opportunity_id_fkey(id, title, budget, brand:profiles!opportunities_brand_id_fkey(full_name, company_or_brand_name))")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    retry: false,
  });
export type CreatorApplication = Awaited<ReturnType<NonNullable<ReturnType<typeof myApplicationsQuery>["queryFn"]>>>[number];

export const socialAccountsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["socials", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_accounts").select("*").eq("creator_id", userId);
      if (error) throw error;
      return data;
    },
    retry: false,
  });
