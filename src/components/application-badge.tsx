import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/lib/marketplace";

const map: Record<ApplicationStatus, { label: string; cls: string }> = {
  pending: { label: "Pending review", cls: "bg-warning/15 text-warning" },
  accepted: { label: "Hired · funds in escrow", cls: "bg-info/15 text-info" },
  delivered: { label: "Delivered · awaiting approval", cls: "bg-[#A855F7]/15 text-[#d8b4fe]" },
  released: { label: "Paid out", cls: "bg-success/15 text-success" },
  declined: { label: "Declined", cls: "bg-destructive/15 text-destructive" },
  refunded: { label: "Refunded", cls: "bg-muted text-muted-foreground" },
};

export function ApplicationBadge({ status }: { status: ApplicationStatus }) {
  const s = map[status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", s.cls)} data-testid="application-status-badge">{s.label}</span>;
}
