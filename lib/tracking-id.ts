/**
 * Pure tracking-number helpers — safe to import from client components. Kept
 * separate from `lib/public-tracking.ts` so the browser bundle doesn't pull in
 * the database module.
 */

/** `CX` followed by 9 digits. */
export const TRACKING_ID_PATTERN = /^CX\d{9}$/;

export function normalizeTrackingId(input: string): string {
  return input.trim().toUpperCase();
}
