import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/marketplace";

const map: Record<BookingStatus, { label: string; cls: string }> = {
  pending_approval: { label: "Pending", cls: "bg-warning/15 text-warning" },
  accepted: { label: "Approved", cls: "bg-info/15 text-info" },
  published: { label: "Published", cls: "bg-success/15 text-success" },
  completed: { label: "Completed", cls: "bg-muted text-muted-foreground" },
  declined: { label: "Declined", cls: "bg-destructive/15 text-destructive" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = map[status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", s.cls)}>{s.label}</span>;
}
