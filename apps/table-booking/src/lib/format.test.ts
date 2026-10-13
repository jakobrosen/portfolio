import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDuration,
  formatGuests,
  formatRange,
} from "./format";

describe("format", () => {
  it("formats durations", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });

  it("formats time ranges", () => {
    expect(formatRange(new Date("2026-10-13T18:00:00"), 90)).toBe(
      "18:00–19:30",
    );
  });

  it("formats guest counts", () => {
    expect(formatGuests(1)).toBe("1 guest");
    expect(formatGuests(4)).toBe("4 guests");
  });
});

describe("formatDate", () => {
  it("shows weekday, day and month", () => {
    expect(formatDate(new Date("2026-10-13T18:00:00"))).toBe("Tue 13 Oct");
  });
});
