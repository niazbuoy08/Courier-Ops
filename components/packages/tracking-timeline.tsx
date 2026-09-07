import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import type { StatusEvent } from "@/types/package";

/** Vertical stepper of a package's status history, newest event first. */
export function TrackingTimeline({ events }: { events: StatusEvent[] }) {
  const ordered = [...events].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking history</CardTitle>
      </CardHeader>
      <CardContent>
        {ordered.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tracking events yet.
          </p>
        ) : (
          <ol
            className="space-y-6"
            aria-label="Status history, most recent first"
          >
            {ordered.map((event, index) => {
              const isCurrent = index === 0;
              const isLast = index === ordered.length - 1;

              return (
                <li
                  key={`${event.timestamp}-${event.status}`}
                  className="relative pl-8"
                >
                  {!isLast ? (
                    <span
                      className="bg-border absolute top-5 -bottom-6 left-[7px] w-px"
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={cn(
                      "absolute top-1 left-0 size-4 rounded-full border-2",
                      isCurrent
                        ? "border-primary bg-primary"
                        : "border-border bg-background",
                    )}
                    aria-hidden
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="leading-none font-medium">{event.status}</p>
                      {isCurrent ? <StatusBadge status={event.status} /> : null}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {event.location}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      <time dateTime={event.timestamp}>
                        {formatDateTime(event.timestamp)}
                      </time>{" "}
                      · {formatRelativeTime(event.timestamp)}
                    </p>
                    {event.updatedBy ? (
                      <p className="text-muted-foreground text-xs">
                        Updated by {event.updatedBy.name}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
