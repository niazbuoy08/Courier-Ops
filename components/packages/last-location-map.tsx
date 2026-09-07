import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import type { Package } from "@/types/package";

/**
 * Operational location view. Real GPS coordinates aren't captured, so this
 * shows a stylised backdrop plus the facts a dispatcher needs: current status,
 * last known location, when it was last scanned, and the recent movement
 * between locations.
 */
export function LastLocationMap({ pkg }: { pkg: Package }) {
  const last = pkg.events.at(-1);

  // Last few distinct locations, oldest → newest.
  const route: string[] = [];
  for (const event of pkg.events) {
    if (route[route.length - 1] !== event.location) route.push(event.location);
  }
  const recentRoute = route.slice(-3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location &amp; movement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          role="img"
          aria-label={
            last
              ? `Approximate location view. Last scan: ${last.location}`
              : "Location view, no scans yet"
          }
          className="bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-lg border"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, var(--border) 0 1px, transparent 1px 24px)",
            }}
          />
          <span
            aria-hidden
            className="absolute top-1/2 left-1/2 flex size-4 -translate-x-1/2 -translate-y-1/2"
          >
            <span className="bg-primary/50 absolute inline-flex h-full w-full animate-ping rounded-full" />
            <span className="bg-primary ring-background relative inline-flex size-4 rounded-full ring-2" />
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={pkg.status} />
          {last ? (
            <span className="text-muted-foreground text-xs">
              Last scan{" "}
              <time dateTime={last.timestamp}>
                {formatRelativeTime(last.timestamp)}
              </time>
            </span>
          ) : null}
        </div>

        <div className="flex items-start gap-2">
          <MapPin
            className="text-muted-foreground mt-0.5 size-4 shrink-0"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium">
              {last?.location ?? "No location data yet"}
            </p>
            {last ? (
              <p className="text-muted-foreground text-xs">
                {formatDateTime(last.timestamp)}
              </p>
            ) : null}
          </div>
        </div>

        {recentRoute.length > 1 ? (
          <div className="border-border border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              Recent movement
            </p>
            <ol className="space-y-1.5">
              {recentRoute.map((location, index) => {
                const isCurrent = index === recentRoute.length - 1;
                return (
                  <li
                    key={`${location}-${index}`}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      aria-hidden
                      className={
                        isCurrent
                          ? "bg-primary size-2 shrink-0 rounded-full"
                          : "bg-muted-foreground/40 size-2 shrink-0 rounded-full"
                      }
                    />
                    <span
                      className={
                        isCurrent ? "font-medium" : "text-muted-foreground"
                      }
                    >
                      {location}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
