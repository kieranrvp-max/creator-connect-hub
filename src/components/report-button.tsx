import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { untyped } from "@/lib/db-untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Lets a signed-in user flag a post for the admin reports queue. */
export function ReportButton({ kind, id }: { kind: "listing" | "opportunity"; id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  const report = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to report content");
      const row: { listing_id?: string; opportunity_id?: string; reason: string } = kind === "listing" ? { listing_id: id, reason } : { opportunity_id: id, reason };
      const { error } = await untyped(supabase).from("reports").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { setDone(true); setOpen(false); toast.success("Thanks — our team will review this."); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (done) return null;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground underline hover:text-foreground">
        <Flag className="h-3 w-3" />Report
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What's wrong with this post?" maxLength={200} className="h-8 text-xs" />
      <Button size="sm" variant="outline" disabled={!reason.trim() || report.isPending} onClick={() => report.mutate()}>Send</Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
