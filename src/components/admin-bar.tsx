import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";

export function AdminBar() {
  const isAdmin = useIsAdmin();
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data?.[0];
    },
  });
  if (!isAdmin) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 bg-primary px-4 py-1.5 text-xs text-primary-foreground">
      <span className="font-semibold">Admin</span>
      <span>Users: {data?.total_users ?? "–"}</span>
      <span>Listings: {data?.active_listings ?? "–"}</span>
      <span>Deals completed: {data?.deals_completed ?? "–"}</span>
      <Link to="/admin" className="underline underline-offset-2">Promo manager</Link>
    </div>
  );
}
