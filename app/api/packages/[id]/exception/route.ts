import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { PackageModel } from "@/models/package";
import { serializePackage, type RawPackage } from "@/lib/serialize";
import { flagExceptionSchema, zodDetails } from "@/lib/validation";
import { jsonError } from "@/lib/api-helpers";
import { requireWriter } from "@/lib/auth/guard";

/**
 * PATCH /api/packages/[id]/exception
 * Dispatcher role only. Flags a package as needing attention, or clears the
 * flag when `reason` is `null`.
 *
 * Body: { reason: ExceptionReason | null, note?: string }
 */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/packages/[id]/exception">,
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

  const parsed = flagExceptionSchema.safeParse(json);
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

  const { user } = auth;
  const { reason, note } = parsed.data;

  const exception =
    reason === null
      ? null
      : {
          reason,
          ...(note ? { note } : {}),
          flaggedAt: new Date(),
          flaggedByName: user.name,
          flaggedByRole: user.role,
        };

  try {
    await connectToDatabase();

    const updated = await PackageModel.findByIdAndUpdate(
      id,
      { $set: { exception } },
      { new: true, runValidators: true },
    ).lean<RawPackage | null>();

    if (!updated) return jsonError(404, "We couldn't find that package.");

    return Response.json(serializePackage(updated));
  } catch (error) {
    console.error(`PATCH /api/packages/${id}/exception failed:`, error);
    return jsonError(
      500,
      "We couldn't update the exception. Please try again.",
    );
  }
}
