import { connectToDatabase } from "@/lib/db";
import { PackageModel } from "@/models/package";
import {
  serializePackage,
  serializeSummary,
  type RawPackage,
  type RawPackageSummary,
} from "@/lib/serialize";
import {
  createPackageSchema,
  listQuerySchema,
  zodDetails,
} from "@/lib/validation";
import {
  applyDemoControls,
  escapeRegExp,
  generateTrackingId,
  isDuplicateKeyError,
  jsonError,
} from "@/lib/api-helpers";
import { requireUser, requireWriter } from "@/lib/auth/guard";
import type { Paginated, PackageSummary } from "@/types/package";

/**
 * GET /api/packages
 * Any signed-in user. Query params: search (tracking ID / sender / receiver /
 * phone), status, exception=true, page, pageSize, sort=newest|oldest.
 * Plus demo hooks: ?fail=true, ?delay=<ms>
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

    const filter: Record<string, unknown> = {};
    if (query.search) {
      const rx = new RegExp(escapeRegExp(query.search), "i");
      filter.$or = [
        { trackingId: rx },
        { sender: rx },
        { receiver: rx },
        { receiverPhone: rx },
      ];
    }
    if (query.status) filter.status = query.status;
    if (query.exception === "true") filter.exception = { $ne: null };

    const skip = (query.page - 1) * query.pageSize;
    const sortDir = query.sort === "oldest" ? 1 : -1;

    const [rows, total] = await Promise.all([
      PackageModel.find(filter)
        .sort({ createdAt: sortDir })
        .skip(skip)
        .limit(query.pageSize)
        .select("-events")
        .lean<RawPackageSummary[]>(),
      PackageModel.countDocuments(filter),
    ]);

    const body: Paginated<PackageSummary> = {
      data: rows.map(serializeSummary),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };

    return Response.json(body);
  } catch (error) {
    console.error("GET /api/packages failed:", error);
    return jsonError(
      500,
      "We couldn't load the package list. Please try again.",
    );
  }
}

/**
 * POST /api/packages
 * Dispatcher role only. The server assigns the tracking ID and stamps the
 * opening status event with the signed-in user.
 */
export async function POST(request: Request) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "We couldn't read that request.");
  }

  const parsed = createPackageSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(
      400,
      "Please check the highlighted fields.",
      zodDetails(parsed.error),
    );
  }

  const {
    sender,
    receiver,
    receiverAddress,
    receiverPhone,
    weight,
    status,
    originLocation,
  } = parsed.data;
  const initialStatus = status ?? "Pending";
  const { user } = auth;

  try {
    await connectToDatabase();

    const now = new Date();
    const created = await PackageModel.create({
      trackingId: generateTrackingId(),
      sender,
      receiver,
      receiverAddress,
      ...(receiverPhone ? { receiverPhone } : {}),
      weight,
      status: initialStatus,
      exception: null,
      events: [
        {
          status: initialStatus,
          location: originLocation ?? "Package registered",
          timestamp: now,
          updatedByEmail: user.email,
          updatedByName: user.name,
          updatedByRole: user.role,
        },
      ],
    });

    const doc = await PackageModel.findById(created._id).lean<RawPackage>();
    return Response.json(serializePackage(doc as RawPackage), { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return jsonError(
        409,
        "Something went wrong assigning a tracking ID. Please try again.",
      );
    }
    console.error("POST /api/packages failed:", error);
    return jsonError(500, "We couldn't create the package. Please try again.");
  }
}
