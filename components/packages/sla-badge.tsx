import { CircleCheck, Clock, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { assessSla, type SlaState } from "@/lib/sla";
import type { PackageStatus } from "@/types/package";

const STYLES: Record<SlaState, string> = {
  "on-track":
    "bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300",
  "at-risk":
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  breached: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  met: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  missed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const LABELS: Record<SlaState, string> = {
  "on-track": "On track",
  "at-risk": "Due soon",
  breached: "Overdue",
  met: "On time",
  missed: "Delivered late",
};

/**
 * Compact delivery-SLA indicator. By default it only renders when the package
 * needs attention (due soon / overdue / delivered late); pass `showSettled` to
 * also show the reassuring "on track" / "on time" states.
 */
export function SlaBadge({
  status,
  createdAt,
  deliveredAt,
  showSettled = false,
  className,
}: {
  status: PackageStatus;
  createdAt: string;
  /** Last-updated time, used as the delivery time for delivered packages. */
  deliveredAt?: string;
  showSettled?: boolean;
  className?: string;
}) {
  const { state } = assessSla({ status, createdAt, deliveredAt });

  const settled = state === "on-track" || state === "met";
  if (settled && !showSettled) return null;

  const Icon =
    state === "met" || state === "on-track"
      ? CircleCheck
      : state === "at-risk"
        ? Clock
        : TriangleAlert;

  return (
    <Badge
      className={cn("gap-1 border-transparent", STYLES[state], className)}
      title={`Delivery SLA: ${LABELS[state].toLowerCase()}`}
    >
      <Icon className="size-3" aria-hidden />
      {LABELS[state]}
    </Badge>
  );
}
