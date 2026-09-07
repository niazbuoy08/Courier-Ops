import { describe, expect, it } from "vitest";
import {
  applyDemoControls,
  escapeRegExp,
  generateTrackingId,
  isDuplicateKeyError,
  jsonError,
  transitionErrorMessage,
} from "./api-helpers";

describe("escapeRegExp", () => {
  it("escapes regex metacharacters so a search term matches literally", () => {
    const escaped = escapeRegExp("a.b*c(d)");
    expect(new RegExp(escaped).test("a.b*c(d)")).toBe(true);
    expect(new RegExp(escaped).test("axbxxcd")).toBe(false);
  });
});

describe("generateTrackingId", () => {
  it("produces a CX + 9-digit id", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateTrackingId()).toMatch(/^CX\d{9}$/);
    }
  });
});

describe("isDuplicateKeyError", () => {
  it("is true only for a Mongo 11000 error object", () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
    expect(isDuplicateKeyError({ code: 121 })).toBe(false);
    expect(isDuplicateKeyError(new Error("boom"))).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
    expect(isDuplicateKeyError("11000")).toBe(false);
  });
});

describe("transitionErrorMessage", () => {
  it("uses delivered-specific wording", () => {
    expect(transitionErrorMessage("Delivered", "In transit")).toMatch(
      /already been delivered/,
    );
  });

  it("uses generic forward-only wording otherwise", () => {
    expect(transitionErrorMessage("Pending", "Delivered")).toMatch(
      /one step at a time/,
    );
  });
});

describe("jsonError", () => {
  it("returns a Response with the status and the ApiError shape", async () => {
    const response = jsonError(404, "Not found");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });

  it("includes field details when given", async () => {
    const response = jsonError(400, "Check the form", { sender: ["Required"] });
    expect(await response.json()).toEqual({
      error: "Check the form",
      details: { sender: ["Required"] },
    });
  });
});

describe("applyDemoControls", () => {
  it("returns null when no demo params are present", async () => {
    const result = await applyDemoControls(new Request("http://localhost/api"));
    expect(result).toBeNull();
  });

  it("returns a 500 Response when ?fail=true", async () => {
    const result = await applyDemoControls(
      new Request("http://localhost/api?fail=true"),
    );
    expect(result).not.toBeNull();
    expect(result?.status).toBe(500);
  });

  it("delays but still proceeds (returns null) for ?delay", async () => {
    const start = Date.now();
    const result = await applyDemoControls(
      new Request("http://localhost/api?delay=40"),
    );
    expect(result).toBeNull();
    expect(Date.now() - start).toBeGreaterThanOrEqual(30);
  });
});
