import type { ApiError, PackageStatus } from "@/types/package";

/** JSON error response with the shape the frontend expects (`ApiError`). */
export function jsonError(
  status: number,
  error: string,
  details?: Record<string, string[]>,
): Response {
  const body: ApiError = details ? { error, details } : { error };
  return Response.json(body, { status });
}

/** Escapes a user string so it can be used literally inside a RegExp. */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** `CX` + 9 digits, e.g. `CX483920117`. */
export function generateTrackingId(): string {
  return `CX${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;
}

/** True for MongoServerError 11000 (unique index violation). */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

/** Plain-language message for a rejected status transition. */
export function transitionErrorMessage(
  from: PackageStatus,
  to: PackageStatus,
): string {
  if (from === "Delivered") {
    return `This package has already been delivered, so it can't be moved to "${to}".`;
  }
  return `A package can't move from "${from}" to "${to}". It has to move forward one step at a time.`;
}

const MAX_DEMO_DELAY_MS = 10_000;

/**
 * Demo hooks for the write-up video. On any request:
 *  - `?delay=2000` slows the response by N ms (capped)
 *  - `?fail=true` returns a simulated failure
 *
 * Returns a `Response` to send immediately, or `null` to proceed normally.
 */
export async function applyDemoControls(
  request: Request,
): Promise<Response | null> {
  const { searchParams } = new URL(request.url);

  const delay = Number(searchParams.get("delay"));
  if (Number.isFinite(delay) && delay > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(delay, MAX_DEMO_DELAY_MS)),
    );
  }

  if (searchParams.get("fail") === "true") {
    return jsonError(
      500,
      "Simulated failure for the demo. Turn off “Simulate a failed request” to recover.",
    );
  }

  return null;
}
