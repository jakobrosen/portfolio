import { describe, expect, it } from "vitest";
import type { Booking, Table } from "../types";
import { bookingsFor, conflicts, statusAt, suggestTables } from "./bookings";

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
