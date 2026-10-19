export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          active: boolean
          created_at: string
          id: string
          message: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          ad_copy: string
          created_at: string
          id: string
          listing_id: string
          paid_at: string | null
          payment_env: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee: number
          preferred_date: string
          promo_code: string | null
          proof_url: string | null
          sponsor_id: string
          status: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          target_link: string
          total_amount: number
        }
        Insert: {
          ad_copy: string
          created_at?: string
          id?: string
          listing_id: string
          paid_at?: string | null
          payment_env?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_fee?: number
          preferred_date: string
          promo_code?: string | null
          proof_url?: string | null
          sponsor_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          target_link: string
          total_amount?: number
        }
        Update: {
          ad_copy?: string
          created_at?: string
          id?: string
          listing_id?: string
          paid_at?: string | null
          payment_env?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_fee?: number
          preferred_date?: string
          promo_code?: string | null
          proof_url?: string | null
          sponsor_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          target_link?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          ad_format: string | null
          audience_size: number
          avg_open_rate: number | null
          channel_type: Database["public"]["Enums"]["channel_type"]
          created_at: string
          creator_id: string
          description: string | null
          id: string
          niche: string
          pinned: boolean
          price_per_slot: number
          promo_code: string | null
          proof_screenshot_url: string | null
          title: string
        }
        Insert: {
          ad_format?: string | null
          audience_size: number
          avg_open_rate?: number | null
          channel_type: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          niche: string
          pinned?: boolean
          price_per_slot: number
          promo_code?: string | null
          proof_screenshot_url?: string | null
          title: string
        }
        Update: {
          ad_format?: string | null
          audience_size?: number
          avg_open_rate?: number | null
          channel_type?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          niche?: string
          pinned?: boolean
          price_per_slot?: number
          promo_code?: string | null
          proof_screenshot_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          brand_id: string
          budget: number
          channel_type: Database["public"]["Enums"]["channel_type"] | null
          created_at: string
          deadline: string | null
          deliverables: string | null
          description: string | null
          id: string
          niche: string
          pinned: boolean
          promo_code: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
        }
        Insert: {
          brand_id?: string
          budget: number
          channel_type?: Database["public"]["Enums"]["channel_type"] | null
          created_at?: string
          deadline?: string | null
          deliverables?: string | null
          description?: string | null
          id?: string
          niche: string
          pinned?: boolean
          promo_code?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
        }
        Update: {
          brand_id?: string
          budget?: number
          channel_type?: Database["public"]["Enums"]["channel_type"] | null
          created_at?: string
          deadline?: string | null
          deliverables?: string | null
          description?: string | null
          id?: string
          niche?: string
          pinned?: boolean
          promo_code?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          opportunity_id: string
          paid_at: string | null
          payment_env: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pitch: string
          platform_fee: number
          portfolio_link: string | null
          promo_code: string | null
          proof_url: string | null
          released_at: string | null
          status: Database["public"]["Enums"]["application_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          creator_id?: string
          id?: string
          opportunity_id: string
          paid_at?: string | null
          payment_env?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pitch: string
          platform_fee?: number
          portfolio_link?: string | null
          promo_code?: string | null
          proof_url?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          opportunity_id?: string
          paid_at?: string | null
          payment_env?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pitch?: string
          platform_fee?: number
          portfolio_link?: string | null
          promo_code?: string | null
          proof_url?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_or_brand_name: string | null
          created_at: string
          full_name: string | null
          id: string
          location: string | null
          social_links: Json
          stripe_connect_account_id: string | null
          suspended: boolean
          user_type: Database["public"]["Enums"]["user_type"]
          verified_badge: boolean
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_or_brand_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          location?: string | null
          social_links?: Json
          stripe_connect_account_id?: string | null
          suspended?: boolean
          user_type?: Database["public"]["Enums"]["user_type"]
          verified_badge?: boolean
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_or_brand_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          location?: string | null
          social_links?: Json
          stripe_connect_account_id?: string | null
          suspended?: boolean
          user_type?: Database["public"]["Enums"]["user_type"]
          verified_badge?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          fee_rate: number
          max_uses: number | null
          referral_rate: number
          referrer_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          fee_rate: number
          max_uses?: number | null
          referral_rate?: number
          referrer_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          fee_rate?: number
          max_uses?: number | null
          referral_rate?: number
          referrer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          opportunity_id: string | null
          reason: string
          reporter_id: string
          resolved: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          opportunity_id?: string | null
          reason: string
          reporter_id?: string
          resolved?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          opportunity_id?: string | null
          reason?: string
          reporter_id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          avg_views: number | null
          created_at: string
          creator_id: string
          followers: number
          handle: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          synced_at: string | null
          verified: boolean
        }
        Insert: {
          avg_views?: number | null
          created_at?: string
          creator_id?: string
          followers?: number
          handle: string
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          synced_at?: string | null
          verified?: boolean
        }
        Update: {
          avg_views?: number | null
          created_at?: string
          creator_id?: string
          followers?: number
          handle?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          synced_at?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_metrics: {
        Args: never
        Returns: {
          active_deals: number
          brands: number
          creators: number
          gross_volume: number
          net_revenue: number
        }[]
      }
      admin_promo_usage: {
        Args: never
        Returns: {
          code: string
          gross: number
          referral_earnings: number
          uses: number
        }[]
      }
      admin_stats: {
        Args: never
        Returns: {
          active_listings: number
          deals_completed: number
          total_users: number
        }[]
      }
      can_view_profile: { Args: { _profile_id: string }; Returns: boolean }
      creator_date_taken: {
        Args: { _date: string; _exclude?: string; _listing_id: string }
        Returns: boolean
      }
      creator_is_public: { Args: { _creator_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_listing_owner: { Args: { _listing_id: string }; Returns: boolean }
      is_opportunity_owner: {
        Args: { _opportunity_id: string }
        Returns: boolean
      }
      listing_fee_rate: { Args: { _listing_id: string }; Returns: number }
      opportunity_fee_rate: {
        Args: { _opportunity_id: string }
        Returns: number
      }
      reprice_application: {
        Args: { _application_id: string }
        Returns: undefined
      }
      taken_dates: { Args: { _listing_id: string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin"
      application_status:
        | "pending"
        | "accepted"
        | "delivered"
        | "released"
        | "declined"
        | "refunded"
      booking_status:
        | "pending_approval"
        | "accepted"
        | "published"
        | "completed"
        | "declined"
      channel_type:
        | "Newsletter"
        | "Podcast"
        | "YouTube"
        | "Social Media"
        | "Instagram"
        | "TikTok"
      opportunity_status: "open" | "closed"
      payment_status: "unpaid" | "paid" | "refunded"
      social_platform: "tiktok" | "instagram"
      user_type: "creator" | "sponsor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
      application_status: [
        "pending",
        "accepted",
        "delivered",
        "released",
        "declined",
        "refunded",
      ],
      booking_status: [
        "pending_approval",
        "accepted",
        "published",
        "completed",
        "declined",
      ],
      channel_type: [
        "Newsletter",
        "Podcast",
        "YouTube",
        "Social Media",
        "Instagram",
        "TikTok",
      ],
      opportunity_status: ["open", "closed"],
      payment_status: ["unpaid", "paid", "refunded"],
      social_platform: ["tiktok", "instagram"],
      user_type: ["creator", "sponsor"],
    },
  },
} as const
