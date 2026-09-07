import type { Package } from "@/types/package";

export type ActivityKind = "status" | "exception";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  /** ISO 8601 timestamp. */
  at: string;
  title: string;
  detail?: string;
  /** Name of the person who performed the action, when known. */
  actor?: string;
}

/**
 * Flattens a package's status history and its current exception flag into one
 * chronological feed (oldest first) for the detail-page activity log. Derived
 * from data the package already carries — no separate audit store.
 */
export function buildActivity(pkg: Package): ActivityItem[] {
  const items: ActivityItem[] = pkg.events.map((event, index) => ({
    id: `status-${index}`,
    kind: "status",
    at: event.timestamp,
    title: index === 0 ? "Package registered" : `Marked ${event.status}`,
    detail: event.location,
    actor: event.updatedBy?.name,
  }));

  if (pkg.exception) {
    items.push({
      id: "exception",
      kind: "exception",
      at: pkg.exception.flaggedAt,
      title: `Exception flagged — ${pkg.exception.reason}`,
      detail: pkg.exception.note,
      actor: pkg.exception.flaggedBy?.name,
    });
  }

  return items.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
}
