import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Pin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";

/** Admin-only content overrides: delete any post or pin it to the top of Explore. */
export function AdminContentControls({ kind, id, pinned }: { kind: "listing" | "opportunity"; id: string; pinned: boolean }) {
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const table = kind === "listing" ? "listings" : "opportunities";

  const pin = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(table).update({ pinned: !pinned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success(pinned ? "Unpinned" : "Pinned to top of Explore"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Deleted by admin"); navigate({ to: "/explore" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) return null;
  return (
    <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
      <Button size="sm" variant="outline" disabled={pin.isPending} onClick={() => pin.mutate()}>
        <Pin className="mr-1 h-4 w-4" />{pinned ? "Unpin" : "Pin to top"}
      </Button>
      <Button size="sm" variant="destructive" disabled={del.isPending} onClick={() => { if (confirm("Admin delete this post? This cannot be undone.")) del.mutate(); }}>
        <Trash2 className="mr-1 h-4 w-4" />Admin delete
      </Button>
    </div>
  );
}
