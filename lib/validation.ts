import { z } from "zod";
import {
  PACKAGE_EXCEPTION_REASONS,
  PACKAGE_STATUSES,
  type ExceptionReason,
  type PackageStatus,
} from "@/types/package";

const statusEnum = z.enum(
  PACKAGE_STATUSES as unknown as [PackageStatus, ...PackageStatus[]],
);

const exceptionReasonEnum = z.enum(
  PACKAGE_EXCEPTION_REASONS as unknown as [
    ExceptionReason,
    ...ExceptionReason[],
  ],
);

const phoneField = z
  .string()
  .trim()
  .min(6, "Enter a valid phone number.")
  .max(30)
  .regex(
    /^[0-9+()\-\s]+$/,
    "Phone number can only contain digits and + ( ) -.",
  );

/** Body for `POST /api/packages`. The tracking ID and the opening status event
 *  are assigned by the server. */
export const createPackageSchema = z.object({
  sender: z.string().trim().min(1, "Sender name is required.").max(120),
  receiver: z.string().trim().min(1, "Receiver name is required.").max(120),
  receiverAddress: z
    .string()
    .trim()
    .min(1, "Delivery address is required.")
    .max(200),
  receiverPhone: phoneField.optional(),
  weight: z
    .number({ message: "Weight must be a number." })
    .positive("Weight must be greater than 0.")
    .max(1000, "Weight looks too large (max 1000 kg)."),
  status: statusEnum.optional(),
  originLocation: z.string().trim().min(1).max(200).optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;

/**
 * Body for `PATCH /api/packages/[id]` — editing shipment details before the
 * package leaves the origin. Every field is optional; at least one must be
 * present. `receiverPhone: null` clears a stored phone number.
 */
export const updatePackageSchema = z
  .object({
    sender: z.string().trim().min(1, "Sender name is required.").max(120),
    receiver: z.string().trim().min(1, "Receiver name is required.").max(120),
    receiverAddress: z
      .string()
      .trim()
      .min(1, "Delivery address is required.")
      .max(200),
    receiverPhone: phoneField.nullable(),
    weight: z
      .number({ message: "Weight must be a number." })
      .positive("Weight must be greater than 0.")
      .max(1000, "Weight looks too large (max 1000 kg)."),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Change at least one field.",
  });

export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

/** Body for `PATCH /api/packages/[id]/status`. */
export const addStatusEventSchema = z.object({
  status: statusEnum,
  location: z.string().trim().min(1, "Location is required.").max(200),
  /** Optional ISO timestamp; defaults to "now" server-side. */
  timestamp: z
    .string()
    .datetime({ message: "Timestamp must be ISO 8601." })
    .optional(),
});

export type AddStatusEventInput = z.infer<typeof addStatusEventSchema>;

/** Body for `PATCH /api/packages/[id]/exception`. `reason: null` clears it. */
export const flagExceptionSchema = z.object({
  reason: exceptionReasonEnum.nullable(),
  note: z
    .string()
    .trim()
    .max(300, "Keep the note under 300 characters.")
    .optional(),
});

export type FlagExceptionInput = z.infer<typeof flagExceptionSchema>;

/** Query string for `GET /api/packages`. Lenient by design — bad values fall
 *  back to sane defaults rather than erroring the whole list. */
export const listQuerySchema = z.object({
  search: z.string().trim().max(120).catch("").default(""),
  status: statusEnum.optional().catch(undefined),
  exception: z.literal("true").optional().catch(undefined),
  /** Past the delivery SLA deadline and not yet delivered. */
  overdue: z.literal("true").optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(10).default(10),
  sort: z.enum(["newest", "oldest"]).catch("newest").default("newest"),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

/** Flattens a ZodError into `{ field: [messages] }` for API error responses. */
export function zodDetails(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    (details[key] ??= []).push(issue.message);
  }
  return details;
}
