import type { SupabaseClient } from "@supabase/supabase-js";

// New tables may not be in the generated types until the migration is applied.
export const untyped = (client: unknown) => client as SupabaseClient;
