import { describe, expect, it } from "vitest";
import { addMonths, dayKey, monthGrid, weekday } from "./calendar";

const day = (iso: string) => new Date(`${iso}T12:00:00`);

describe("calendar", () => {
  it("keys days by local date", () => {
    expect(dayKey(day("2026-10-03"))).toBe("2026-10-03");
  });

  it("counts weekdays from Monday", () => {
    expect(weekday(day("2026-10-12"))).toBe(0); // Monday
    expect(weekday(day("2026-10-18"))).toBe(6); // Sunday
  });

  it("moves by months, clamping to the month's last day", () => {
    expect(dayKey(addMonths(day("2026-01-31"), 1))).toBe("2026-02-28");
    expect(dayKey(addMonths(day("2026-10-13"), -1))).toBe("2026-09-13");
    expect(dayKey(addMonths(day("2026-12-05"), 1))).toBe("2027-01-05");
  });

  it("lays out six weeks starting on the Monday before the 1st", () => {
    const grid = monthGrid(day("2026-10-13"));
    expect(grid).toHaveLength(42);
    // 1 October 2026 is a Thursday.
    expect(dayKey(grid[0])).toBe("2026-09-28");
    expect(dayKey(grid[3])).toBe("2026-10-01");
    expect(dayKey(grid[41])).toBe("2026-11-08");
  });
});
