import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatWeight,
} from "./format";

describe("formatWeight", () => {
  it("always shows one decimal place and the unit", () => {
    expect(formatWeight(2)).toBe("2.0 kg");
    expect(formatWeight(2.456)).toBe("2.5 kg");
    expect(formatWeight(0)).toBe("0.0 kg");
  });
});

describe("formatDate / formatDateTime", () => {
  it("renders a human date string for an ISO input", () => {
    // Locale-dependent formatting, so assert on stable substrings only.
    const iso = "2026-01-15T13:45:00.000Z";
    expect(formatDate(iso)).toMatch(/2026/);
    expect(formatDateTime(iso)).toMatch(/2026/);
    expect(formatDateTime(iso).length).toBeGreaterThan(formatDate(iso).length);
  });
});

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("describes a moment in the recent past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00.000Z"));
    expect(formatRelativeTime("2026-01-10T09:00:00.000Z")).toBe("3 hours ago");
    expect(formatRelativeTime("2026-01-08T12:00:00.000Z")).toBe("2 days ago");
  });

  it("describes a moment in the near future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00.000Z"));
    expect(formatRelativeTime("2026-01-10T14:00:00.000Z")).toBe("in 2 hours");
  });

  it("says 'now' for the current instant", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00.000Z"));
    expect(formatRelativeTime("2026-01-10T12:00:00.000Z")).toBe("now");
  });
});
