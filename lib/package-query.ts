import { escapeRegExp } from "@/lib/api-helpers";
import { SLA_TRANSIT_HOURS } from "@/lib/sla";
import type { ListQuery } from "@/lib/validation";

const HOUR_MS = 60 * 60 * 1000;

/** The `createdAt` cutoff before which a still-undelivered package is overdue. */
export function overdueCutoff(now: number = Date.now()): Date {
  return new Date(now - SLA_TRANSIT_HOURS * HOUR_MS);
}

/**
 * Translates the parsed list query into a MongoDB filter. Shared by the list
 * endpoint and the CSV export so both honour exactly the same filters.
 */
export function buildPackageFilter(query: ListQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), "i");
    filter.$or = [
      { trackingId: rx },
      { sender: rx },
      { receiver: rx },
      { receiverPhone: rx },
    ];
  }

  if (query.status) filter.status = query.status;
  if (query.exception === "true") filter.exception = { $ne: null };

  if (query.overdue === "true") {
    filter.createdAt = { $lt: overdueCutoff() };
    // Keep an explicit status filter if the user set one; otherwise exclude
    // delivered packages, which can't be overdue.
    if (!query.status) filter.status = { $ne: "Delivered" };
  }

  return filter;
}
