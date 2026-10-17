import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** App-wide announcement banner published from the Admin dashboard. */
export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["announcement"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("id, message").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });
  if (!data || dismissed === data.id) return null;
  return (
    <div className="flex items-center justify-center gap-3 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
      <p>{data.message}</p>
      <button aria-label="Dismiss announcement" onClick={() => setDismissed(data.id)} className="rounded p-0.5 hover:bg-primary-foreground/10">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
