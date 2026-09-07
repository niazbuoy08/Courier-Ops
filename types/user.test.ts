import { describe, expect, it } from "vitest";
import { USER_ROLES, canWrite, isUserRole } from "./user";

describe("isUserRole", () => {
  it("accepts the known roles only", () => {
    for (const role of USER_ROLES) {
      expect(isUserRole(role)).toBe(true);
    }
    expect(isUserRole("admin")).toBe(false);
    expect(isUserRole(undefined)).toBe(false);
    expect(isUserRole(1)).toBe(false);
  });
});

describe("canWrite", () => {
  it("is true only for a dispatcher", () => {
    expect(canWrite("dispatcher")).toBe(true);
    expect(canWrite("viewer")).toBe(false);
    expect(canWrite(undefined)).toBe(false);
    expect(canWrite(null)).toBe(false);
  });
});
