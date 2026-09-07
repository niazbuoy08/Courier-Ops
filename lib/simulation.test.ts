import { describe, expect, it } from "vitest";
import { PACKAGE_STATUSES } from "@/types/package";
import { simulatedLocation } from "./simulation";

describe("simulatedLocation", () => {
  const address = "8330 Birch Ln, Chicago, IL";

  it("returns a non-empty scan line for every status", () => {
    for (const status of PACKAGE_STATUSES) {
      expect(simulatedLocation(status, address).length).toBeGreaterThan(0);
    }
  });

  it("folds the destination city into the late-stage scans", () => {
    expect(simulatedLocation("Out for delivery", address)).toContain(
      "Chicago, IL",
    );
    expect(simulatedLocation("Delivered", address)).toBe(
      "Delivered — Chicago, IL",
    );
  });

  it("keeps early-stage scans at the origin/hub, not the destination", () => {
    expect(simulatedLocation("Pending", address)).toBe(
      "Awaiting pickup — origin facility",
    );
    expect(simulatedLocation("In transit", address)).toBe(
      "In transit — regional sort hub",
    );
  });

  it("falls back to the raw address when it has no city/state tail", () => {
    expect(simulatedLocation("Delivered", "Warehouse 4")).toBe(
      "Delivered — Warehouse 4",
    );
  });
});
