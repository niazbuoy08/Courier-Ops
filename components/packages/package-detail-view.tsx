"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, RotateCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { usePackage } from "@/hooks/use-package";
import { PackageDetailSkeleton } from "@/components/packages/package-detail-skeleton";
import { TrackingTimeline } from "@/components/packages/tracking-timeline";
import { PackageInfoCard } from "@/components/packages/package-info-card";
import { LastLocationMap } from "@/components/packages/last-location-map";
import { LiveSimulationPanel } from "@/components/packages/live-simulation-panel";
import { ExceptionPanel } from "@/components/packages/exception-panel";
import { formatRelativeTime } from "@/lib/format";

export function PackageDetailView({
  id,
  canWrite,
  justCreated = false,
}: {
  id: string;
  canWrite: boolean;
  justCreated?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, refresh, isRevalidating } = usePackage(id);
  const [showCreated, setShowCreated] = useState(justCreated);

  // Drop the ?created flag from the URL so a refresh doesn't re-show the banner.
  useEffect(() => {
    if (justCreated) router.replace(pathname, { scroll: false });
  }, [justCreated, router, pathname]);

  if (state.status === "loading") {
    return (
      <>
        <h1 className="sr-only">Loading package…</h1>
        <PackageDetailSkeleton />
      </>
    );
  }

  if (state.status === "not-found") {
    return (
      <>
        <h1 className="sr-only">Package not found</h1>
        <EmptyState
          title="Package not found"
          description={`We couldn't find a package matching “${id}”.`}
          action={
            <Link
              href="/"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back to all packages
            </Link>
          }
        />
      </>
    );
  }

  if (state.status === "error") {
    return (
      <>
        <h1 className="sr-only">Package details</h1>
        <ErrorState
          title="We couldn't load this package"
          message={state.message}
          onRetry={refresh}
        />
      </>
    );
  }

  const pkg = state.data;
  const lastEvent = pkg.events.at(-1);

  return (
    <div className="space-y-6">
      {showCreated ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <span>Package created.</span>
          <button
            type="button"
            onClick={() => setShowCreated(false)}
            // Form-filler extensions add `fdprocessedid` before React hydrates.
            suppressHydrationWarning
            className="focus-visible:ring-ring rounded-sm text-xs font-medium underline focus-visible:ring-2 focus-visible:outline-none"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">
              {pkg.trackingId}
            </h1>
            <StatusBadge status={pkg.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            To {pkg.receiver} · from {pkg.sender}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs" aria-live="polite">
            {isRevalidating ? "Updating…" : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRevalidating}
          >
            <RotateCw
              aria-hidden
              className={isRevalidating ? "animate-spin" : undefined}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status strip — the "what's happening right now" summary */}
      <div className="border-border grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Current status
          </p>
          <div className="mt-1">
            <StatusBadge status={pkg.status} />
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Last known location
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-sm">
            <MapPin
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            {lastEvent?.location ?? "No scans yet"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            Last update
          </p>
          <p className="mt-1 text-sm">
            {lastEvent ? formatRelativeTime(lastEvent.timestamp) : "—"}
            {lastEvent?.updatedBy ? (
              <span className="text-muted-foreground">
                {" "}
                · by {lastEvent.updatedBy.name}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <ExceptionPanel pkg={pkg} canWrite={canWrite} onChange={refresh} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrackingTimeline events={pkg.events} />
        </div>
        <div className="space-y-6">
          <PackageInfoCard pkg={pkg} />
          <LiveSimulationPanel
            pkg={pkg}
            onAdvanced={refresh}
            canWrite={canWrite}
          />
          <LastLocationMap pkg={pkg} />
        </div>
      </div>
    </div>
  );
}
