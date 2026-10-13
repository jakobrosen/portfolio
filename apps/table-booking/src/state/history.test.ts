import { describe, expect, it } from "vitest";
import { createDemoState } from "./demo";
import { historyReducer, startHistory } from "./history";

const start = startHistory(createDemoState(new Date("2026-10-13T18:00:00")));
const seatsOf = (history: typeof start) =>
  history.present.tables.find((t) => t.id === "t9")?.seats;

describe("historyReducer", () => {
  it("undoes and redoes a change", () => {
    const removed = historyReducer(start, { type: "removeTable", id: "t1" });
    const undone = historyReducer(removed, { type: "undo" });
    expect(undone.present).toBe(start.present);
    const redone = historyReducer(undone, { type: "redo" });
    expect(redone.present).toBe(removed.present);
  });

  it("merges changes with the same coalesce key into one step", () => {
    let history = start;
    for (const seats of [7, 6, 5]) {
      history = historyReducer(history, {
        type: "updateTable",
        id: "t9",
        changes: { seats },
        coalesce: "seats:t9",
      });
    }
    expect(seatsOf(history)).toBe(5);
    expect(history.past).toHaveLength(1);
    expect(seatsOf(historyReducer(history, { type: "undo" }))).toBe(8);
  });

  it("starts a new step after a different change", () => {
    let history = historyReducer(start, {
      type: "updateTable",
      id: "t9",
      changes: { seats: 7 },
      coalesce: "seats:t9",
    });
    history = historyReducer(history, { type: "removeBooking", id: "b1" });
    history = historyReducer(history, {
      type: "updateTable",
      id: "t9",
      changes: { seats: 6 },
      coalesce: "seats:t9",
    });
    expect(history.past).toHaveLength(3);
  });

  it("clears redo after a new change, and ignores undo with no history", () => {
    const removed = historyReducer(start, { type: "removeTable", id: "t1" });
    const undone = historyReducer(removed, { type: "undo" });
    const changed = historyReducer(undone, { type: "removeTable", id: "t2" });
    expect(changed.future).toEqual([]);
    expect(historyReducer(start, { type: "undo" })).toBe(start);
  });
});
