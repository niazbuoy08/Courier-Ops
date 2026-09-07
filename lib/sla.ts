import type { PackageStatus } from "@/types/package";

/**
 * Delivery SLA. Every package is expected to reach the recipient within
 * `SLA_TRANSIT_HOURS` of being registered. A package is "at risk" once it is
 * within `SLA_RISK_WINDOW_HOURS` of that deadline, and "breached" once past it.
 *
 * The deadline is derived from `createdAt` — nothing extra is stored, so it
 * works for packages that were created before this feature existed.
 */
export const SLA_TRANSIT_HOURS = 72;
export const SLA_RISK_WINDOW_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

export type SlaState =
  | "on-track" // in flight, deadline comfortably ahead
  | "at-risk" // in flight, deadline within the risk window
  | "breached" // in flight, past the deadline
  | "met" // delivered on or before the deadline
  | "missed"; // delivered after the deadline

export interface SlaAssessment {
  state: SlaState;
  /** ISO 8601 target delivery time. */
  dueAt: string;
  /**
   * Whole hours until the deadline (negative once it has passed). For a
   * delivered package, hours the delivery beat the deadline by (negative if
   * late).
   */
  hoursRemaining: number;
}

/** Target delivery time for a package registered at `createdAt`. */
export function slaDueAt(createdAt: string | Date): Date {
  return new Date(new Date(createdAt).getTime() + SLA_TRANSIT_HOURS * HOUR_MS);
}

export function assessSla(input: {
  status: PackageStatus;
  createdAt: string | Date;
  /** When the package reached "Delivered". Only read when status is Delivered. */
  deliveredAt?: string | Date;
  now?: Date;
}): SlaAssessment {
  const now = input.now ?? new Date();
  const dueAt = slaDueAt(input.createdAt);

  if (input.status === "Delivered") {
    const deliveredAt = new Date(input.deliveredAt ?? now);
    const hoursRemaining = Math.round(
      (dueAt.getTime() - deliveredAt.getTime()) / HOUR_MS,
    );
    return {
      state: deliveredAt.getTime() <= dueAt.getTime() ? "met" : "missed",
      dueAt: dueAt.toISOString(),
      hoursRemaining,
    };
  }

  const msLeft = dueAt.getTime() - now.getTime();
  const hoursRemaining = Math.round(msLeft / HOUR_MS);

  let state: SlaState;
  if (msLeft <= 0) state = "breached";
  else if (msLeft <= SLA_RISK_WINDOW_HOURS * HOUR_MS) state = "at-risk";
  else state = "on-track";

  return { state, dueAt: dueAt.toISOString(), hoursRemaining };
}

/** The states a dispatcher should act on. */
export function isSlaActionable(state: SlaState): boolean {
  return state === "at-risk" || state === "breached";
}
