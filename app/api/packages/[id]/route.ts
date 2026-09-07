import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { PackageModel } from "@/models/package";
import { serializePackage, type RawPackage } from "@/lib/serialize";
import { applyDemoControls, jsonError } from "@/lib/api-helpers";
import { updatePackageSchema, zodDetails } from "@/lib/validation";
import { requireUser, requireWriter } from "@/lib/auth/guard";
import { isEditableStatus, type PackageStatus } from "@/types/package";

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

/**
 * PATCH /api/packages/[id]
 * Dispatcher role only. Edits shipment details (sender, receiver, address,
 * phone, weight) while the package is still `Pending` or `Picked up`. Once it
 * is `In transit` or later the record is locked and this returns 409.
 *
 * Body: any subset of { sender, receiver, receiverAddress, receiverPhone, weight }.
 * `receiverPhone: null` clears the stored phone.
 */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/packages/[id]">,
) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "We couldn't read that request.");
  }

  const parsed = updatePackageSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(
      400,
      "Please check the highlighted fields.",
      zodDetails(parsed.error),
    );
  }

  if (!mongoose.isValidObjectId(id)) {
    return jsonError(404, "We couldn't find that package.");
  }

  try {
    await connectToDatabase();

    const current = await PackageModel.findById(id)
      .select("status")
      .lean<{ status: PackageStatus } | null>();
    if (!current) return jsonError(404, "We couldn't find that package.");

    if (!isEditableStatus(current.status)) {
      return jsonError(
        409,
        `This package is already "${current.status}", so its details can no longer be edited.`,
      );
    }

    const { receiverPhone, ...rest } = parsed.data;
    const set: Record<string, unknown> = { ...rest };
    const unset: Record<string, unknown> = {};
    if (receiverPhone === null) unset.receiverPhone = "";
    else if (receiverPhone !== undefined) set.receiverPhone = receiverPhone;

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) update.$set = set;
    if (Object.keys(unset).length > 0) update.$unset = unset;

    const updated = await PackageModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean<RawPackage | null>();
    if (!updated) return jsonError(404, "We couldn't find that package.");

    return Response.json(serializePackage(updated));
  } catch (error) {
    console.error(`PATCH /api/packages/${id} failed:`, error);
    return jsonError(500, "We couldn't update the package. Please try again.");
  }
}
