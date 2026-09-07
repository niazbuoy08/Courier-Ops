import { Schema, model, models, type Model } from "mongoose";
import {
  PACKAGE_EXCEPTION_REASONS,
  PACKAGE_STATUSES,
  type ExceptionReason,
  type PackageStatus,
} from "@/types/package";
import { USER_ROLES, type UserRole } from "@/types/user";
import { StatusEventSchema, type StatusEventDoc } from "./status-event";

/**
 * Data-modelling choice: status events are **embedded** as a sub-array on the
 * package instead of living in a separate collection with a reference.
 *
 * Why embedding is cleaner here:
 *  - A package's timeline is small and bounded (a handful of events) and is
 *    always read together with the package, never on its own — so there is no
 *    query that a separate collection would make faster.
 *  - Appending an event and updating the package's current status happen in a
 *    single atomic document write (`$push` + `$set`), with no transaction or
 *    `populate` round-trip.
 *  - It keeps the API response one document deep, which maps directly onto the
 *    detail-page timeline UI.
 *
 * A separate collection would only pay off if events grew unbounded or needed
 * to be queried independently of their package, neither of which applies.
 */
export interface PackageExceptionDoc {
  reason: ExceptionReason;
  note?: string;
  flaggedAt: Date;
  flaggedByName?: string;
  flaggedByRole?: UserRole;
}

export interface PackageDoc {
  trackingId: string;
  sender: string;
  receiver: string;
  receiverAddress: string;
  /** Optional — packages created before phone capture won't have one. */
  receiverPhone?: string;
  /** Weight in kilograms. */
  weight: number;
  status: PackageStatus;
  /** `null` when the package needs no attention. */
  exception?: PackageExceptionDoc | null;
  events: StatusEventDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const PackageExceptionSchema = new Schema<PackageExceptionDoc>(
  {
    reason: { type: String, enum: PACKAGE_EXCEPTION_REASONS, required: true },
    note: { type: String, trim: true, maxlength: 300 },
    flaggedAt: { type: Date, required: true, default: () => new Date() },
    flaggedByName: { type: String, trim: true },
    flaggedByRole: { type: String, enum: USER_ROLES },
  },
  { _id: false },
);

const PackageSchema = new Schema<PackageDoc>(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    sender: { type: String, required: true, trim: true },
    receiver: { type: String, required: true, trim: true },
    receiverAddress: { type: String, required: true, trim: true },
    receiverPhone: { type: String, trim: true },
    weight: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: PACKAGE_STATUSES,
      required: true,
      default: "Pending",
    },
    exception: { type: PackageExceptionSchema, default: null },
    events: { type: [StatusEventSchema], default: [] },
  },
  { timestamps: true },
);

// Supports the list endpoint's status filter + "sort by date".
PackageSchema.index({ status: 1, createdAt: -1 });
// Supports search by receiver name (trackingId is already indexed via `unique`).
PackageSchema.index({ receiver: 1 });
// Supports the "needs attention" filter.
PackageSchema.index({ "exception.reason": 1 });

/**
 * Reuse the compiled model across hot reloads — without this guard Mongoose
 * throws `OverwriteModelError` the second time this module is evaluated in dev.
 */
export const PackageModel: Model<PackageDoc> =
  (models.Package as Model<PackageDoc> | undefined) ??
  model<PackageDoc>("Package", PackageSchema);
