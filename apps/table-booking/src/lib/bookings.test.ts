import { describe, expect, it } from "vitest";
import type { Booking, Table } from "../types";
import {
  addDays,
  atTime,
  bookingsFor,
  conflicts,
  groupBookings,
  minutesIntoDay,
  nextFreeStart,
  nextSlot,
  startOfDay,
  statusAt,
  suggestTables,
} from "./bookings";
import { formatTime } from "./format";

const time = (hhmm: string, day = "2026-10-13") =>
  new Date(`${day}T${hhmm}:00`);

const booking = (
  id: string,
  start: string,
  durationMin = 90,
  extra: Partial<Booking> = {},
): Booking => ({
  id,
  tableId: "t1",
  guestName: id,
  partySize: 2,
  start: time(start).toISOString(),
  durationMin,
  ...extra,
});

const table = (id: string, seats: number): Table => ({
  id,
  label: id.toUpperCase(),
  shape: "rect",
  x: 0,
  y: 0,
  width: 120,
  height: 80,
  seats,
});

describe("statusAt", () => {
  const dinner = booking("dinner", "19:00");

  it("is vacant with nothing booked nearby", () => {
    expect(statusAt("t1", [dinner], time("17:00")).status).toBe("vacant");
    expect(statusAt("t1", [dinner], time("20:30")).status).toBe("vacant");
  });

  it("is upcoming within an hour of the start", () => {
    expect(statusAt("t1", [dinner], time("18:00")).status).toBe("upcoming");
    expect(statusAt("t1", [dinner], time("17:59")).status).toBe("vacant");
  });

  it("is reserved during the booking until the guests arrive", () => {
    expect(statusAt("t1", [dinner], time("19:10")).status).toBe("reserved");
  });

  it("is occupied once seated, even if they came early", () => {
    const early = { ...dinner, seatedAt: time("18:50").toISOString() };
    expect(statusAt("t1", [early], time("18:55"))).toEqual({
      status: "occupied",
      booking: early,
    });
    expect(statusAt("t1", [early], time("18:45")).status).toBe("upcoming");
  });

  it("ignores other tables", () => {
    const elsewhere = { ...dinner, tableId: "t2" };
    expect(statusAt("t1", [elsewhere], time("19:10")).status).toBe("vacant");
  });
});

describe("conflicts", () => {
  it("finds overlapping bookings on the same table only", () => {
    const first = booking("first", "18:00", 120);
    const overlapping = booking("overlapping", "19:30");
    const afterwards = booking("afterwards", "20:00");
    const otherTable = booking("other", "18:30", 90, { tableId: "t2" });

    const all = [first, overlapping, afterwards, otherTable];
    expect(conflicts(first, all)).toEqual([overlapping]);
    expect(conflicts(afterwards, all)).toEqual([overlapping]);
  });
});

describe("bookingsFor", () => {
  it("returns one table's bookings for one day, earliest first", () => {
    const late = booking("late", "21:00");
    const early = booking("early", "17:00");
    const tomorrow = {
      ...booking("tomorrow", "18:00"),
      start: time("18:00", "2026-10-14").toISOString(),
    };
    expect(bookingsFor([late, tomorrow, early], "t1", time("12:00"))).toEqual([
      early,
      late,
    ]);
  });
});

describe("suggestTables", () => {
  const tables = [
    table("t8", 8),
    table("t2", 2),
    table("t4", 4),
    table("t1", 4),
  ];

  it("suggests the smallest free tables that fit the party", () => {
    const busy = booking("busy", "19:00");
    const result = suggestTables(tables, [busy], {
      partySize: 3,
      start: time("19:30").toISOString(),
      durationMin: 90,
    });
    expect(result.map((t) => t.id)).toEqual(["t4", "t8"]);
  });
});

describe("nextSlot", () => {
  it("rounds up to the next quarter hour", () => {
    expect(formatTime(nextSlot(time("18:01")))).toBe("18:15");
    expect(formatTime(nextSlot(time("18:15")))).toBe("18:15");
    expect(formatTime(nextSlot(new Date(time("18:15").getTime() + 1000)))).toBe(
      "18:30",
    );
  });
});

describe("nextFreeStart", () => {
  it("skips past bookings that are in the way", () => {
    const dinner = booking("dinner", "19:00", 120);
    expect(formatTime(nextFreeStart("t1", [dinner], time("18:00"), 90))).toBe(
      "21:00",
    );
    expect(formatTime(nextFreeStart("t1", [dinner], time("17:00"), 90))).toBe(
      "17:00",
    );
  });
});

describe("groupBookings", () => {
  it("splits by now, upcoming and finished", () => {
    const lunch = booking("lunch", "12:00");
    const dinner = booking("dinner", "19:00");
    const early = booking("early", "20:00", 90, {
      seatedAt: time("19:40").toISOString(),
    });
    const late = booking("late", "21:00");
    const groups = groupBookings([late, early, dinner, lunch], time("19:45"));
    expect(groups.finished).toEqual([lunch]);
    expect(groups.now).toEqual([dinner, early]);
    expect(groups.upcoming).toEqual([late]);
  });
});

describe("atTime", () => {
  it("sets the time on the given day", () => {
    const date = atTime(time("09:00"), "18:45");
    expect(formatTime(date)).toBe("18:45");
    expect(date.getDate()).toBe(time("09:00").getDate());
  });
});

describe("day helpers", () => {
  it("finds the start of the day and moves between days", () => {
    const evening = time("19:30");
    expect(startOfDay(evening).getHours()).toBe(0);
    expect(startOfDay(evening).getDate()).toBe(evening.getDate());
    expect(addDays(evening, 1).getDate()).toBe(14);
    expect(formatTime(addDays(evening, -1))).toBe("19:30");
    expect(minutesIntoDay(evening)).toBe(19 * 60 + 30);
  });
});
