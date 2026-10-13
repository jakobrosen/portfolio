import { describe, expect, it } from "vitest";
import { createDemoState } from "./demo";
import { reducer } from "./reducer";

const state = createDemoState(new Date("2026-10-13T18:00:00"));

describe("reducer", () => {
  it("updates only the targeted table", () => {
    const next = reducer(state, {
      type: "updateTable",
      id: "t1",
      changes: { label: "Window" },
    });
    expect(next.tables.find((t) => t.id === "t1")?.label).toBe("Window");
    expect(next.tables.find((t) => t.id === "t2")).toBe(
      state.tables.find((t) => t.id === "t2"),
    );
  });

  it("removes a table together with its bookings", () => {
    const next = reducer(state, { type: "removeTable", id: "t1" });
    expect(next.tables.some((t) => t.id === "t1")).toBe(false);
    expect(next.bookings.some((b) => b.tableId === "t1")).toBe(false);
    expect(next.bookings.length).toBeGreaterThan(0);
  });

  it("adds, updates and removes bookings", () => {
    const added = reducer(state, {
      type: "addBooking",
      booking: {
        id: "new",
        tableId: "t8",
        guestName: "Test",
        partySize: 2,
        start: "2026-10-13T19:00:00.000Z",
        durationMin: 60,
      },
    });
    const seated = reducer(added, {
      type: "updateBooking",
      id: "new",
      changes: { seatedAt: "2026-10-13T19:05:00.000Z" },
    });
    expect(seated.bookings.at(-1)?.seatedAt).toBe("2026-10-13T19:05:00.000Z");

    const removed = reducer(seated, { type: "removeBooking", id: "new" });
    expect(removed.bookings).toHaveLength(state.bookings.length);
  });
});

describe("createDemoState", () => {
  it("only references tables that exist", () => {
    const ids = new Set(state.tables.map((t) => t.id));
    expect(state.bookings.every((b) => ids.has(b.tableId))).toBe(true);
  });

  it("never seats more guests than the table has chairs", () => {
    for (const booking of state.bookings) {
      const table = state.tables.find((t) => t.id === booking.tableId)!;
      expect(booking.partySize).toBeLessThanOrEqual(table.seats);
    }
  });
});
