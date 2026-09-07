import { describe, expect, it } from "vitest";
import {
  serializePackage,
  serializeSummary,
  type RawPackage,
  type RawPackageSummary,
} from "./serialize";

function rawSummary(
  overrides: Partial<RawPackageSummary> = {},
): RawPackageSummary {
  return {
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    trackingId: "CX123456789",
    sender: "Acme",
    receiver: "Maya Bennett",
    receiverAddress: "12 Maple Ave, Austin, TX",
    receiverPhone: "+1 555 0123",
    weight: 2.5,
    status: "In transit",
    exception: null,
    createdAt: new Date("2026-01-01T10:00:00.000Z"),
    updatedAt: new Date("2026-01-02T10:00:00.000Z"),
    ...overrides,
  };
}

describe("serializeSummary", () => {
  it("maps _id to a string id and dates to ISO strings", () => {
    const dto = serializeSummary(rawSummary());
    expect(dto.id).toBe("507f1f77bcf86cd799439011");
    expect(dto).not.toHaveProperty("_id");
    expect(dto.createdAt).toBe("2026-01-01T10:00:00.000Z");
    expect(dto.updatedAt).toBe("2026-01-02T10:00:00.000Z");
  });

  it("omits receiverPhone when it is absent or null", () => {
    expect(
      serializeSummary(rawSummary({ receiverPhone: null })),
    ).not.toHaveProperty("receiverPhone");
    expect(
      serializeSummary(rawSummary({ receiverPhone: undefined })),
    ).not.toHaveProperty("receiverPhone");
  });

  it("returns null exception as null", () => {
    expect(serializeSummary(rawSummary()).exception).toBeNull();
  });

  it("serializes an exception, dropping an empty note and defaulting the role", () => {
    const dto = serializeSummary(
      rawSummary({
        exception: {
          reason: "Wrong address",
          note: null,
          flaggedAt: new Date("2026-01-02T09:00:00.000Z"),
          flaggedByName: "Dana",
          flaggedByRole: null,
        },
      }),
    );
    expect(dto.exception).toEqual({
      reason: "Wrong address",
      flaggedAt: "2026-01-02T09:00:00.000Z",
      flaggedBy: { name: "Dana", role: "dispatcher" },
    });
  });

  it("drops flaggedBy entirely when there is no actor name", () => {
    const dto = serializeSummary(
      rawSummary({
        exception: {
          reason: "Lost package",
          flaggedAt: new Date("2026-01-02T09:00:00.000Z"),
        },
      }),
    );
    expect(dto.exception).toEqual({
      reason: "Lost package",
      flaggedAt: "2026-01-02T09:00:00.000Z",
    });
  });
});

describe("serializePackage", () => {
  function rawPackage(events: RawPackage["events"]): RawPackage {
    return { ...rawSummary(), events };
  }

  it("sorts the timeline oldest-first regardless of input order", () => {
    const dto = serializePackage(
      rawPackage([
        {
          status: "In transit",
          location: "Hub",
          timestamp: new Date("2026-01-02T00:00:00.000Z"),
        },
        {
          status: "Pending",
          location: "Origin",
          timestamp: new Date("2026-01-01T00:00:00.000Z"),
        },
      ]),
    );
    expect(dto.events.map((e) => e.status)).toEqual(["Pending", "In transit"]);
    expect(dto.events[0].timestamp).toBe("2026-01-01T00:00:00.000Z");
  });

  it("maps updatedBy when a name is present and omits it otherwise", () => {
    const dto = serializePackage(
      rawPackage([
        {
          status: "Pending",
          location: "Origin",
          timestamp: new Date("2026-01-01T00:00:00.000Z"),
          updatedByName: "Dana",
          updatedByRole: "dispatcher",
        },
        {
          status: "Picked up",
          location: "Origin",
          timestamp: new Date("2026-01-01T05:00:00.000Z"),
        },
      ]),
    );
    expect(dto.events[0].updatedBy).toEqual({
      name: "Dana",
      role: "dispatcher",
    });
    expect(dto.events[1]).not.toHaveProperty("updatedBy");
  });

  it("does not mutate the input events array", () => {
    const events: RawPackage["events"] = [
      {
        status: "In transit",
        location: "Hub",
        timestamp: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        status: "Pending",
        location: "Origin",
        timestamp: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];
    serializePackage(rawPackage(events));
    expect(events[0].status).toBe("In transit");
  });
});
