import { Schema } from "mongoose";
import { PACKAGE_STATUSES, type PackageStatus } from "@/types/package";
import { USER_ROLES, type UserRole } from "@/types/user";

/** Persisted shape of an embedded status event (Date instead of ISO string).
 *  The `updatedBy*` fields are optional so events created before auditing
 *  existed still validate and render. */
export interface StatusEventDoc {
  status: PackageStatus;
  location: string;
  timestamp: Date;
  updatedByEmail?: string;
  updatedByName?: string;
  updatedByRole?: UserRole;
}

/**
 * Status events are stored as an embedded array on the `Package` document
 * rather than in their own collection. See `models/package.ts` for the
 * reasoning.
 */
export const StatusEventSchema = new Schema<StatusEventDoc>(
  {
    status: { type: String, enum: PACKAGE_STATUSES, required: true },
    location: { type: String, required: true, trim: true },
    timestamp: { type: Date, required: true, default: () => new Date() },
    updatedByEmail: { type: String, trim: true },
    updatedByName: { type: String, trim: true },
    updatedByRole: { type: String, enum: USER_ROLES },
  },
  { _id: false },
);
