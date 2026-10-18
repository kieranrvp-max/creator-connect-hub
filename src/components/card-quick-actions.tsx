import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MoreVertical, Pin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Admin-only quick actions shown directly on Explore feed cards: pin to top and admin delete. */
export function CardQuickActions({ kind, id, pinned }: { kind: "listing" | "opportunity"; id: string; pinned: boolean }) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="ghost" aria-label="Admin quick actions" data-testid="card-quick-actions-btn">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={pin.isPending} onClick={() => pin.mutate()}>
          <Pin className="mr-2 h-4 w-4" />{pinned ? "Unpin from top" : "Pin to top"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          disabled={del.isPending}
          onClick={() => { if (confirm("Admin delete this post? This cannot be undone.")) del.mutate(); }}
        >
          <Trash2 className="mr-2 h-4 w-4" />Admin delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
