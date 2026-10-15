import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ChannelType = Database["public"]["Enums"]["channel_type"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type UserType = Database["public"]["Enums"]["user_type"];

export const CHANNELS: ChannelType[] = ["Newsletter", "Podcast", "YouTube", "Social Media"];
export const NICHES = ["Tech", "Finance", "Lifestyle", "Design", "Health", "Gaming"];

/** Platform fee charged to sponsors on top of the slot price. Mirrors the database trigger. */
export const PLATFORM_FEE_RATE = 0.1;
export const calcFee = (price: number) => Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
export const calcTotal = (price: number) => price + calcFee(price);

export const formatGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n);
export const formatCount = (n: number) => new Intl.NumberFormat("en-GB", { notation: "compact" }).format(n);
export const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const LISTING_SELECT = "*, creator:profiles!listings_creator_id_fkey(full_name, company_or_brand_name)";

async function fetchListings() {
  const { data, error } = await supabase.from("listings").select(LISTING_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export type ListingWithCreator = Awaited<ReturnType<typeof fetchListings>>[number];

export const listingsQuery = () => queryOptions({ queryKey: ["listings"], queryFn: fetchListings });

export const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ["listings", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select(LISTING_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const myListingsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["listings", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select(LISTING_SELECT).eq("creator_id", userId).order("created_at", { ascending: false });
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
