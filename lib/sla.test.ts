import { describe, expect, it } from "vitest";
import { SLA_TRANSIT_HOURS, assessSla, isSlaActionable, slaDueAt } from "./sla";

const HOUR = 60 * 60 * 1000;
const createdAt = "2026-01-01T00:00:00.000Z";
// Deadline is createdAt + 72h => 2026-01-04T00:00:00Z
const dueAtMs = new Date(createdAt).getTime() + SLA_TRANSIT_HOURS * HOUR;

describe("slaDueAt", () => {
  it("is createdAt plus the transit budget", () => {
    expect(slaDueAt(createdAt).toISOString()).toBe("2026-01-04T00:00:00.000Z");
  });
});

describe("assessSla — in flight", () => {
  it("is on-track when the deadline is comfortably ahead", () => {
    const result = assessSla({
      status: "In transit",
      createdAt,
      now: new Date(dueAtMs - 40 * HOUR),
    });
    expect(result.state).toBe("on-track");
    expect(result.hoursRemaining).toBe(40);
    expect(result.dueAt).toBe("2026-01-04T00:00:00.000Z");
  });

  it("is at-risk once inside the 24h risk window", () => {
    expect(
      assessSla({
        status: "Out for delivery",
        createdAt,
        now: new Date(dueAtMs - 5 * HOUR),
      }).state,
    ).toBe("at-risk");
  });

  it("is breached once past the deadline", () => {
    const result = assessSla({
      status: "In transit",
      createdAt,
      now: new Date(dueAtMs + 10 * HOUR),
    });
    expect(result.state).toBe("breached");
    expect(result.hoursRemaining).toBe(-10);
  });

  it("treats a legacy Delayed package as in flight", () => {
    expect(
      assessSla({
        status: "Delayed",
        createdAt,
        now: new Date(dueAtMs + HOUR),
      }).state,
    ).toBe("breached");
  });
});

describe("assessSla — delivered", () => {
  it("is met when delivered on or before the deadline", () => {
    expect(
      assessSla({
        status: "Delivered",
        createdAt,
        deliveredAt: new Date(dueAtMs - 6 * HOUR),
      }).state,
    ).toBe("met");
  });

  it("is missed when delivered after the deadline", () => {
    const result = assessSla({
      status: "Delivered",
      createdAt,
      deliveredAt: new Date(dueAtMs + 6 * HOUR),
    });
    expect(result.state).toBe("missed");
    expect(result.hoursRemaining).toBe(-6);
  });
});

describe("isSlaActionable", () => {
  it("flags only at-risk and breached", () => {
    expect(isSlaActionable("at-risk")).toBe(true);
    expect(isSlaActionable("breached")).toBe(true);
    expect(isSlaActionable("on-track")).toBe(false);
    expect(isSlaActionable("met")).toBe(false);
    expect(isSlaActionable("missed")).toBe(false);
  });
});
