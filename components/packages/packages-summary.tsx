"use client";

import { cn } from "cn";
import { usePackageStats } from "@/hooks/use-package-stats";
import { PACKAGE_STATUS_FLOW, type PackageStatus } from "@/types/package";

interface Tile {
  key: string;
  label: string;
  value: number;
  active: boolean;
  onSelect: () => void;
  tone?: "default" | "attention";
}

export interface PackagesSummaryProps {
  refreshSignal: number;
  activeStatus?: PackageStatus;
  activeException: boolean;
  onStatusSelect: (status?: PackageStatus) => void;
  onExceptionSelect: (on: boolean) => void;
}

export function PackagesSummary({
  refreshSignal,
  activeStatus,
  activeException,
  onStatusSelect,
  onExceptionSelect,
}: PackagesSummaryProps) {
  const state = usePackageStats(refreshSignal);

  if (state.status === "error") {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs">
        We couldn&rsquo;t load the summary right now. The list below still
        works.
      </p>
    );
  }

  const data = state.status === "success" ? state.data : null;
  const loading = state.status === "loading";

  const statusTiles: Tile[] = PACKAGE_STATUS_FLOW.map((status) => ({
    key: status,
    label: status,
    value: data?.byStatus[status] ?? 0,
    active: activeStatus === status && !activeException,
    onSelect: () =>
      onStatusSelect(activeStatus === status ? undefined : status),
  }));

  if (data && data.byStatus.Delayed > 0) {
    statusTiles.push({
      key: "Delayed",
      label: "Delayed",
      value: data.byStatus.Delayed,
      active: activeStatus === "Delayed" && !activeException,
      onSelect: () =>
        onStatusSelect(activeStatus === "Delayed" ? undefined : "Delayed"),
    });
  }

  const tiles: Tile[] = [
    ...statusTiles,
    {
      key: "exceptions",
      label: "Needs attention",
      value: data?.exceptions ?? 0,
      active: activeException,
      onSelect: () => onExceptionSelect(!activeException),
      tone: "attention",
    },
  ];

  return (
    <section aria-label="Operational summary" className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <div className="border-border rounded-lg border px-3 py-2">
          <p className="text-muted-foreground text-xs">Total packages</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums">
            {loading ? "—" : data?.total}
          </p>
        </div>

        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            // Form-filler extensions add `fdprocessedid` before React hydrates.
            suppressHydrationWarning
            aria-pressed={tile.active}
            aria-label={`Filter by ${tile.label}${
              loading
                ? ""
                : `, ${tile.value} package${tile.value === 1 ? "" : "s"}`
            }`}
            onClick={tile.onSelect}
            className={cn(
              "focus-visible:ring-ring rounded-lg border px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
              tile.active
                ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                : "border-border hover:bg-muted/50",
            )}
          >
            <span
              className={cn(
                "text-xs",
                tile.tone === "attention" && (tile.value > 0 || tile.active)
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              {tile.label}
            </span>
            <span className="mt-0.5 block text-xl font-semibold tabular-nums">
              {loading ? "—" : tile.value}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
