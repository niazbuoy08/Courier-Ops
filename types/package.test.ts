import { describe, expect, it } from "vitest";
import {
  PACKAGE_STATUSES,
  PACKAGE_STATUS_FLOW,
  canTransition,
  isExceptionReason,
  isPackageStatus,
  nextStatusInFlow,
  type PackageStatus,
} from "./package";

describe("isPackageStatus", () => {
  it("accepts every known status", () => {
    for (const status of PACKAGE_STATUSES) {
      expect(isPackageStatus(status)).toBe(true);
    }
  });

  it("rejects unknown or non-string values", () => {
    expect(isPackageStatus("Shipped")).toBe(false);
    expect(isPackageStatus("delivered")).toBe(false); // case-sensitive
    expect(isPackageStatus(undefined)).toBe(false);
    expect(isPackageStatus(42)).toBe(false);
  });
});

describe("isExceptionReason", () => {
  it("accepts a known reason and rejects others", () => {
    expect(isExceptionReason("Wrong address")).toBe(true);
    expect(isExceptionReason("Aliens")).toBe(false);
    expect(isExceptionReason(null)).toBe(false);
  });
});

describe("canTransition", () => {
  it("allows each forward step along the happy path", () => {
    for (let i = 0; i < PACKAGE_STATUS_FLOW.length - 1; i++) {
      expect(
        canTransition(PACKAGE_STATUS_FLOW[i], PACKAGE_STATUS_FLOW[i + 1]),
      ).toBe(true);
    }
  });

  it("forbids moving backwards", () => {
    expect(canTransition("In transit", "Picked up")).toBe(false);
    expect(canTransition("Delivered", "Out for delivery")).toBe(false);
  });

  it("forbids skipping a step", () => {
    expect(canTransition("Pending", "In transit")).toBe(false);
    expect(canTransition("Picked up", "Delivered")).toBe(false);
  });

  it("forbids a no-op transition to the same status", () => {
    for (const status of PACKAGE_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it("treats Delivered as terminal", () => {
    const targets = PACKAGE_STATUSES.filter((s) => s !== "Delivered");
    for (const target of targets) {
      expect(canTransition("Delivered", target)).toBe(false);
    }
  });

  it("lets a legacy Delayed package rejoin the flow", () => {
    expect(canTransition("Delayed", "In transit")).toBe(true);
    expect(canTransition("Delayed", "Out for delivery")).toBe(true);
    expect(canTransition("Delayed", "Delivered")).toBe(true);
    expect(canTransition("Delayed", "Pending")).toBe(false);
    expect(canTransition("Delayed", "Picked up")).toBe(false);
  });
});

describe("nextStatusInFlow", () => {
  it("returns the next step for each in-flight status", () => {
    const expected: Record<string, PackageStatus | null> = {
      Pending: "Picked up",
      "Picked up": "In transit",
      "In transit": "Out for delivery",
      "Out for delivery": "Delivered",
      Delivered: null,
    };
    for (const [from, to] of Object.entries(expected)) {
      expect(nextStatusInFlow(from as PackageStatus)).toBe(to);
    }
  });

  it("routes a Delayed package back to In transit", () => {
    expect(nextStatusInFlow("Delayed")).toBe("In transit");
  });
});
