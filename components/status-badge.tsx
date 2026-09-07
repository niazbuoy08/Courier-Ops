import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import type { PackageStatus } from "@/types/package";

const STATUS_STYLES: Record<PackageStatus, string> = {
  Pending:
    "bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300",
  "Picked up":
    "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  "In transit": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "Out for delivery":
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Delivered:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Delayed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({
  status,
  className,
}: {
  status: PackageStatus;
  className?: string;
}) {
  return (
    <Badge
      className={cn("border-transparent", STATUS_STYLES[status], className)}
    >
      {status}
    </Badge>
  );
}
