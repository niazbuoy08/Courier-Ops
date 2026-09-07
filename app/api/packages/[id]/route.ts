import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { PackageModel } from "@/models/package";
import { serializePackage, type RawPackage } from "@/lib/serialize";
import { applyDemoControls, jsonError } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth/guard";

/**
 * GET /api/packages/[id]
 * `id` may be a Mongo ObjectId or a tracking ID (e.g. `CX123456789`).
 * Returns the package with its full status history.
 * Demo hooks: ?fail=true, ?delay=<ms>
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/packages/[id]">,
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const demo = await applyDemoControls(request);
  if (demo) return demo;

  const { id } = await ctx.params;

  try {
    await connectToDatabase();

    const doc = mongoose.isValidObjectId(id)
      ? await PackageModel.findById(id).lean<RawPackage | null>()
      : await PackageModel.findOne({
          trackingId: id.toUpperCase(),
        }).lean<RawPackage | null>();

    if (!doc) return jsonError(404, "We couldn't find that package.");

    return Response.json(serializePackage(doc));
  } catch (error) {
    console.error(`GET /api/packages/${id} failed:`, error);
    return jsonError(500, "We couldn't load this package. Please try again.");
  }
}
