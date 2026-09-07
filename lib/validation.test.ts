import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  addStatusEventSchema,
  createPackageSchema,
  flagExceptionSchema,
  listQuerySchema,
  zodDetails,
} from "./validation";

describe("createPackageSchema", () => {
  const valid = {
    sender: "Acme",
    receiver: "Maya Bennett",
    receiverAddress: "12 Maple Ave, Austin, TX",
    weight: 2.5,
  };

  it("accepts a minimal valid body and trims strings", () => {
    const parsed = createPackageSchema.parse({
      ...valid,
      sender: "  Acme  ",
    });
    expect(parsed.sender).toBe("Acme");
    expect(parsed).not.toHaveProperty("receiverPhone");
  });

  it("requires sender, receiver and address", () => {
    expect(
      createPackageSchema.safeParse({ ...valid, sender: "" }).success,
    ).toBe(false);
    expect(
      createPackageSchema.safeParse({ ...valid, receiver: "   " }).success,
    ).toBe(false);
    expect(
      createPackageSchema.safeParse({ ...valid, receiverAddress: "" }).success,
    ).toBe(false);
  });

  it("rejects a non-positive or absurd weight", () => {
    expect(createPackageSchema.safeParse({ ...valid, weight: 0 }).success).toBe(
      false,
    );
    expect(
      createPackageSchema.safeParse({ ...valid, weight: -1 }).success,
    ).toBe(false);
    expect(
      createPackageSchema.safeParse({ ...valid, weight: 1001 }).success,
    ).toBe(false);
  });

  it("validates the optional phone number format", () => {
    expect(
      createPackageSchema.safeParse({
        ...valid,
        receiverPhone: "+1 (555) 010-2020",
      }).success,
    ).toBe(true);
    expect(
      createPackageSchema.safeParse({ ...valid, receiverPhone: "call me" })
        .success,
    ).toBe(false);
    expect(
      createPackageSchema.safeParse({ ...valid, receiverPhone: "12" }).success,
    ).toBe(false);
  });

  it("only allows a known starting status", () => {
    expect(
      createPackageSchema.safeParse({ ...valid, status: "Pending" }).success,
    ).toBe(true);
    expect(
      createPackageSchema.safeParse({ ...valid, status: "Shipped" }).success,
    ).toBe(false);
  });
});

describe("addStatusEventSchema", () => {
  it("requires a valid status and a non-empty location", () => {
    expect(
      addStatusEventSchema.safeParse({ status: "In transit", location: "Hub" })
        .success,
    ).toBe(true);
    expect(
      addStatusEventSchema.safeParse({ status: "In transit", location: "" })
        .success,
    ).toBe(false);
    expect(
      addStatusEventSchema.safeParse({ status: "Nope", location: "Hub" })
        .success,
    ).toBe(false);
  });

  it("accepts an ISO timestamp and rejects a loose one", () => {
    expect(
      addStatusEventSchema.safeParse({
        status: "In transit",
        location: "Hub",
        timestamp: "2026-01-02T10:00:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      addStatusEventSchema.safeParse({
        status: "In transit",
        location: "Hub",
        timestamp: "yesterday",
      }).success,
    ).toBe(false);
  });
});

describe("flagExceptionSchema", () => {
  it("accepts a null reason (clearing the flag)", () => {
    expect(flagExceptionSchema.safeParse({ reason: null }).success).toBe(true);
  });

  it("accepts a known reason with an optional note", () => {
    expect(
      flagExceptionSchema.safeParse({
        reason: "Customer unavailable",
        note: "Card left",
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown reason and an over-long note", () => {
    expect(flagExceptionSchema.safeParse({ reason: "Abducted" }).success).toBe(
      false,
    );
    expect(
      flagExceptionSchema.safeParse({
        reason: "Lost package",
        note: "x".repeat(301),
      }).success,
    ).toBe(false);
  });
});

describe("listQuerySchema", () => {
  it("fills in defaults for an empty query", () => {
    expect(listQuerySchema.parse({})).toEqual({
      search: "",
      page: 1,
      pageSize: 10,
      sort: "newest",
    });
  });

  it("coerces and clamps pagination, falling back on garbage", () => {
    expect(listQuerySchema.parse({ page: "3", pageSize: "25" })).toMatchObject({
      page: 3,
      pageSize: 25,
    });
    expect(listQuerySchema.parse({ pageSize: "999" }).pageSize).toBe(10);
    expect(listQuerySchema.parse({ page: "abc" }).page).toBe(1);
  });

  it("drops an invalid status or sort instead of throwing", () => {
    const parsed = listQuerySchema.parse({
      status: "Shipped",
      sort: "sideways",
    });
    expect(parsed.status).toBeUndefined();
    expect(parsed.sort).toBe("newest");
  });

  it("only accepts exception=true", () => {
    expect(listQuerySchema.parse({ exception: "true" }).exception).toBe("true");
    expect(
      listQuerySchema.parse({ exception: "false" }).exception,
    ).toBeUndefined();
  });
});

describe("zodDetails", () => {
  it("flattens issues into field -> messages", () => {
    const schema = z.object({
      sender: z.string().min(1, "Sender name is required."),
      weight: z.number().positive("Weight must be greater than 0."),
    });
    const result = schema.safeParse({ sender: "", weight: -1 });
    expect(result.success).toBe(false);
    if (result.success) return;

    const details = zodDetails(result.error);
    expect(details.sender).toContain("Sender name is required.");
    expect(details.weight).toContain("Weight must be greater than 0.");
  });
});
