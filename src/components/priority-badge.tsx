import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  critical: "bg-critical/20 text-critical ring-critical/40",
  high: "bg-high/20 text-high ring-high/40",
  medium: "bg-medium/20 text-medium ring-medium/40",
  low: "bg-low/20 text-low ring-low/40",
};

export function PriorityBadge({ priority }: { priority?: string | null }) {
  const p = priority ?? "medium";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 mono",
      styles[p] ?? styles.medium,
    )}>
      {p === "critical" && <span className="h-1.5 w-1.5 rounded-full bg-critical pulse-critical" />}
      {p}
    </span>
  );
}

const statusStyles: Record<string, string> = {
  pending_ai: "bg-info/15 text-info ring-info/30",
  awaiting_review: "bg-medium/15 text-medium ring-medium/30",
  approved: "bg-success/15 text-success ring-success/30",
  assigned: "bg-primary/15 text-primary ring-primary/30",
  in_progress: "bg-primary/15 text-primary ring-primary/30",
  completed: "bg-muted text-muted-foreground ring-border",
  rejected: "bg-destructive/15 text-destructive ring-destructive/30",
  cancelled: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ status }: { status?: string | null }) {
  const s = status ?? "pending_ai";
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 mono",
      statusStyles[s] ?? statusStyles.pending_ai,
    )}>
      {s.replaceAll("_", " ")}
    </span>
  );
}
