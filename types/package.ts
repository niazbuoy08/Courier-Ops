/**
 * Domain types shared between the API layer, the seed script and the frontend.
 * These describe the JSON shape the API speaks (dates are ISO strings), not the
 * Mongoose documents — see `models/` for those.
 */
import type { UserRole } from "./user";

export const PACKAGE_STATUSES = [
  "Pending",
  "Picked up",
  "In transit",
  "Out for delivery",
  "Delivered",
  "Delayed",
] as const;

export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

/**
 * The ordered "happy path" a package moves through. `Delayed` is a legacy side
 * state (kept so historical packages still validate) and is not part of the
 * linear flow.
 */
export const PACKAGE_STATUS_FLOW = [
  "Pending",
  "Picked up",
  "In transit",
  "Out for delivery",
  "Delivered",
] as const satisfies readonly PackageStatus[];

/**
 * Which statuses a package may move to from a given status. A package moves
 * forward one step at a time and never backwards; `Delivered` is terminal. The
 * backend is the source of truth for this — see `PATCH /api/packages/[id]/status`.
 */
export const STATUS_TRANSITIONS: Record<
  PackageStatus,
  readonly PackageStatus[]
> = {
  Pending: ["Picked up"],
  "Picked up": ["In transit"],
  "In transit": ["Out for delivery"],
  "Out for delivery": ["Delivered"],
  Delivered: [],
  // Legacy: let historical "Delayed" packages rejoin the flow.
  Delayed: ["In transit", "Out for delivery", "Delivered"],
};

export function isPackageStatus(value: unknown): value is PackageStatus {
  return (
    typeof value === "string" &&
    (PACKAGE_STATUSES as readonly string[]).includes(value)
  );
}

export function canTransition(from: PackageStatus, to: PackageStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

/** The single next status in the happy path, or `null` if there is none. */
export function nextStatusInFlow(current: PackageStatus): PackageStatus | null {
  if (current === "Delayed") return "In transit";
  const index = PACKAGE_STATUS_FLOW.indexOf(
    current as (typeof PACKAGE_STATUS_FLOW)[number],
  );
  if (index === -1 || index === PACKAGE_STATUS_FLOW.length - 1) return null;
  return PACKAGE_STATUS_FLOW[index + 1];
}

export const PACKAGE_EXCEPTION_REASONS = [
  "Wrong address",
  "Customer unavailable",
  "Damaged package",
  "Delivery delayed",
  "Lost package",
] as const;

export type ExceptionReason = (typeof PACKAGE_EXCEPTION_REASONS)[number];

export function isExceptionReason(value: unknown): value is ExceptionReason {
  return (
    typeof value === "string" &&
    (PACKAGE_EXCEPTION_REASONS as readonly string[]).includes(value)
  );
}

/** Who performed an update — derived server-side from the session, never sent
 *  by the client. Absent on events created before auditing existed. */
export interface UpdatedBy {
  name: string;
  role: UserRole;
}

/** One entry in a package's tracking timeline. */
export interface StatusEvent {
  status: PackageStatus;
  location: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  updatedBy?: UpdatedBy;
}

export interface PackageException {
  reason: ExceptionReason;
  note?: string;
  /** ISO 8601 timestamp. */
  flaggedAt: string;
  flaggedBy?: UpdatedBy;
}

export interface Package {
  id: string;
  trackingId: string;
  sender: string;
  receiver: string;
  receiverAddress: string;
  receiverPhone?: string;
  /** Weight in kilograms. */
  weight: number;
  status: PackageStatus;
  exception: PackageException | null;
  /** Full status history, oldest first. */
  events: StatusEvent[];
  createdAt: string;
  updatedAt: string;
}

/** Package shape returned by the list endpoint — no event history. */
export type PackageSummary = Omit<Package, "events">;

/** One scan on the public tracking page — no actor, no internal detail. */
export interface PublicTrackingEvent {
  status: PackageStatus;
  location: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
}

/**
 * What an unauthenticated visitor sees for a tracking number. Deliberately
 * omits sender, receiver, address, phone, weight, exceptions and actor names.
 */
export interface PublicTracking {
  trackingId: string;
  status: PackageStatus;
  events: PublicTrackingEvent[];
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Operational summary for the dashboard header. */
export interface PackageStats {
  total: number;
  byStatus: Record<PackageStatus, number>;
  exceptions: number;
  /** Not delivered and past the delivery SLA deadline. */
  overdue: number;
}

export interface ApiError {
  error: string;
  /** Field-level validation messages, keyed by field path. */
  details?: Record<string, string[]>;
}

export type SortOrder = "newest" | "oldest";

/** Request body for `POST /api/packages`. */
export interface CreatePackageBody {
  sender: string;
  receiver: string;
  receiverAddress: string;
  receiverPhone?: string;
  weight: number;
  status?: PackageStatus;
  originLocation?: string;
}

/** Request body for `PATCH /api/packages/[id]` — editing details before pickup. */
export interface UpdatePackageBody {
  sender?: string;
  receiver?: string;
  receiverAddress?: string;
  /** `null` clears the stored phone number. */
  receiverPhone?: string | null;
  weight?: number;
}

/**
 * Shipment details can only be edited while the package is still at the origin.
 * Once it's `In transit` or later, the record is locked.
 */
export const EDITABLE_STATUSES = [
  "Pending",
  "Picked up",
] as const satisfies readonly PackageStatus[];

export function isEditableStatus(status: PackageStatus): boolean {
  return (EDITABLE_STATUSES as readonly PackageStatus[]).includes(status);
}

/** Request body for `PATCH /api/packages/[id]/status`. */
export interface AddStatusEventBody {
  status: PackageStatus;
  location: string;
  timestamp?: string;
}

/** Request body for `PATCH /api/packages/[id]/exception`. `reason: null` clears it. */
export interface FlagExceptionBody {
  reason: ExceptionReason | null;
  note?: string;
}
