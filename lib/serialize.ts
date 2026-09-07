import type {
  ExceptionReason,
  Package,
  PackageException,
  PackageStatus,
  PackageSummary,
  PublicTracking,
  StatusEvent,
  UpdatedBy,
} from "@/types/package";
import type { UserRole } from "@/types/user";

/**
 * Shapes of the raw (`.lean()`) documents coming back from Mongoose, plus the
 * functions that turn them into the JSON DTOs the API returns:
 *  - `_id` (ObjectId) becomes a string `id`
 *  - `Date` fields become ISO strings
 *  - `__v`, internal ids and the actor's email are dropped
 *  - the timeline is sorted oldest-first
 */

export interface RawStatusEvent {
  status: PackageStatus;
  location: string;
  timestamp: Date;
  updatedByName?: string | null;
  updatedByRole?: UserRole | null;
}

export interface RawPackageException {
  reason: ExceptionReason;
  note?: string | null;
  flaggedAt: Date;
  flaggedByName?: string | null;
  flaggedByRole?: UserRole | null;
}

export interface RawPackageSummary {
  _id: { toString(): string };
  trackingId: string;
  sender: string;
  receiver: string;
  receiverAddress: string;
  receiverPhone?: string | null;
  weight: number;
  status: PackageStatus;
  exception?: RawPackageException | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RawPackage = RawPackageSummary & { events: RawStatusEvent[] };

function toUpdatedBy(
  name?: string | null,
  role?: UserRole | null,
): UpdatedBy | undefined {
  if (!name) return undefined;
  return { name, role: role ?? "dispatcher" };
}

function serializeEvent(event: RawStatusEvent): StatusEvent {
  const updatedBy = toUpdatedBy(event.updatedByName, event.updatedByRole);
  return {
    status: event.status,
    location: event.location,
    timestamp: event.timestamp.toISOString(),
    ...(updatedBy ? { updatedBy } : {}),
  };
}

function serializeException(
  exception: RawPackageException | null | undefined,
): PackageException | null {
  if (!exception) return null;
  const flaggedBy = toUpdatedBy(
    exception.flaggedByName,
    exception.flaggedByRole,
  );
  return {
    reason: exception.reason,
    ...(exception.note ? { note: exception.note } : {}),
    flaggedAt: exception.flaggedAt.toISOString(),
    ...(flaggedBy ? { flaggedBy } : {}),
  };
}

export function serializeSummary(doc: RawPackageSummary): PackageSummary {
  return {
    id: doc._id.toString(),
    trackingId: doc.trackingId,
    sender: doc.sender,
    receiver: doc.receiver,
    receiverAddress: doc.receiverAddress,
    ...(doc.receiverPhone ? { receiverPhone: doc.receiverPhone } : {}),
    weight: doc.weight,
    status: doc.status,
    exception: serializeException(doc.exception),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function serializePackage(doc: RawPackage): Package {
  return {
    ...serializeSummary(doc),
    events: [...doc.events]
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(serializeEvent),
  };
}

/**
 * Redacted view for the public tracking page: status and scan history only,
 * with none of the sender/receiver/actor detail the internal DTOs carry.
 */
export function serializePublicTracking(doc: RawPackage): PublicTracking {
  return {
    trackingId: doc.trackingId,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    events: [...doc.events]
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((event) => ({
        status: event.status,
        location: event.location,
        timestamp: event.timestamp.toISOString(),
      })),
  };
}
