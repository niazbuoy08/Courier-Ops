import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { TrackingTimeline } from "@/components/packages/tracking-timeline";
import { TrackingLookupForm } from "@/components/tracking/tracking-lookup-form";
import { getPublicTracking } from "@/lib/public-tracking";
import { normalizeTrackingId } from "@/lib/tracking-id";
import { assessSla } from "@/lib/sla";
import { formatDateTime } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/track/[trackingId]">): Promise<Metadata> {
  const { trackingId } = await params;
  return { title: `Tracking ${normalizeTrackingId(trackingId)}` };
}

export default async function PublicTrackingPage({
  params,
}: PageProps<"/track/[trackingId]">) {
  const { trackingId } = await params;
  const tracking = await getPublicTracking(trackingId);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Link
        href="/track"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Track another package
      </Link>

      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <Package className="size-5" aria-hidden />
        Courier Ops
      </div>

      {!tracking ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Package not found
            </h1>
            <p className="text-muted-foreground text-sm">
              We couldn&rsquo;t find a package with the tracking number{" "}
              <span className="font-mono">
                {normalizeTrackingId(trackingId)}
              </span>
              . Check the number and try again.
            </p>
          </div>
          <TrackingLookupForm initialValue={normalizeTrackingId(trackingId)} />
        </div>
      ) : (
        <PublicTrackingDetail tracking={tracking} />
      )}
    </main>
  );
}

function PublicTrackingDetail({
  tracking,
}: {
  tracking: NonNullable<Awaited<ReturnType<typeof getPublicTracking>>>;
}) {
  const sla = assessSla({
    status: tracking.status,
    createdAt: tracking.createdAt,
    deliveredAt: tracking.updatedAt,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">
          {tracking.trackingId}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={tracking.status} />
          {tracking.status === "Delivered" ? (
            <span className="text-muted-foreground text-sm">
              Delivered {formatDateTime(tracking.updatedAt)}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">
              Estimated delivery {formatDateTime(sla.dueAt)}
            </span>
          )}
        </div>
      </div>

      <TrackingTimeline events={tracking.events} />
    </div>
  );
}
