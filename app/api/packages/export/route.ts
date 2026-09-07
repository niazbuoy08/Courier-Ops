import { connectToDatabase } from "@/lib/db";
import { PackageModel } from "@/models/package";
import { serializeSummary, type RawPackageSummary } from "@/lib/serialize";
import { listQuerySchema } from "@/lib/validation";
import { buildPackageFilter } from "@/lib/package-query";
import { applyDemoControls, jsonError } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth/guard";
import { assessSla } from "@/lib/sla";
import { toCsv, type CsvColumn } from "@/lib/csv";
import type { PackageSummary } from "@/types/package";

/** Hard ceiling so an export can't stream the whole collection into memory. */
const MAX_ROWS = 5000;

const COLUMNS: CsvColumn<PackageSummary>[] = [
  { header: "Tracking ID", value: (p) => p.trackingId },
  { header: "Status", value: (p) => p.status },
  {
    header: "SLA",
    value: (p) =>
      assessSla({
        status: p.status,
        createdAt: p.createdAt,
        deliveredAt: p.updatedAt,
      }).state,
  },
  { header: "Sender", value: (p) => p.sender },
  { header: "Receiver", value: (p) => p.receiver },
  { header: "Delivery address", value: (p) => p.receiverAddress },
  { header: "Phone", value: (p) => p.receiverPhone ?? "" },
  { header: "Weight (kg)", value: (p) => p.weight },
  { header: "Exception", value: (p) => p.exception?.reason ?? "" },
  { header: "Created", value: (p) => p.createdAt },
  { header: "Last updated", value: (p) => p.updatedAt },
];

/**
 * GET /api/packages/export
 * Any signed-in user. Streams the current filtered list (same query params as
 * `GET /api/packages`, minus pagination) as a CSV download, newest first,
 * capped at MAX_ROWS.
 */
export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const demo = await applyDemoControls(request);
  if (demo) return demo;

  const { searchParams } = new URL(request.url);
  const query = listQuerySchema.parse(Object.fromEntries(searchParams));

  try {
    await connectToDatabase();

    const filter = buildPackageFilter(query);
    const sortDir = query.sort === "oldest" ? 1 : -1;

    const rows = await PackageModel.find(filter)
      .sort({ createdAt: sortDir })
      .limit(MAX_ROWS)
      .select("-events")
      .lean<RawPackageSummary[]>();

    const csv = toCsv(rows.map(serializeSummary), COLUMNS);
    const filename = `packages-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/packages/export failed:", error);
    return jsonError(500, "We couldn't build the export. Please try again.");
  }
}
