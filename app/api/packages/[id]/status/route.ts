import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { PackageModel } from "@/models/package";
import { serializePackage, type RawPackage } from "@/lib/serialize";
import { addStatusEventSchema, zodDetails } from "@/lib/validation";
import { jsonError, transitionErrorMessage } from "@/lib/api-helpers";
import { requireWriter } from "@/lib/auth/guard";
import { canTransition, type PackageStatus } from "@/types/package";

/**
 * PATCH /api/packages/[id]/status
 * Dispatcher role only. Appends a status event and moves the package forward.
 * This is the endpoint the Live Tracking Simulation and the "Advance one step"
 * button both call.
 *
 * Body: { status, location, timestamp? }
 *
 * The backend is the source of truth for valid transitions (`canTransition`):
 * a package moves forward one step at a time and never backwards. The update is
 * a compare-and-swap on the current status, so two concurrent updates can't
 * skip a step or double-advance.
 */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/packages/[id]/status">,
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

  const parsed = addStatusEventSchema.safeParse(json);
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
  const nextStatus = parsed.data.status;

  try {
    await connectToDatabase();

    const current = await PackageModel.findById(id)
      .select("status")
      .lean<{ status: PackageStatus } | null>();
    if (!current) return jsonError(404, "We couldn't find that package.");

    if (current.status === nextStatus) {
      return jsonError(409, `This package is already marked "${nextStatus}".`);
    }
    if (!canTransition(current.status, nextStatus)) {
      return jsonError(409, transitionErrorMessage(current.status, nextStatus));
    }

    const event = {
      status: nextStatus,
      location: parsed.data.location,
      timestamp: parsed.data.timestamp
        ? new Date(parsed.data.timestamp)
        : new Date(),
      updatedByEmail: user.email,
      updatedByName: user.name,
      updatedByRole: user.role,
    };

    // Compare-and-swap: only update if the status is still what we validated.
    const updated = await PackageModel.findOneAndUpdate(
      { _id: id, status: current.status },
      { $push: { events: event }, $set: { status: nextStatus } },
      { new: true, runValidators: true },
    ).lean<RawPackage | null>();

    if (!updated) {
      return jsonError(
        409,
        "This package was just updated somewhere else. Refresh to see the latest status.",
      );
    }

    return Response.json(serializePackage(updated));
  } catch (error) {
    console.error(`PATCH /api/packages/${id}/status failed:`, error);
    return jsonError(
      500,
      "We couldn't update the package status. Please try again.",
    );
  }
}
