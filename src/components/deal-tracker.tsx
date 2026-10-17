import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/marketplace";

const STEPS = ["Offer Sent", "Accepted", "Content Submitted", "Payment Released"] as const;

const STEP_INDEX: Record<BookingStatus, number> = {
  pending_approval: 0,
  accepted: 1,
  published: 2,
  completed: 3,
  declined: -1,
};

/** Visual progress tracker for a booking's lifecycle. */
export function DealTracker({ status }: { status: BookingStatus }) {
  const current = STEP_INDEX[status];
  if (current < 0) return null;
  return (
    <ol className="flex items-center gap-1" aria-label={`Deal progress: ${STEPS[current]}`} data-testid="deal-tracker">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden className={cn("h-px w-3 sm:w-5", i <= current ? "bg-[#A855F7]" : "bg-border")} />}
            <span
              title={label}
              className={cn(
                "flex size-5 items-center justify-center rounded-full border text-[9px] font-semibold",
                done && "border-[#A855F7] bg-[#A855F7] text-white",
                active && "border-[#EC4899] bg-[#EC4899]/15 text-[#EC4899] shadow-[0_0_10px_rgba(236,72,153,0.4)]",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3" /> : i + 1}
            </span>
            <span className={cn("hidden text-[10px] lg:inline", active ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
