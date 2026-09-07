import { TriangleAlert } from "lucide-react";
import { cn } from "cn";
import type { PackageException } from "@/types/package";

/** Compact "needs attention" marker used in the package list. */
export function ExceptionIndicator({
  exception,
  className,
}: {
  exception: PackageException;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400",
        className,
      )}
      title={`Needs attention: ${exception.reason}`}
    >
      <TriangleAlert className="size-3.5" aria-hidden />
      <span className="sr-only">Needs attention: </span>
      {exception.reason}
    </span>
  );
}
