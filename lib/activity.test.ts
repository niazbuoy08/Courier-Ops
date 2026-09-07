import { describe, expect, it } from "vitest";
import { buildActivity } from "./activity";
import type { Package } from "@/types/package";

function pkg(overrides: Partial<Package> = {}): Package {
  return {
    id: "p1",
    trackingId: "CX100000000",
    sender: "Acme",
    receiver: "Maya",
    receiverAddress: "1 Main St, Austin, TX",
    weight: 2,
    status: "In transit",
    exception: null,
    events: [
      {
        status: "Pending",
        location: "Registered — Austin, TX",
        timestamp: "2026-01-01T00:00:00.000Z",
        updatedBy: { name: "Dana", role: "dispatcher" },
      },
      {
        status: "Picked up",
        location: "Picked up — Austin, TX",
        timestamp: "2026-01-01T06:00:00.000Z",
        updatedBy: { name: "Dana", role: "dispatcher" },
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T06:00:00.000Z",
    ...overrides,
  };
}

describe("buildActivity", () => {
  it("labels the first event as registration and the rest by status", () => {
    const items = buildActivity(pkg());
    expect(items.map((i) => i.title)).toEqual([
      "Package registered",
      "Marked Picked up",
    ]);
    expect(items[0].actor).toBe("Dana");
    expect(items.every((i) => i.kind === "status")).toBe(true);
  });

  it("interleaves the exception flag in chronological order", () => {
    const items = buildActivity(
      pkg({
        exception: {
          reason: "Wrong address",
          note: "Unit number missing",
          flaggedAt: "2026-01-01T03:00:00.000Z",
          flaggedBy: { name: "Dana", role: "dispatcher" },
        },
      }),
    );
    expect(items.map((i) => i.kind)).toEqual(["status", "exception", "status"]);
    const exception = items[1];
    expect(exception.title).toBe("Exception flagged — Wrong address");
    expect(exception.detail).toBe("Unit number missing");
  });

  it("returns only status items when there is no exception", () => {
    expect(buildActivity(pkg()).some((i) => i.kind === "exception")).toBe(
      false,
    );
  });
});
