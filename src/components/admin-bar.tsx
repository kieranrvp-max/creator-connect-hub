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
    <div className="bg-primary text-xs text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2">
        <span className="font-semibold">Admin</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span>Users: {data?.total_users ?? "–"}</span>
          <span>Listings: {data?.active_listings ?? "–"}</span>
          <span>Deals completed: {data?.deals_completed ?? "–"}</span>
          <Link to="/admin" className="underline underline-offset-2">Promo manager</Link>
        </div>
      </div>
    </div>
  );
}
