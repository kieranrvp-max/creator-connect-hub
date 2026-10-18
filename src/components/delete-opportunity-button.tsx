import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Owner-only delete for a brand brief (opportunity). */
export function DeleteOpportunityButton({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("opportunities").delete().eq("id", opportunityId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      setOpen(false);
      toast.success("Brief deleted successfully");
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("foreign key") || e.message.includes("violates")
        ? "This brief has applications attached, so it can't be deleted."
        : e.message),
  });
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Delete this brief" data-testid="delete-opportunity-btn">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this brief?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this brief? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep brief</AlertDialogCancel>
          <AlertDialogAction onClick={() => del.mutate()} disabled={del.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {del.isPending ? "Deleting…" : "Delete brief"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
