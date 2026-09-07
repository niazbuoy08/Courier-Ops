import { jsonError } from "@/lib/api-helpers";
import { getPublicTracking } from "@/lib/public-tracking";

/**
 * GET /api/track/[trackingId]
 * Public — no session required. Returns the redacted tracking view for a
 * package (status + scan history only), or 404 for an unknown / malformed
 * tracking number.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/track/[trackingId]">,
) {
  const { trackingId } = await ctx.params;

  try {
    const tracking = await getPublicTracking(trackingId);
    if (!tracking) {
      return jsonError(404, "No package found with that tracking number.");
    }
    return Response.json(tracking);
  } catch (error) {
    console.error(`GET /api/track/${trackingId} failed:`, error);
    return jsonError(
      500,
      "We couldn't load tracking for that package. Please try again.",
    );
  }
}
