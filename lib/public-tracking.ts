import { connectToDatabase } from "@/lib/db";
import { PackageModel } from "@/models/package";
import { serializePublicTracking, type RawPackage } from "@/lib/serialize";
import type { PublicTracking } from "@/types/package";

/** `CX` followed by 9 digits. */
export const TRACKING_ID_PATTERN = /^CX\d{9}$/;

export function normalizeTrackingId(input: string): string {
  return input.trim().toUpperCase();
}

/**
 * Looks up a package by tracking number and returns the redacted public view,
 * or `null` if the number is malformed or unknown. Used by both the public
 * `/api/track/[trackingId]` endpoint and the `/track/[trackingId]` page.
 */
export async function getPublicTracking(
  trackingId: string,
): Promise<PublicTracking | null> {
  const normalized = normalizeTrackingId(trackingId);
  if (!TRACKING_ID_PATTERN.test(normalized)) return null;

  await connectToDatabase();
  const doc = await PackageModel.findOne({
    trackingId: normalized,
  }).lean<RawPackage | null>();

  return doc ? serializePublicTracking(doc) : null;
}
