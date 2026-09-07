import { connectToDatabase } from "@/lib/db";
import { PackageModel } from "@/models/package";
import { applyDemoControls, jsonError } from "@/lib/api-helpers";
import { overdueCutoff } from "@/lib/package-query";
import { requireUser } from "@/lib/auth/guard";
import { PACKAGE_STATUSES, type PackageStats } from "@/types/package";

/**
 * GET /api/packages/summary
 * Any signed-in user. Real operational counts for the dashboard header.
 * (Resolves before the dynamic `[id]` route.)
 */
export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const demo = await applyDemoControls(request);
  if (demo) return demo;

  try {
    await connectToDatabase();

    const [grouped, total, exceptions, overdue] = await Promise.all([
      PackageModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      PackageModel.countDocuments({}),
      PackageModel.countDocuments({ exception: { $ne: null } }),
      PackageModel.countDocuments({
        status: { $ne: "Delivered" },
        createdAt: { $lt: overdueCutoff() },
      }),
    ]);

    const byStatus = Object.fromEntries(
      PACKAGE_STATUSES.map((status) => [status, 0]),
    ) as PackageStats["byStatus"];
    for (const row of grouped) {
      if (row._id in byStatus) {
        byStatus[row._id as keyof typeof byStatus] = row.count;
      }
    }

    const body: PackageStats = { total, byStatus, exceptions, overdue };
    return Response.json(body);
  } catch (error) {
    console.error("GET /api/packages/summary failed:", error);
    return jsonError(500, "We couldn't load the summary. Please try again.");
  }
}
